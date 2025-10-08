# Specification

## Overview

An MCP (Model Context Protocol) server that automatically indexes document files (Markdown, HTML, plain text) in a directory and provides them to LLMs.

### Concept
- **No additional markup required**: Works out-of-the-box without frontmatter
- **Multiple format support**: Auto-recognizes .md, .html, .txt
- **Automatic metadata extraction**: Automatically extracts titles and descriptions
- **Efficient access**: Quick access to needed documents via search functionality

---

## Supported File Formats

- `.md` - Markdown
- `.html` - HTML
- `.txt` - Plain text

---

## Automatic Metadata Extraction Logic

### Markdown Files (.md)

**Title extraction priority:**
1. Frontmatter `title` field
2. First `# heading` (H1)
3. Filename (without extension)

**Description extraction priority:**
1. Frontmatter `description` field
2. First paragraph (first text block that isn't a heading)
3. Trimmed to ~150 characters

**Tags:**
- Use frontmatter `tags` array if available
- Empty array if not present

### HTML Files (.html)

**Title extraction priority:**
1. `<title>` tag
2. First `<h1>` tag
3. Filename (without extension)

**Description extraction priority:**
1. `<meta name="description" content="...">` tag
2. First `<p>` tag text
3. Trimmed to ~150 characters

**Content processing:**
- Convert HTML tags to markdown text
- Exclude script and style tags

### Text Files (.txt)

**Title extraction:**
- Use first line as title
- Use filename if first line is empty

**Description extraction:**
- Content from lines 2-4
- Trimmed to ~150 characters

**Content:**
- Provide entire file as-is

---

## MCP Specification Implementation

### Capabilities

```json
{
  "capabilities": {
    "resources": {
      "subscribe": false,
      "listChanged": true
    },
    "tools": {}
  }
}
```

---

## Resources

### URI Scheme

```
docs://README.md
docs://guides/getting-started.md
docs://api/reference.html
docs://notes/memo.txt
```

### resources/list

**Request:**
```json
{
  "method": "resources/list"
}
```

**Response:**
```json
{
  "resources": [
    {
      "uri": "docs://README.md",
      "name": "README.md",
      "title": "Project Overview",
      "description": "This project is...",
      "mimeType": "text/markdown",
    }
  ]
}
```

### resources/read

**Request:**
```json
{
  "method": "resources/read",
  "params": {
    "uri": "docs://guides/setup.md"
  }
}
```

**Response:**
```json
{
  "contents": [
    {
      "uri": "docs://guides/setup.md",
      "mimeType": "text/markdown",
      "text": "# Setup Guide\n\n## Requirements\n\n..."
    }
  ]
}
```

---

## Tools

### search_documents

**Definition:**
```typescript
{
  name: "search_documents",
  description: "Search documents by title or content",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query"
      },
      searchIn: {
        type: "string",
        enum: ["title", "content", "both"],
        description: "Search target: title, content, or both",
        default: "both"
      },
      limit: {
        type: "number",
        description: "Maximum number of results",
        default: 10
      },
      fileTypes: {
        type: "array",
        items: { type: "string" },
        description: "File extensions to search"
      }
    },
    required: ["query"]
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Search results: 3 matches\n\n1. docs://guides/setup.md - \"Setup Guide\" (relevance: 0.95)\n   Excerpt: ...installation steps are as follows...\n   Match location: content"
    }
  ]
}
```

---

## Server Startup

**Directory specification:**
- Command-line argument: `deno run jsr:@toms/mcp-serve /path/to/documents`
- Default: `.`