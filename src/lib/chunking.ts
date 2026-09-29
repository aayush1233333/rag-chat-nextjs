/**
 * Splits text into overlapping chunks — same chunking-with-overlap strategy
 * used in my DevDocs AI (Python/LangChain) project, reimplemented here in
 * TypeScript with no external dependency.
 */
export interface Chunk {
  id: string;
  text: string;
  index: number;
}

export function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 75
): Chunk[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const chunkStr = clean.slice(start, end);
    chunks.push({ id: `chunk-${index}`, text: chunkStr, index });
    index += 1;
    if (end === clean.length) break;
    start = end - overlap;
  }

  return chunks;
}
