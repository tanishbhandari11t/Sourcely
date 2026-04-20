"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  Users, 
  Mail, 
  Shield, 
  UserMinus, 
  Plus, 
  ShieldCheck, 
  User, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Share2, 
  Trash2, 
  Crown,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkspaces } from "@/context/workspace-context";
import { createClient } from "@/utils/supabase/client";

export default function TeamPage() {
  const { activeWorkspace, refreshWorkspaces } = useWorkspaces();
  const supabase = createClient();
  const [members, setMembers] = useState<any[]>([]);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;
    fetchTeamData();
  }, [activeWorkspace]);

  const fetchTeamData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Identification
    const amIOwner = activeWorkspace?.owner_id === user.id;
    setIsOwner(amIOwner);

    // 2. Fetch Owner Details (for Card)
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', activeWorkspace?.owner_id)
      .maybeSingle();
    setOwnerData(ownerProfile);

    // 3. Fetch Members (only those in workspace_members table)
    const { data: memberData } = await supabase
      .from('workspace_members')
      .select('user_id, role, profiles!user_id(full_name, email)') 
      .eq('workspace_id', activeWorkspace?.id);
    
    // RENDER RULE: Owner must NOT appear in this list. 
    // (Logic: They aren't in members table anymore due to refactor)
    if (memberData) {
      setMembers(memberData);
    }
    
    setIsLoading(false);
  };

  const removeMember = async (userId: string) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', activeWorkspace?.id)
      .eq('user_id', userId);
    if (!error) fetchTeamData();
  };

  const inviteCode = activeWorkspace?.invite_code || "FETCHING...";

  return (
    <div className="flex bg-[#0B0F14] min-h-screen text-[#F3F4F6]">
      <Sidebar />
      <main className="flex-1 p-10 relative overflow-y-auto">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-12 pb-32">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic mb-2">Team Space</h1>
            <p className="text-gray-500">Manage ownership and collaborator access for <span className="text-white font-bold">{activeWorkspace?.name}</span>.</p>
          </div>

          {/* Section 1: OWNER CARD (Special Focus) */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6366F1]">
                <Crown className="size-3" /> Workspace Ownership
             </div>
             <div className="bg-gradient-to-br from-[#111827] to-indigo-950/20 border border-[#1F2937] rounded-[40px] p-8 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#6366F1]/5 animate-pulse" />
                <div className="flex items-center gap-6 relative z-10">
                   <div className="size-20 bg-[#6366F1] rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 font-black text-3xl italic">
                      {ownerData?.full_name?.[0] || 'O'}
                   </div>
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                         <h3 className="text-2xl font-bold text-white">{ownerData?.full_name || 'Project Owner'}</h3>
                         <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-yellow-500 text-black rounded-full">Primary Owner</span>
                      </div>
                      <p className="text-gray-400 flex items-center gap-2 text-sm">
                         <Mail className="size-3" /> {ownerData?.email || 'Contact through dashboard'}
                      </p>
                   </div>
                </div>
                {isOwner && (
                   <div className="flex items-center gap-8 relative z-10 px-8 border-l border-white/5">
                      <div className="text-center">
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Invite Code</p>
                         <p className="text-2xl font-mono font-bold text-[#6366F1]">{inviteCode}</p>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(inviteCode); alert("Copied!"); }} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                         <Copy className="size-5" />
                      </button>
                   </div>
                )}
             </div>
          </div>

          {/* Section 2: MEMBERS LIST */}
          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                   <Users className="size-3" /> Team Members ({members.length})
                </div>
             </div>

             <div className="bg-[#111827]/50 border border-[#1F2937] rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-sm">
                <table className="w-full text-left border-separate border-spacing-0">
                   <thead>
                      <tr className="bg-[#0B0F14]/40">
                         <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-600">Collaborator</th>
                         <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-600">Permission</th>
                         <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-600 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {members.length === 0 ? (
                         <tr>
                            <td colSpan={3} className="px-8 py-20 text-center">
                               <div className="flex flex-col items-center gap-4 opacity-30">
                                  <UserCheck className="size-12" />
                                  <p className="text-xs font-bold uppercase tracking-widest">No collaborators yet</p>
                               </div>
                            </td>
                         </tr>
                      ) : (
                         members.map((member) => (
                         <tr key={member.user_id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="size-11 bg-[#1F2937] rounded-xl flex items-center justify-center text-gray-400 font-bold group-hover:bg-[#6366F1] group-hover:text-white transition-all">
                                     {member.profiles?.full_name?.[0] || 'M'}
                                  </div>
                                  <div>
                                     <p className="font-bold text-white text-sm">{member.profiles?.full_name || 'Active Member'}</p>
                                     <p className="text-[10px] text-gray-500">{member.profiles?.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 uppercase tracking-widest text-[10px] font-bold text-[#6366F1]">
                               Member Access
                            </td>
                            <td className="px-8 py-6 text-right">
                               {isOwner && (
                                  <button onClick={() => removeMember(member.user_id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                     <UserMinus className="size-5" />
                                  </button>
                               )}
                            </td>
                         </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Danger Zone */}
          {isOwner && (
             <div className="p-10 border border-red-500/20 bg-red-500/5 rounded-[40px] flex items-center justify-between group">
                <div>
                   <h4 className="text-xl font-bold text-white mb-1 flex items-center gap-2 group-hover:text-red-500 transition-colors"><Trash2 className="size-5" /> Danger Zone</h4>
                   <p className="text-sm text-gray-500">Permanently delete workspace and all intelligence data.</p>
                </div>
                <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl h-12 px-8 font-bold uppercase tracking-widest text-[10px]">Delete Project</Button>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
