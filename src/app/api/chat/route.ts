import { NextRequest, NextResponse } from "next/server";
import { embed, getEmbeddingMode } from "@/lib/embeddings";
import { search, getStoreSize } from "@/lib/vectorStore";
import { generateAnswer } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body as { question?: string };

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "`question` is required" }, { status: 400 });
    }

    if (getStoreSize() === 0) {
      return NextResponse.json(
        { error: "No document ingested yet. POST to /api/ingest first." },
        { status: 400 }
      );
    }

    const queryEmbedding = await embed(question);
    const sources = search(queryEmbedding, 3);
    const { answer, mode } = await generateAnswer(question, sources);

    return NextResponse.json({
      answer,
      llm_mode: mode,
      embedding_mode: getEmbeddingMode(),
      sources: sources.map((s) => ({ id: s.id, text: s.text })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
