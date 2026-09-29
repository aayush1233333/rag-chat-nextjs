"use client";

import { useState } from "react";

interface Source {
  id: string;
  text: string;
}

interface ChatResult {
  answer: string;
  llm_mode: string;
  embedding_mode: string;
  sources: Source[];
}

export default function Home() {
  const [docText, setDocText] = useState("");
  const [ingested, setIngested] = useState<{ chunks: number; mode: string } | null>(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ChatResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleIngest() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: docText, docId: "demo-doc" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setIngested({ chunks: data.chunks_ingested, mode: data.embedding_mode });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAsk() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>RAG Chat — Next.js Full-Stack Demo</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Paste some text, ingest it, then ask questions grounded in that text.
        Runs in local-fallback mode without an OpenAI key — see README.
      </p>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>1. Ingest a document</h2>
        <textarea
          value={docText}
          onChange={(e) => setDocText(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: "0.5rem", fontFamily: "inherit" }}
          placeholder="Paste some text here..."
        />
        <button onClick={handleIngest} disabled={loading || !docText.trim()} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}>
          Ingest
        </button>
        {ingested && (
          <p style={{ color: "green", marginTop: "0.5rem" }}>
            Ingested {ingested.chunks} chunk(s). Embedding mode: <code>{ingested.mode}</code>
          </p>
        )}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>2. Ask a question</h2>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
          placeholder="Ask something about the ingested text..."
        />
        <button onClick={handleAsk} disabled={loading || !question.trim()} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}>
          Ask
        </button>
      </section>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {result && (
        <section>
          <h2 style={{ fontWeight: 600 }}>Answer</h2>
          <p style={{ background: "#f4f4f4", padding: "1rem", borderRadius: 8 }}>{result.answer}</p>
          <p style={{ fontSize: "0.85rem", color: "#777" }}>
            LLM mode: <code>{result.llm_mode}</code> · Embedding mode: <code>{result.embedding_mode}</code>
          </p>
          <h3 style={{ fontWeight: 600, marginTop: "1rem" }}>Sources</h3>
          <ul>
            {result.sources.map((s) => (
              <li key={s.id} style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                <strong>{s.id}:</strong> {s.text.slice(0, 150)}...
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
