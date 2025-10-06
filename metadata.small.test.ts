import { expect, test } from "vitest";
import { extractMetadata } from "./main.ts";

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
