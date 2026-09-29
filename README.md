# RAG Chat — Next.js Full-Stack Demo

A full-stack Retrieval-Augmented Generation (RAG) chat app built entirely in **Next.js
14 (App Router) + TypeScript** — frontend, API routes, chunking, embeddings, vector
search, and grounded LLM generation, all in one project.

## Why this project exists

Several roles I've applied to (all full-stack/AI-native positions) specifically ask for
**Next.js**, and my other projects — despite covering React, RAG pipelines (DevDocs AI),
and AI agents (Agentic Incident Triage) — didn't use Next.js specifically. This project
closes that gap while also reinforcing the RAG story in the JavaScript/TypeScript
ecosystem, not just Python.

## What it demonstrates

- **Next.js App Router** — file-based routing, Server Components, and Route Handlers
  (`app/api/*/route.ts`) for the backend, all in the same framework as the frontend
- **TypeScript throughout** — strict typing on API request/response shapes, no `any`
- **RAG pipeline, implemented from scratch in TypeScript** (no LangChain dependency,
  to prove I understand the mechanics rather than just calling a library):
  - Chunking with overlap (same strategy as my Python/LangChain DevDocs AI project)
  - Embedding generation (pluggable: real OpenAI embeddings, or a deterministic local
    fallback so the pipeline runs without an API key — see below)
  - Cosine-similarity vector search over an in-memory store
  - Grounded answer generation (real LLM call, or an honest extractive fallback)
- **Honest fallback design** — if `OPENAI_API_KEY` isn't set, the app doesn't fake a
  generated answer; it clearly labels the response as `extractive-fallback mode` and
  returns the most relevant retrieved chunk verbatim. This keeps the demo runnable and
  honest at the same time, the same pattern used in my crypto ETL project's API fallback.

## Architecture

```
Browser (React, "use client")
    |
    v
POST /api/ingest  ->  chunkText()  ->  embed() [OpenAI | local fallback]  ->  in-memory vector store
    |
POST /api/chat    ->  embed(question)  ->  cosineSimilarity search (top-k)
                                                |
                                                v
                                  generateAnswer() [OpenAI chat completion | extractive fallback]
                                                |
                                                v
                                    { answer, sources, mode } -> rendered in UI
```

## Running it locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Paste any text into the ingest box, click **Ingest**, then
ask a question about it. Works immediately with **no API key** — you'll see
`local-fallback` mode: the retrieval works fully (proven by my own tests, see below), and
the "answer" is the top retrieved chunk shown verbatim, clearly labeled.

### With a real OpenAI key (optional, for real generated answers)

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

Restart the dev server. The same code path now uses real `text-embedding-3-small`
embeddings and a real `gpt-4o-mini` grounded completion instead of the fallback.

## Verification I actually ran

This wasn't just written and left untested. I ran the dev server locally and hit the
real API routes with curl:

- **Type-checked** with `tsc --noEmit` — zero errors
- **Production build** (`next build`) — compiles cleanly, all 4 routes (`/`, `/api/ingest`,
  `/api/chat`, `/_not-found`) build successfully
- **Retrieval discrimination test**: ingested a two-topic document (Eiffel Tower + Great
  Wall of China), then asked a question specific to each topic. The correct chunk was
  retrieved as the top result for each question — proving the embedding → cosine
  similarity → ranking pipeline actually works, not just that it runs without crashing
- **Validation**: empty/missing `text` and `question` fields correctly return `400`
  errors instead of crashing

## What I'd add next

- A real vector database (pgvector, Pinecone, or Chroma) instead of the in-memory store,
  so data survives server restarts and scales beyond one process
- Streaming responses (Next.js supports streaming Route Handlers) instead of waiting for
  the full answer
- Reranking step after initial retrieval (a cross-encoder re-scoring the top-k results)
  for better precision — noted as a gap in my other RAG work too
- Multi-document support (the current version replaces the store on each ingest, by design,
  to keep the demo simple)
