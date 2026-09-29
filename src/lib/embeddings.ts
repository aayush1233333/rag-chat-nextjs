/**
 * Embedding provider abstraction.
 *
 * If OPENAI_API_KEY is set, uses OpenAI's text-embedding-3-small model.
 * Otherwise, falls back to a deterministic local bag-of-words embedding
 * (hashed term frequency vector) — NOT a real semantic embedding, but
 * good enough to prove the retrieval pipeline (chunk -> embed -> store ->
 * cosine similarity search -> retrieve) works end-to-end without a paid
 * API key, mirroring the honest-fallback pattern used in my other projects
 * (Task Manager API's Atlas connection, the crypto ETL's CoinGecko fallback).
 *
 * Swap in a real key in production for genuine semantic search quality.
 */

const EMBEDDING_DIM = 256;

export type EmbeddingMode = "openai" | "local-fallback";

export function getEmbeddingMode(): EmbeddingMode {
  return process.env.OPENAI_API_KEY ? "openai" : "local-fallback";
}

async function embedWithOpenAI(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.data[0].embedding as number[];
}

/**
 * Deterministic local fallback: a simple hashed bag-of-words vector.
 * Same input text always produces the same vector, and vectors for texts
 * sharing more words will have higher cosine similarity — enough signal
 * to prove the retrieval mechanism itself is correct in offline tests.
 */
function embedLocalFallback(text: string): number[] {
  const vec = new Array(EMBEDDING_DIM).fill(0);
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
    }
    const idx = hash % EMBEDDING_DIM;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embed(text: string): Promise<number[]> {
  if (getEmbeddingMode() === "openai") {
    return embedWithOpenAI(text);
  }
  return embedLocalFallback(text);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
