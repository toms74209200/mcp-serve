# mcp-serve

[![JSR](https://jsr.io/badges/@toms/mcp-serve)](https://jsr.io/@toms/mcp-serve)
![GitHub tag (with filter)](https://img.shields.io/github/v/tag/toms74209200/mcp-serve)

Model Context Protocol(MCP) server for serving documentation.

## Requirements

- Deno 2.0.0 or later (recommended)

## Usage

### Using Deno

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

### Using Pre-built Binary (Linux)

If you want to use mcp-serve as a single binary without installing Deno:

```bash
ARCH=$(uname -m) && \
case "$ARCH" in
    x86_64) BINARY="mcp-serve-x86_64-unknown-linux-gnu";;
    aarch64|arm64) BINARY="mcp-serve-aarch64-unknown-linux-gnu";;
    *) echo "Unsupported architecture: $ARCH"; exit 1;;
esac && \
VERSION=$(curl -s https://api.github.com/repos/toms74209200/mcp-serve/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/') && \
sudo mkdir -p /opt/mcp-serve && \
sudo curl -L -o /opt/mcp-serve/mcp-serve "https://github.com/toms74209200/mcp-serve/releases/download/${VERSION}/${BINARY}" && \
sudo chmod +x /opt/mcp-serve/mcp-serve && \
sudo ln -sf /opt/mcp-serve/mcp-serve /usr/local/bin/mcp-serve
```

```bash
mcp-serve [directory]
```

**`mcp.json`**

```json
{
  "servers": {
    "mcp-serve": {
      "type": "stdio",
      "command": "mcp-serve",
      "args": [
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