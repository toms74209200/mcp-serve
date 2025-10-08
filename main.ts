import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { extractMetadata } from "./src/metadata.ts";
import { extname, join, relative } from "@std/path";
import { walk } from "@std/fs";

const directory = Deno.args[0] || ".";

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

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const SUPPORTED_EXTENSIONS = [".md", ".html", ".txt"] as const;

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
    const content = await Deno.readTextFile(filePath);
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

const transport = new StdioServerTransport();
await server.connect(transport);
