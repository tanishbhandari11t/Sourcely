"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * AI INGESTION ENGINE (Server Action)
 * This handles the "Step 2 & 3" of your RAG plan: Text Chunking + Vector Prep
 */
export async function ingestSource(sourceId: string, workspaceId: string, sourceName: string, type: string) {
  const supabase = await createClient();
  
  try {
    // 1. Mark as processing
    await supabase.from('sources').update({ status: 'processing' }).eq('id', sourceId);

    // 2. Intelligence Extraction (MOCKED for now, but populates vector brain)
    const mockContent = [
      `Intelligence Data for ${sourceName}: This source contains crucial documentation regarding ${type} integrations.`,
      `Technical Specs: The ${sourceName} architecture follows the standard Sourcely workspace protocols.`,
      `Onboarding Protocol: New developers should refer to ${sourceName} for initial workspace setup.`,
      `Strategic Goals: The primary objective of this source is to streamline the developer knowledge base.`
    ];

    const chunks = mockContent.map(content => ({
      workspace_id: workspaceId,
      source_id: sourceId,
      content,
      metadata: { source_name: sourceName, type }
      // In production, you would call Gemini API here to generate the 'embedding'
    }));

    // 3. Insert into pgvector-ready table
    const { error: insertErr } = await supabase.from('chunks').insert(chunks);
    if (insertErr) throw insertErr;

    // 4. Mark as Ready
    const { error: updateErr } = await supabase.from('sources').update({ status: 'ready' }).eq('id', sourceId);
    if (updateErr) throw updateErr;

    revalidatePath("/sources");
    return { success: true };

  } catch (err) {
    console.error("Ingestion Master Error:", err);
    return { success: false, error: err };
  }
}

/**
 * WIKI GENERATION (Server Action)
 */
export async function generateWikiIntelligence(workspaceId: string) {
  const supabase = await createClient();
  
  // 1. Fetch available intelligence
  const { data: chunks } = await supabase
    .from('chunks')
    .select('content')
    .eq('workspace_id', workspaceId)
    .limit(10);

  if (!chunks || chunks.length === 0) return { success: false, error: "Empty Brain" };

  // 2. Synthesize Topics
  const topics = [
    { title: "Workspace Overview", content: `Derived Intelligence: Your project relies on ${chunks.length} key knowledge points. Core focus includes workspace optimization.` },
    { title: "Technical Onboarding", content: "Instructions derived from your sources for new developer integration." },
    { title: "Knowledge Baseline", content: "The foundational truths extracted from your uploaded documents and links." }
  ];

  const wikiPages = topics.map(t => ({
    workspace_id: workspaceId,
    title: t.title,
    content: `# ${t.title}\n\n${t.content}\n\n---\n*AI Generated from Workspace sources*`
  }));

  const { error } = await supabase.from('wiki_pages').upsert(wikiPages, { onConflict: 'workspace_id, title' });
  
  revalidatePath("/wiki");
  return { success: !error };
}
