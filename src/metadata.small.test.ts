import { expect, test } from "vitest";
import { extractMetadata } from "./metadata.ts";

test("when frontmatter has title then returns title from frontmatter", () => {
  const content = `---
title: My Title
---

# Heading

Content here.`;

  const result = extractMetadata(content, "test.md");
  expect(result.title).toBe("My Title");
});

test("when no frontmatter then returns title from first H1", () => {
  const content = `# My Heading

Content here.`;

  const result = extractMetadata(content, "test.md");
  expect(result.title).toBe("My Heading");
});

test("when no frontmatter and no H1 then returns filename without extension", () => {
  const content = `Content here.`;

  const result = extractMetadata(content, "test.md");
  expect(result.title).toBe("test");
});

test("when frontmatter has description then returns description from frontmatter", () => {
  const content = `---
title: My Title
description: My description
---

Content here.`;

  const result = extractMetadata(content, "test.md");
  expect(result.description).toBe("My description");
});

test("when no frontmatter description then returns first paragraph", () => {
  const content = `# Title

This is the first paragraph.

Second paragraph.`;

  const result = extractMetadata(content, "test.md");
  expect(result.description).toBe("This is the first paragraph.");
});

test("when description is long then trims to 150 characters", () => {
  const content = `# Title

${"a".repeat(200)}`;

  const result = extractMetadata(content, "test.md");
  expect(result.description.length).toBeLessThanOrEqual(150);
});

test("when frontmatter has tags then returns tags from frontmatter", () => {
  const content = `---
title: My Title
tags: [tag1, tag2]
---

Content.`;

  const result = extractMetadata(content, "test.md");
  expect(result.tags).toEqual(["tag1", "tag2"]);
});

test("when no tags then returns empty array", () => {
  const content = `# Title

Content.`;

  const result = extractMetadata(content, "test.md");
  expect(result.tags).toEqual([]);
});

test("when mdx file with frontmatter then returns metadata from frontmatter", () => {
  const content = `---
title: MDX Title
description: MDX description
---

# Heading

<CustomComponent />

Content here.`;

  const result = extractMetadata(content, "test.mdx");
  expect(result.title).toBe("MDX Title");
  expect(result.description).toBe("MDX description");
});

test("when mdx file with custom JSX components then extracts text content", () => {
  const content = `---
title: MDX with JSX
---

# Main Heading

<CustomComponent prop="value">
  Some content inside component
</CustomComponent>

Regular paragraph text.

<AnotherComponent />`;

  const result = extractMetadata(content, "test.mdx");
  expect(result.title).toBe("MDX with JSX");
});

test("when mdx file with standard HTML tags then parses correctly", () => {
  const content = `# HTML in MDX

<div>
  <p>This is a paragraph in a div.</p>
</div>

Regular text.`;

  const result = extractMetadata(content, "test.mdx");
  expect(result.title).toBe("HTML in MDX");
  expect(result.description).toContain("paragraph");
});

test("when mdx filename then removes mdx extension", () => {
  const content = `Content.`;

  const result = extractMetadata(content, "my-file.mdx");
  expect(result.title).toBe("my-file");
});

test("when rst file with underlined title then returns title", () => {
  const content = `My Title
========

First paragraph here.`;

  const result = extractMetadata(content, "test.rst");
  expect(result.title).toBe("My Title");
});

test("when rst file with title then returns first paragraph as description", () => {
  const content = `My Title
========

This is the first paragraph.

Second paragraph.`;

  const result = extractMetadata(content, "test.rst");
  expect(result.title).toBe("My Title");
  expect(result.description).toBe("This is the first paragraph.");
});

test("when rst file with directives then skips directives in description", () => {
  const content = `My Title
========

:some-directive: value

.. code-block:: python

    print("hello")

This is the first real paragraph.`;

  const result = extractMetadata(content, "test.rst");
  expect(result.title).toBe("My Title");
  expect(result.description).toBe("This is the first real paragraph.");
});

test("when rst file with different underline characters then recognizes title", () => {
  const content = `Section Title
-------------

Content here.`;

  const result = extractMetadata(content, "test.rst");
  expect(result.title).toBe("Section Title");
  expect(result.description).toBe("Content here.");
});

test("when rst filename then removes rst extension", () => {
  const content = `Content.`;

  const result = extractMetadata(content, "my-file.rst");
  expect(result.title).toBe("my-file");
});
