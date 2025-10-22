import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { extractMetadata } from "./src/metadata.ts";
import { convertHtmlToText } from "./src/html-converter.ts";
import { convertMdxToText } from "./src/mdx-converter.ts";
import { extname, join, relative } from "@std/path";
import { walk } from "@std/fs";
import MiniSearch from "minisearch";

const directory = Deno.args[0] || ".";
const SUPPORTED_EXTENSIONS = [".md", ".mdx", ".html", ".txt", ".rst"] as const;

const server = new Server(
  {
    name: "mcp-serve",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {
        subscribe: false,
        listChanged: true,
      },
      tools: {},
    },
  },
);

const miniSearch = new MiniSearch({
  fields: ["title", "content"],
  storeFields: ["title", "description", "uri", "name"],
  searchOptions: {
    boost: { title: 2 },
    fuzzy: 0.2,
  },
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const entries = await Array.fromAsync(
    walk(directory, { includeDirs: false }),
  );
  const resources = await Promise.all(
    entries
      .filter((entry) =>
        (SUPPORTED_EXTENSIONS as readonly string[]).includes(
          extname(entry.path),
        )
      )
      .map(async (entry) => {
        const content = await Deno.readTextFile(entry.path);
        const metadata = extractMetadata(content, entry.name);

        return {
          uri: `docs://${relative(directory, entry.path)}`,
          name: entry.name,
          title: metadata.title,
          description: metadata.description,
          mimeType: "text/markdown",
        };
      }),
  );

  miniSearch.removeAll();
  miniSearch.addAll(
    resources.map((resource, index) => ({
      id: index.toString(),
      uri: resource.uri,
      name: resource.name,
      title: resource.title,
      description: resource.description,
      content: `${resource.title} ${resource.description}`,
    })),
  );

  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (!uri.startsWith("docs://")) {
    throw new Error(`Unsupported URI scheme: ${uri}`);
  }

  const relativePath = uri.slice("docs://".length);
  const filePath = join(directory, relativePath);

  try {
    let content = await Deno.readTextFile(filePath);
    const ext = extname(filePath);

    if (ext === ".html") {
      const converted = convertHtmlToText(content);
      content = converted.textContent;
    } else if (ext === ".mdx") {
      content = convertMdxToText(content);
    }

    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: content,
        },
      ],
    };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Resource not found: ${uri}`);
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      throw new Error(`Permission denied: ${uri}`);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read file: ${message}`);
  }
});

server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: [
      {
        name: "search_documents",
        description: "Search documents by title or content",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            searchIn: {
              type: "string",
              enum: ["title", "content", "both"],
              description: "Search target: title, content, or both",
              default: "both",
            },
            limit: {
              type: "number",
              description: "Maximum number of results",
              default: 10,
            },
            fileTypes: {
              type: "array",
              items: { type: "string" },
              description: "File extensions to search (e.g., ['.md', '.html'])",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, (request) => {
  if (request.params.name === "search_documents") {
    const {
      query,
      searchIn = "both",
      limit = 10,
      fileTypes = SUPPORTED_EXTENSIONS,
    } = request.params.arguments as {
      query: string;
      searchIn?: "title" | "content" | "both";
      limit?: number;
      fileTypes?: string[];
    };

    const results = miniSearch.search(query, {
      fuzzy: 0.2,
      ...(searchIn === "title" ? { fields: ["title"] } : {}),
      ...(searchIn === "content" ? { fields: ["content"] } : {}),
    })
      .filter((result) =>
        !fileTypes?.length ||
        fileTypes.some((ext) => result.name.endsWith(ext))
      )
      .toSpliced(limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query,
              searchIn,
              totalResults: results.length,
              results: results.map((result) => ({
                uri: result.uri,
                title: result.title,
                description: result.description,
                score: result.score,
              })),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
