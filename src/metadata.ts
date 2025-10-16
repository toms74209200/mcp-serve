import { convertHtmlToText } from "./html-converter.ts";

type Metadata = {
  title: string;
  description: string;
  tags: string[];
};

type MetadataExtractor = (
  content: string,
  filename: string,
) => Metadata;

const extractFromFrontmatter: MetadataExtractor = (content, _filename) => {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const yaml = frontmatterMatch?.[1] || "";

  const title = yaml.match(/^title:\s*(.+)$/m)?.[1] || "";
  const description = yaml.match(/^description:\s*(.+)$/m)?.[1] || "";
  const tagsMatch = yaml.match(/^tags:\s*\[(.+)\]$/m);
  const tags = tagsMatch ? tagsMatch[1].split(",").map((t) => t.trim()) : [];

  return { title, description, tags };
};

const extractFromHTML: MetadataExtractor = (content, filename) => {
  if (!filename.endsWith(".html")) {
    return { title: "", description: "", tags: [] };
  }
  const htmlData = convertHtmlToText(content);
  return {
    title: htmlData.title,
    description: htmlData.excerpt || htmlData.textContent.slice(0, 150),
    tags: [],
  };
};

const extractFromMDX: MetadataExtractor = (content, filename) => {
  if (!filename.endsWith(".mdx")) {
    return { title: "", description: "", tags: [] };
  }

  const contentWithoutFrontmatter = content.replace(
    /^---\n[\s\S]*?\n---\n/,
    "",
  );

  const htmlData = convertHtmlToText(contentWithoutFrontmatter);
  return {
    title: htmlData.title,
    description: htmlData.excerpt || htmlData.textContent.slice(0, 150),
    tags: [],
  };
};

const extractFromMarkdown: MetadataExtractor = (content, _filename) => {
  const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, "");
  const h1Match = bodyContent.match(/^#\s+(.+)$/m);
  const title = h1Match?.[1] || "";

  const firstParagraph = bodyContent.split("\n").find((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith("#");
  })?.trim() || "";

  return { title, description: firstParagraph, tags: [] };
};

const extractFromFilename: MetadataExtractor = (_content, filename) => {
  return {
    title: filename.replace(/\.(md|mdx|html|txt)$/, ""),
    description: "",
    tags: [],
  };
};

const extractors: MetadataExtractor[] = [
  extractFromFrontmatter,
  extractFromHTML,
  extractFromMDX,
  extractFromMarkdown,
  extractFromFilename,
];

const mergeMetadata = (acc: Metadata, current: Metadata): Metadata => ({
  title: acc.title || current.title,
  description: acc.description || current.description,
  tags: [...acc.tags, ...current.tags],
});

export const extractMetadata = (
  content: string,
  filename: string,
): Metadata => {
  const results = extractors.map((extractor) => extractor(content, filename));
  const merged = results.reduce(
    mergeMetadata,
    { title: "", description: "", tags: [] },
  );

  return {
    ...merged,
    description: merged.description.slice(0, 150),
  };
};
