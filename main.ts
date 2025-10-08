import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { extractMetadata } from "./src/metadata.ts";
import { extname, relative } from "@std/path";
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

const transport = new StdioServerTransport();
await server.connect(transport);
