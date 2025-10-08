export const extractMetadata = (
  content: string,
  filename: string,
): { title: string; description: string; tags: string[] } => {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const yaml = frontmatterMatch?.[1] || "";

  const title = yaml.match(/^title:\s*(.+)$/m)?.[1] ||
    content.replace(/^---\n[\s\S]*?\n---\n/, "").match(/^#\s+(.+)$/m)?.[1] ||
    filename.replace(/\.md$/, "");

  const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, "");
  const firstParagraph = bodyContent.split("\n").find((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith("#");
  })?.trim() || "";

  const description =
    (yaml.match(/^description:\s*(.+)$/m)?.[1] || firstParagraph).slice(0, 150);

  const tagsMatch = yaml.match(/^tags:\s*\[(.+)\]$/m);
  const tags = tagsMatch ? tagsMatch[1].split(",").map((t) => t.trim()) : [];

  return { title, description, tags };
};
