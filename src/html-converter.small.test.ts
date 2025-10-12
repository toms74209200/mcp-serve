import { describe, expect, it } from "vitest";
import { convertHtmlToText } from "./html-converter.ts";

describe("convertHtmlToText", () => {
  it("should extract text content from simple HTML", () => {
    const html = `
      <html>
        <head><title>Test Title</title></head>
        <body>
          <h1>Test Title</h1>
          <p>This is a test paragraph.</p>
        </body>
      </html>
    `;

    const result = convertHtmlToText(html);

    expect(result.title).toBe("Test Title");
    expect(result.textContent).toContain("This is a test paragraph");
  });

  it("should extract excerpt from HTML", () => {
    const html = `
      <html>
        <head><title>Article Title</title></head>
        <body>
          <article>
            <h1>Article Title</h1>
            <p>First paragraph as excerpt. This needs to be longer to be recognized as an article by Readability.</p>
            <p>Second paragraph with more content here.</p>
            <p>Third paragraph to ensure sufficient content.</p>
          </article>
        </body>
      </html>
    `;

    const result = convertHtmlToText(html);

    expect(result.title).toBe("Article Title");
    expect(result.excerpt).toBeTruthy();
  });

  it("should handle short HTML gracefully", () => {
    const html = "<div>Not an article</div>";

    const result = convertHtmlToText(html);

    // Readability may still extract content from short HTML
    expect(result).toBeDefined();
  });

  it("should handle HTML with metadata tags", () => {
    const html = `
      <html>
        <head>
          <title>Page Title</title>
          <meta name="description" content="Page description">
        </head>
        <body>
          <article>
            <h1>Article Heading</h1>
            <p>Article content here.</p>
          </article>
        </body>
      </html>
    `;

    const result = convertHtmlToText(html);

    expect(result.title).toBeTruthy();
    expect(result.textContent).toContain("Article content");
  });
});
