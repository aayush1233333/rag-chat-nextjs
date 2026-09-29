import { cosineSimilarity } from "./embeddings";

export interface VectorRecord {
  id: string;
  text: string;
  embedding: number[];
  docId: string;
}

/**
 * In-memory vector store. Deliberately simple — swappable for a real
 * vector database (Chroma, Pinecone, pgvector) in production, same as
 * my DevDocs AI project uses ChromaDB per-document collections.
 *
 * Uses a module-level array, which persists across requests within a
 * single Next.js server process (fine for a demo; a real deployment
 * would use a real DB so it survives restarts and scales across instances).
 */
const store: VectorRecord[] = [];

export function addRecords(records: VectorRecord[]) {
  store.push(...records);
}

export function clearStore() {
  store.length = 0;
}

export function getStoreSize() {
  return store.length;
}

export function search(queryEmbedding: number[], topK = 3): VectorRecord[] {
  return [...store]
    .map((record) => ({
      record,
      score: cosineSimilarity(queryEmbedding, record.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => r.record);
}
