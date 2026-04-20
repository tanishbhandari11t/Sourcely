import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * AI INGESTION ENGINE
 * Purpose: Takes a Source ID and breaks it into Chunks for the AI Wiki
 */
export async function POST(req: Request) {
  try {
    const { sourceId, workspaceId, sourceName, type } = await req.json();
    const supabase = await createClient();

    // 1. SIMULATED INTELLIGENCE EXTRACTION
    // In a prod app, you'd scrape the URL or parse the PDF here.
    // For now, we generate "Intelligence Seedlings" based on the Source
    
    const intelligenceSeeds = [
      `Overview of ${sourceName}: This document provides high-level context regarding ${sourceName} within the workspace.`,
      `${type.toUpperCase()} Protocol: Analysis of the ${type} data structures and communication patterns found in this source.`,
      `The knowledge base for ${sourceName} covers technical implementation details and strategic goals.`,
      `Actionable Insights: Based on ${sourceName}, the team should focus on optimizing existing intelligence pipelines.`
    ];

    const chunksToInsert = intelligenceSeeds.map(content => ({
      workspace_id: workspaceId,
      source_id: sourceId,
      content,
      metadata: { source_name: sourceName, type }
    }));

    // 2. Feed the Brain
    const { error } = await supabase.from('chunks').insert(chunksToInsert);
    if (error) throw error;

    // 3. Mark Source as fully indexed
    await supabase.from('sources').update({ status: 'ready' }).eq('id', sourceId);

    return NextResponse.json({ success: true, chunksIngested: chunksToInsert.length });

  } catch (err: any) {
    console.error("Ingestion Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
