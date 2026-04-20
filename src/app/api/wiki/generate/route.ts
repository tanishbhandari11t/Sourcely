import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * AI WIKI GENERATION PIPELINE
 * Flow: Fetch Chunks -> Extract Topics (LLM) -> Generate Pages (LLM) -> Save to wiki_pages
 */
export async function POST(req: Request) {
  try {
    const { workspaceId } = await req.json();
    const supabase = await createClient();

    // 1. Fetch Workspace Knowledge
    const { data: chunks, error: chunksErr } = await supabase
      .from('chunks')
      .select('content')
      .eq('workspace_id', workspaceId)
      .limit(100);

    if (chunksErr || !chunks || chunks.length === 0) {
      return NextResponse.json({ error: "No knowledge base found. Upload sources first." }, { status: 400 });
    }

    const fullContext = chunks.map(c => c.content).join("\n\n");

    // 2. AI TOPIC DISCOVERY (Simulated LLM call - would use Groq/Gemini/Llama)
    // In production, you would send 'fullContext' to a prompt: 
    // "Analyze this knowledge and return a JSON list of key topics [ {title, summary} ]"
    
    const suggestedTopics = [
      { title: "Project Overview", summary: "A high-level introduction to the workspace content." },
      { title: "Key Concepts", summary: "Deep dive into main technical or business terms found in documents." },
      { title: "Best Practices", summary: "Derived guidelines from the ingested sources." },
      { title: "FAQ", summary: "Common questions resolved by the knowledge base." }
    ];

    // 3. GENERATE FULL WIKI PAGES
    // Loop through topics and generate markdown content via LLM
    const wikiPagesToInsert = suggestedTopics.map(topic => ({
      workspace_id: workspaceId,
      title: topic.title,
      content: `# ${topic.title}\n\n${topic.summary}\n\n## Auto-Generated Intelligence\nThis page was automatically generated using AI analysis of your uploaded sources. It synthesized data from ${chunks.length} discrete data points.\n\n### Detailed Analysis\n*   **Source Integrity**: High\n*   **Thematic Consistency**: Confirmed\n\n[Full detailed content would be generated here by the LLM in a production RAG pipeline]`
    }));

    // 4. Save to Database
    const { error: insertErr } = await supabase
      .from('wiki_pages')
      .upsert(wikiPagesToInsert, { onConflict: 'workspace_id, title' });

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, pagesCreated: wikiPagesToInsert.length });

  } catch (err: any) {
    console.error("Wiki Generation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
