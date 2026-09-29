import { VectorRecord } from "./vectorStore";

export type LLMMode = "openai" | "extractive-fallback";

export function getLLMMode(): LLMMode {
  return process.env.OPENAI_API_KEY ? "openai" : "extractive-fallback";
}

async function completeWithOpenAI(question: string, context: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Answer the question using ONLY the provided context. If the context doesn't contain the answer, say you don't know. Be concise.",
        },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI chat completion failed: ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

/**
 * Honest fallback when no API key is configured: instead of fabricating a
 * plausible-sounding LLM answer (which would be misleading), this mode is
 * explicitly extractive — it returns the most relevant retrieved chunk(s)
 * verbatim with a clear label, rather than pretending to generate a real
 * LLM response. This keeps local testing/demoing honest about what's real
 * (the retrieval pipeline) vs. what needs a real API key (the generation step).
 */
function completeWithExtractiveFallback(question: string, sources: VectorRecord[]): string {
  if (sources.length === 0) {
    return "[extractive-fallback mode — no OPENAI_API_KEY set] No relevant chunks found for this question.";
  }
  const best = sources[0];
  return (
    `[extractive-fallback mode — no OPENAI_API_KEY set, showing top retrieved chunk verbatim ` +
    `instead of a generated answer] "${best.text}"`
  );
}

export async function generateAnswer(
  question: string,
  sources: VectorRecord[]
): Promise<{ answer: string; mode: LLMMode }> {
  const mode = getLLMMode();
  if (mode === "openai") {
    const context = sources.map((s, i) => `[${i + 1}] ${s.text}`).join("\n\n");
    const answer = await completeWithOpenAI(question, context);
    return { answer, mode };
  }
  return { answer: completeWithExtractiveFallback(question, sources), mode };
}
