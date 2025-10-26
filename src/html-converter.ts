import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export const convertHtmlToText = (
  html: string,
  url = "http://localhost",
): { textContent: string; title: string; excerpt: string } => {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    return {
      textContent: "",
      title: "",
      excerpt: "",
    };
  }

  return {
    textContent: article.textContent ?? "",
    title: article.title ?? "",
    excerpt: article.excerpt ?? "",
  };
};
