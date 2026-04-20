import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// Gemini (for embeddings)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embedModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Groq (LLM)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// create embedding
async function embed(text: string) {
  const result = await embedModel.embedContent(text);
  return result.embedding.values;
}

export async function POST(req: Request) {
  try {
    const { message, workspace_id } = await req.json();
    const supabase = await createClient();

    // 1️⃣ Convert question → embedding
    const queryEmbedding = await embed(message);

    // 2️⃣ Search similar chunks in Supabase
    const { data: matches, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, // Lowering threshold for testing
      match_count: 5,
      workspace_id,
    });

    if (error) throw error;

    const context = matches?.map((m: any) => m.content).join("\n") || "No relevant context found.";

    // 3️⃣ Send context + question to LLM
    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant. Answer ONLY from the provided context. If unsure, say you don't know.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${message}`,
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
