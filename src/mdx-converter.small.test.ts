import { expect, test } from "vitest";
import { convertMdxToText } from "./mdx-converter.ts";

test("when mdx has frontmatter then removes it", () => {
  const content = `---
title: Test
---

# Heading

Content`;

  const result = convertMdxToText(content);
  expect(result).not.toContain("---");
  expect(result).not.toContain("title: Test");
  expect(result).toContain("# Heading");
  expect(result).toContain("Content");
});

test("when mdx has custom component with closing tag then removes it", () => {
  const content = `# Heading

<CustomComponent prop="value">
  Content inside
</CustomComponent>

Regular text`;

  const result = convertMdxToText(content);
  expect(result).not.toContain("<CustomComponent");
  expect(result).not.toContain("</CustomComponent>");
  expect(result).toContain("# Heading");
  expect(result).toContain("Regular text");
});

test("when mdx has self-closing custom component then removes it", () => {
  const content = `# Heading

<CustomComponent />

Regular text`;

  const result = convertMdxToText(content);
  expect(result).not.toContain("<CustomComponent");
  expect(result).toContain("# Heading");
  expect(result).toContain("Regular text");
});

test("when mdx has multiple custom components then removes all", () => {
  const content = `# Heading

<FirstComponent>
  Content
</FirstComponent>

<SecondComponent />

<ThirdComponent attr="value">
  More content
</ThirdComponent>

Final text`;

  const result = convertMdxToText(content);
  expect(result).not.toContain("<FirstComponent");
  expect(result).not.toContain("<SecondComponent");
  expect(result).not.toContain("<ThirdComponent");
  expect(result).toContain("# Heading");
  expect(result).toContain("Final text");
});

test("when mdx has standard html tags then keeps them", () => {
  const content = `# Heading

<div>
  <p>Paragraph</p>
</div>

Regular text`;

  const result = convertMdxToText(content);
  expect(result).toContain("<div>");
  expect(result).toContain("<p>Paragraph</p>");
  expect(result).toContain("</div>");
  expect(result).toContain("# Heading");
  expect(result).toContain("Regular text");
});

test("when mdx has no frontmatter and no components then returns as is", () => {
  const content = `# Heading

Regular markdown content`;

  const result = convertMdxToText(content);
  expect(result).toBe(content);
});
