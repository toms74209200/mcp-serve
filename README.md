# mcp-serve

[![JSR](https://jsr.io/badges/@toms/mcp-serve)](https://jsr.io/@toms/mcp-serve)
![GitHub tag (with filter)](https://img.shields.io/github/v/tag/toms74209200/mcp-serve)

Model Context Protocol(MCP) server for serving documentation.

## Requirements

- Deno 2.0.0 or later (recommended)

## Usage

To use it from Deno, you need the file read and environment variable permissions.

```bash
deno run --allow-read --allow-env jsr:@toms/mcp-serve [directory]
```

If no directory is specified, the current directory (`.`) will be used.

To use it from MCP client, you need to set up the server configuration below.

For Visual Studio Code:

**`mcp.json`**

```json
{
  "servers": {
    "mcp-serve": {
      "type": "stdio",
      "command": "deno",
      "args": [
        "run",
        "--allow-read",
        "--allow-env",
        "jsr:@toms/mcp-serve",
        "/path/to/your/docs"
      ]
    }
  }
}
```

### Example: Serving Next.js Documentation

Clone the repository with sparse-checkout and blobless clone:

```bash
git clone --filter=blob:none --sparse https://github.com/vercel/next.js.git nextjs-docs \
cd nextjs-docs \
git sparse-checkout set docs \
git checkout canary
```

Serve the docs with mcp-serve:

```bash
deno run --allow-read --allow-env jsr:@toms/mcp-serve nextjs-docs/docs
```

**`mcp.json`**

```json
{
  "servers": {
    "nextjs-docs": {
      "type": "stdio",
      "command": "deno",
      "args": [
        "run",
        "--allow-read",
        "--allow-env",
        "jsr:@toms/mcp-serve",
        "/path/to/nextjs-docs/docs"
      ]
    }
  }
}
```

## Development

- [Deno](https://deno.com/)
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- [MiniSearch](https://github.com/lucaong/minisearch)

## License

[MIT License](LICENSE)

## Author

[toms74209200](<https://github.com/toms74209200>)