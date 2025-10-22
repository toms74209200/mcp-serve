import { convertHtmlToText } from "./html-converter.ts";
import { convertMdxToText } from "./mdx-converter.ts";

const MAX_DESCRIPTION_LENGTH = 150;

const getFilenameWithoutExt = (filename: string): string =>
  filename.replace(/\.[^.]+$/, "").replace(/^.*[/\\]/, "");

type Metadata = {
  title: string;
  description: string;
  tags: string[];
};

type FileProcessor = (
  content: string,
  filename: string,
) => {
  textContent: string;
  metadata: Metadata;
} | null;

const parseFrontmatter = (content: string): Metadata | null => {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const yaml = frontmatterMatch[1];
  const title = yaml.match(/^title:\s*(.+)$/m)?.[1];
  const description = yaml.match(/^description:\s*(.+)$/m)?.[1];
  const tagsMatch = yaml.match(/^tags:\s*\[(.+)\]$/m);
  const tags = tagsMatch ? tagsMatch[1].split(",").map((t) => t.trim()) : [];

  if (!title && !description && tags.length === 0) return null;

  return {
    title: title || "",
    description: description || "",
    tags,
  };
};

const extractMarkdownHeading = (content: string): Metadata | null => {
  const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, "");
  const h1Match = bodyContent.match(/^#\s+(.+)$/m);
  const title = h1Match?.[1] || "";

  const firstParagraph = bodyContent.split("\n").find((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith("#");
  })?.trim() || "";

  if (!title && !firstParagraph) return null;

  return { title, description: firstParagraph, tags: [] };
};

const parseHTML: FileProcessor = (content, filename) => {
  if (!filename.endsWith(".html")) return null;

  const htmlData = convertHtmlToText(content);
  const filenameWithoutExt = getFilenameWithoutExt(filename);

  return {
    textContent: htmlData.textContent,
    metadata: {
      title: htmlData.title || filenameWithoutExt,
      description: (htmlData.excerpt ||
        htmlData.textContent.slice(0, MAX_DESCRIPTION_LENGTH))
        .slice(0, MAX_DESCRIPTION_LENGTH),
      tags: [],
    },
  };
};

const parseMDX: FileProcessor = (content, filename) => {
  if (!filename.endsWith(".mdx")) return null;

  const textContent = convertMdxToText(content);
  const filenameWithoutExt = getFilenameWithoutExt(filename);

  const frontmatter = parseFrontmatter(content);
  const markdownHeading = extractMarkdownHeading(content);
  const contentWithoutFrontmatter = content.replace(
    /^---\n[\s\S]*?\n---\n/,
    "",
  );
  const htmlData = convertHtmlToText(contentWithoutFrontmatter);

  const htmlMetadata = htmlData.title || htmlData.excerpt ||
      htmlData.textContent.slice(0, MAX_DESCRIPTION_LENGTH)
    ? {
      title: htmlData.title,
      description: htmlData.excerpt ||
        htmlData.textContent.slice(0, MAX_DESCRIPTION_LENGTH),
      tags: [],
    }
    : null;

  const contentMetadata = {
    title: markdownHeading?.title || htmlMetadata?.title || filenameWithoutExt,
    description: htmlMetadata?.description || markdownHeading?.description ||
      "",
    tags: [
      ...(markdownHeading?.tags ?? []),
      ...(htmlMetadata?.tags ?? []),
    ],
  };

  const metadata = {
    ...(frontmatter || contentMetadata),
    tags: frontmatter?.tags ?? contentMetadata.tags,
  };

  return {
    textContent,
    metadata: {
      ...metadata,
      description: metadata.description.slice(0, MAX_DESCRIPTION_LENGTH),
    },
  };
};

const parseReStructuredText: FileProcessor = (content, filename) => {
  if (!filename.endsWith(".rst")) return null;

  const lines = content.split("\n");
  const filenameWithoutExt = getFilenameWithoutExt(filename);

  const titleEntry = lines
    .map((line, index) => ({ line, index, nextLine: lines[index + 1] }))
    .filter(({ line }) => line.trim())
    .filter(({ nextLine }) => {
      const nextTrimmed = nextLine?.trim() || "";
      return /^[=\-`:'".~^_*+#]{3,}$/.test(nextTrimmed);
    })
    .filter(({ line, nextLine }) => {
      const trimmed = line.trim();
      const nextTrimmed = nextLine?.trim() || "";
      return nextTrimmed.length >= trimmed.length;
    })
    .at(0);

  const title = titleEntry?.line.trim() || filenameWithoutExt;
  const titleLineIndex = titleEntry?.index ?? -1;

  const description = titleLineIndex >= 0
    ? lines
      .slice(titleLineIndex + 2)
      .filter((line) => line.trim())
      .filter((line) => !line.startsWith(" ") && !line.startsWith("\t"))
      .filter((line) => !line.trim().startsWith(".."))
      .filter((line) => !line.trim().startsWith(":"))
      .filter((line) => !/^[=\-`:'".~^_*+#]{3,}$/.test(line.trim()))
      .at(0)?.trim() || ""
    : "";

  return {
    textContent: content,
    metadata: {
      title,
      description: description.slice(0, MAX_DESCRIPTION_LENGTH),
      tags: [],
    },
  };
};

const parseMarkdown: FileProcessor = (content, filename) => {
  if (!filename.endsWith(".md")) return null;

  const filenameWithoutExt = getFilenameWithoutExt(filename);
  const frontmatter = parseFrontmatter(content);
  const markdownHeading = extractMarkdownHeading(content);

  const metadata = {
    title: frontmatter?.title || markdownHeading?.title || filenameWithoutExt,
    description:
      (frontmatter?.description || markdownHeading?.description || "").slice(
        0,
        MAX_DESCRIPTION_LENGTH,
      ),
    tags: [...(frontmatter?.tags ?? []), ...(markdownHeading?.tags ?? [])],
  };

  return {
    textContent: content,
    metadata,
  };
};

const parsePlainText: FileProcessor = (content, filename) => {
  if (!filename.endsWith(".txt")) return null;

  const filenameWithoutExt = getFilenameWithoutExt(filename);
  const frontmatter = parseFrontmatter(content);
  const markdownHeading = extractMarkdownHeading(content);

  const metadata = {
    title: frontmatter?.title || markdownHeading?.title || filenameWithoutExt,
    description:
      (frontmatter?.description || markdownHeading?.description || "").slice(
        0,
        MAX_DESCRIPTION_LENGTH,
      ),
    tags: [...(frontmatter?.tags ?? []), ...(markdownHeading?.tags ?? [])],
  };

  return {
    textContent: content,
    metadata,
  };
};

const processors: FileProcessor[] = [
  parseHTML,
  parseMDX,
  parseReStructuredText,
  parseMarkdown,
  parsePlainText,
];

export const parseFile = (
  content: string,
  filename: string,
): {
  textContent: string;
  metadata: Metadata;
} => {
  const result = processors
    .map((processor) => processor(content, filename))
    .filter((result) => result !== null)
    .at(0);

  return result ?? {
    textContent: content,
    metadata: {
      title: getFilenameWithoutExt(filename),
      description: "",
      tags: [],
    },
  };
};
