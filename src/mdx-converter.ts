export const convertMdxToText = (content: string): string => {
  let text = content.replace(/^---\n[\s\S]*?\n---\n/, "");

  text = text.replace(
    /<[A-Z][a-zA-Z0-9]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z0-9]*>/g,
    "",
  );
  text = text.replace(/<[A-Z][a-zA-Z0-9]*[^/>]*\/>/g, "");

  return text;
};
