import { expect, test } from "vitest";
import { parseFile } from "./content-parser.ts";

test("when parseFile with markdown frontmatter title then returns title from frontmatter", () => {
  const content = `---
title: My Title
---

# Heading

Content here.`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.title).toBe("My Title");
  expect(result.textContent).toBe(content);
});

test("when parseFile with markdown without frontmatter then returns title from first H1", () => {
  const content = `# My Heading

Content here.`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.title).toBe("My Heading");
});

test("when parseFile with markdown without frontmatter and H1 then returns filename without extension", () => {
  const content = `Content here.`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.title).toBe("test");
});

test("when parseFile with markdown frontmatter description then returns description from frontmatter", () => {
  const content = `---
title: My Title
description: My description
---

Content here.`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.description).toBe("My description");
});

test("when parseFile with markdown without frontmatter description then returns first paragraph", () => {
  const content = `# Title

This is the first paragraph.

Second paragraph.`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.description).toBe("This is the first paragraph.");
});

test("when parseFile with long description then trims to 150 characters", () => {
  const content = `# Title

${"a".repeat(200)}`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.description.length).toBeLessThanOrEqual(150);
});

test("when parseFile with frontmatter tags then returns tags from frontmatter", () => {
  const content = `---
title: My Title
tags: [tag1, tag2]
---

Content.`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.tags).toEqual(["tag1", "tag2"]);
});

test("when parseFile with no tags then returns empty array", () => {
  const content = `# Title

Content.`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.tags).toEqual([]);
});

test("when parseFile with mdx frontmatter then returns metadata from frontmatter", () => {
  const content = `---
title: MDX Title
description: MDX description
---

# Heading

<CustomComponent />

Content here.`;

  const result = parseFile(content, "test.mdx");
  expect(result.metadata.title).toBe("MDX Title");
  expect(result.metadata.description).toBe("MDX description");
});

test("when parseFile with mdx custom JSX components then removes JSX from text content", () => {
  const content = `---
title: MDX with JSX
---

# Main Heading

<CustomComponent prop="value">
  Some content inside component
</CustomComponent>

Regular paragraph text.

<AnotherComponent />`;

  const result = parseFile(content, "test.mdx");
  expect(result.metadata.title).toBe("MDX with JSX");
  expect(result.textContent).not.toContain("<CustomComponent");
  expect(result.textContent).not.toContain("<AnotherComponent");
});

test("when parseFile with mdx standard HTML tags then parses correctly", () => {
  const content = `# HTML in MDX

<div>
  <p>This is a paragraph in a div.</p>
</div>

Regular text.`;

  const result = parseFile(content, "test.mdx");
  expect(result.metadata.title).toBe("HTML in MDX");
  expect(result.metadata.description).toContain("paragraph");
});

test("when parseFile with mdx filename then removes mdx extension", () => {
  const content = `Content.`;

  const result = parseFile(content, "my-file.mdx");
  expect(result.metadata.title).toBe("my-file");
});

test("when parseFile with rst underlined title then returns title", () => {
  const content = `My Title
========

First paragraph here.`;

  const result = parseFile(content, "test.rst");
  expect(result.metadata.title).toBe("My Title");
  expect(result.textContent).toBe(content);
});

test("when parseFile with rst title then returns first paragraph as description", () => {
  const content = `My Title
========

This is the first paragraph.

Second paragraph.`;

  const result = parseFile(content, "test.rst");
  expect(result.metadata.title).toBe("My Title");
  expect(result.metadata.description).toBe("This is the first paragraph.");
});

test("when parseFile with rst directives then skips directives in description", () => {
  const content = `My Title
========

:some-directive: value

.. code-block:: python

    print("hello")

This is the first real paragraph.`;

  const result = parseFile(content, "test.rst");
  expect(result.metadata.title).toBe("My Title");
  expect(result.metadata.description).toBe("This is the first real paragraph.");
});

test("when parseFile with rst different underline characters then recognizes title", () => {
  const content = `Section Title
-------------

Content here.`;

  const result = parseFile(content, "test.rst");
  expect(result.metadata.title).toBe("Section Title");
  expect(result.metadata.description).toBe("Content here.");
});

test("when parseFile with rst filename then removes rst extension", () => {
  const content = `Content.`;

  const result = parseFile(content, "my-file.rst");
  expect(result.metadata.title).toBe("my-file");
});

test("when parseFile with html then extracts text content and metadata", () => {
  const content = `<!DOCTYPE html>
<html>
<head>
  <title>HTML Title</title>
</head>
<body>
  <h1>Main Heading</h1>
  <p>This is a paragraph.</p>
</body>
</html>`;

  const result = parseFile(content, "test.html");
  expect(result.metadata.title).toBe("HTML Title");
  expect(result.textContent).toContain("Main Heading");
  expect(result.textContent).not.toContain("<html>");
});

test("when parseFile with markdown then returns metadata", () => {
  const content = `---
title: My Title
---

# Heading`;

  const result = parseFile(content, "test.md");
  expect(result.metadata.title).toBe("My Title");
});

test("when parseFile with html then returns text content", () => {
  const content = `<html><body><p>Text</p></body></html>`;

  const result = parseFile(content, "test.html");
  expect(result.textContent).toContain("Text");
  expect(result.textContent).not.toContain("<html>");
});

test("when parseFile with markdown then returns content as-is", () => {
  const content = `# Title\n\nContent.`;

  const result = parseFile(content, "test.md");
  expect(result.textContent).toBe(content);
});

test("when parseFile with txt extension then processes as markdown", () => {
  const content = `# Title\n\nContent.`;

  const result = parseFile(content, "test.txt");
  expect(result.metadata.title).toBe("Title");
  expect(result.textContent).toBe(content);
});

test("when parseFile with unknown extension then uses filename fallback", () => {
  const content = `Content.`;

  const result = parseFile(content, "test.unknown");
  expect(result.metadata.title).toBe("test");
  expect(result.textContent).toBe(content);
});
