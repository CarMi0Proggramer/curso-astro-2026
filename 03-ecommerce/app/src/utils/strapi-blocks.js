function isTextNode(node) {
  return node.type === "text";
}

function nodeToText(node) {
  if (isTextNode(node)) return node.text;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(nodeToText).join("");
}

/** One plain-text string per top-level block, skipping empty blocks. */
export function blocksToParagraphs(blocks) {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .map((block) => nodeToText(block).replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function blocksToPlainText(blocks) {
  if (!Array.isArray(blocks)) return "";

  return blocks.map(nodeToText).join(" ").replace(/\s+/g, " ").trim();
}
