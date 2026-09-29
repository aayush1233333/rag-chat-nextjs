import { NextRequest, NextResponse } from "next/server";
import { chunkText } from "@/lib/chunking";
import { embed, getEmbeddingMode } from "@/lib/embeddings";
import { addRecords, clearStore, getStoreSize, VectorRecord } from "@/lib/vectorStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, docId } = body as { text?: string; docId?: string };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "`text` is required" }, { status: 400 });
    }

    clearStore(); // demo scope: one document in the store at a time
    const chunks = chunkText(text);

    const records: VectorRecord[] = [];
    for (const chunk of chunks) {
      const embedding = await embed(chunk.text);
      records.push({
        id: chunk.id,
        text: chunk.text,
        embedding,
        docId: docId || "default",
      });
    }
    addRecords(records);

    return NextResponse.json({
      chunks_ingested: records.length,
      embedding_mode: getEmbeddingMode(),
      store_size: getStoreSize(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to ingest document" }, { status: 500 });
  }
}
