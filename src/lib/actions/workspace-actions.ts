"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 1. WORKSPACE CREATION
 * DESIGN RULE: Owner is NOT added to workspace_members.
 */
export async function createWorkspace(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const invite_code = "SRC-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ 
      name, 
      owner_id: user.id,
      invite_code,
      slug: `${name.toLowerCase().replace(/ /g, "-")}-${Math.random().toString(36).substring(2, 4)}`
    })
    .select()
    .single();

  if (wsErr || !ws) throw new Error(wsErr?.message || "Failed to create workspace");

  revalidatePath("/dashboard");
  return ws;
}

/**
 * 2. JOIN REQUEST Logic
 */
export async function requestToJoinWorkspace(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, name, owner_id')
    .eq('invite_code', code.toUpperCase())
    .maybeSingle();

  if (!ws) throw new Error("Invalid join code");

  const { error } = await supabase
    .from('join_requests')
    .insert({
      workspace_id: ws.id,
      user_id: user.id,
      status: 'pending'
    });

  if (error) throw new Error("Already requested or Member.");

  // Notify Owner of new request
  await supabase.from('notifications').insert({
      user_id: ws.owner_id,
      type: 'new_request',
      message: `${user.email?.split('@')[0]} wants to join "${ws.name}"`,
      workspace_id: ws.id
  });
  
  return { success: true };
}

/**
 * 3. GET OWNER JOIN REQUESTS
 */
export async function getOwnerJoinRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('join_requests')
    .select(`
        *,
        workspaces!inner(name, owner_id),
        profiles:user_id(full_name, email)
    `)
    .eq('status', 'pending')
    .eq('workspaces.owner_id', user.id);

  if (error) {
     console.error("Fetch error:", error);
     return [];
  }
  return data;
}

/**
 * 4. ACCEPT JOIN REQUEST
 */
export async function acceptJoinRequest(requestId: string, workspaceId: string, userId: string) {
  const supabase = await createClient();
  
  // Step 1: Add user to members
  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userId, role: 'member' });

  if (memErr) throw new Error("Failed to add member");

  // Step 2: Update status
  await supabase.from('join_requests').update({ status: 'accepted' }).eq('id', requestId);

  // Step 3: Notify User B
  const { data: ws } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single();
  await supabase.from('notifications').insert({
      user_id: userId,
      type: 'request_accepted',
      message: `You were accepted into ${ws?.name}`,
      workspace_id: workspaceId
  });

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * 5. REJECT JOIN REQUEST
 */
export async function rejectJoinRequest(requestId: string, workspaceId: string, userId: string) {
  const supabase = await createClient();
  
  await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', requestId);

  const { data: ws } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single();
  await supabase.from('notifications').insert({
      user_id: userId,
      type: 'request_rejected',
      message: `Your request to join ${ws?.name} was rejected`,
      workspace_id: workspaceId
  });

  return { success: true };
}

/**
 * 6. DELETE WORKSPACE (Nuclear Option)
 */
export async function deleteWorkspace(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify Ownership
  const { data: ws } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (!ws || ws.owner_id !== user.id) {
    throw new Error("Only the owner can delete this workspace.");
  }

  // Delete everything (Cascades automatically in DB)
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  return { success: true };
}
