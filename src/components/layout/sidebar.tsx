"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Database, 
  MessageSquare, 
  BookOpen, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Home,
  LogOut,
  User,
  X,
  CheckCircle2,
  Copy,
  Bell,
  Trash2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useWorkspaces } from "@/context/workspace-context";
import { deleteWorkspace } from "@/lib/actions/workspace-actions";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "Sources", href: "/sources", icon: Database },
  { name: "Wiki", href: "/wiki", icon: BookOpen },
  { name: "Team", href: "/team", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { workspaces, activeWorkspace, currentUser, userRole, setActiveWorkspaceById, refreshWorkspaces } = useWorkspaces();
  
  const [collapsed, setCollapsed] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [isWSOpen, setIsWSOpen] = useState(false);
  const [wsTab, setWsTab] = useState<'create' | 'join'>('create');
  const [newWSName, setNewWSName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // FIX: Hydration Mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Sync Notifications
  useEffect(() => {
    if (!currentUser || !activeWorkspace) return;
    if (userRole === "Owner" || userRole === "Admin") {
      const fetchReqs = async () => {
         const { data } = await supabase.from('join_requests').select('*, profiles:user_id(full_name, email)').eq('workspace_id', activeWorkspace.id).eq('status', 'pending');
         if (data) setPendingRequests(data);
      };
      fetchReqs();
    }
  }, [activeWorkspace, userRole, currentUser]);

  const handleCreateWS = async () => {
    if (!newWSName || !currentUser) return;
    setIsActionLoading(true);
    const code = "SRC-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const slug = `${newWSName.toLowerCase().replace(/ /g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
    const { data: ws, error } = await supabase.from('workspaces').insert({ name: newWSName, slug, owner_id: currentUser.id, invite_code: code }).select().single();
    if (!error && ws) {
      setGeneratedCode(code);
      await refreshWorkspaces();
      setActiveWorkspaceById(ws.id);
    }
    setIsActionLoading(false);
  };

  const handleJoinWS = async () => {
    if (!joinCode || !currentUser) return;
    setIsActionLoading(true);
    const { data: targetWS } = await supabase.from('workspaces').select('id').eq('invite_code', joinCode.toUpperCase()).maybeSingle();
    if (!targetWS) { alert("Invalid Code."); setIsActionLoading(false); return; }
    const { error } = await supabase.from('join_requests').insert({ user_id: currentUser.id, workspace_id: targetWS.id, status: 'pending' });
    if (!error) { alert("Sent!"); setIsWSOpen(false); }
    setIsActionLoading(false);
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace || userRole !== 'Owner') return;
    setIsDeleting(true);
    try {
      await deleteWorkspace(activeWorkspace.id);
      setIsDeleteDialogOpen(false);
      await refreshWorkspaces();
      // Redirect will be handled by refresh if active workspace is gone
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasMounted) return <div className={cn("bg-[#0B0F14] border-r border-[#1F2937]", collapsed ? "w-20" : "w-64")} />;

  return (
    <>
      {/* FIXED: Z-Index absolute positioning to prevent blocking dashboard clicks */}
      <div className={cn("fixed left-0 top-0 h-screen bg-[#0B0F14] border-r border-[#1F2937] transition-all duration-300 z-[999] flex flex-col shadow-2xl", collapsed ? "w-20" : "w-64")}>
        <div className="p-6 flex items-center justify-between">
          {!collapsed && <div className="flex items-center gap-3 font-bold text-xl text-white italic tracking-tighter uppercase"><div className="size-8 bg-[#6366F1] rounded-xl flex items-center justify-center italic font-black">SR</div><span>Sourcely</span></div>}
          {collapsed && <div className="size-8 bg-[#6366F1] rounded-xl flex items-center justify-center mx-auto">SR</div>}
        </div>

        <div className="px-4 py-2 space-y-4">
          {!collapsed && (
            <div className="space-y-1">
               <div className="flex justify-between items-center px-2 mb-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Workspace</p>
                  {pendingRequests.length > 0 && <button onClick={() => setShowRequests(true)} className="relative"><Bell className="size-3 text-yellow-500 animate-pulse" /><span className="absolute -top-1 -right-1 size-2 bg-[#6366F1] rounded-full" /></button>}
               </div>
               {workspaces.map(ws => (
                  <button key={ws.id} onClick={() => setActiveWorkspaceById(ws.id)} className={cn("w-full text-left px-3 py-2 rounded-xl text-sm transition-all mb-1 truncate", activeWorkspace?.id === ws.id ? "bg-[#111827] text-white font-bold border border-[#1F2937]" : "text-gray-500 hover:text-white")}>{ws.name}</button>
               ))}
            </div>
          )}
          <Button variant="outline" className="w-full bg-[#111827] border-[#1F2937] text-gray-400 rounded-xl h-11" onClick={() => setIsWSOpen(true)}>{!collapsed ? <><Plus className="mr-2 h-4 w-4" /> Move Brain</> : <Plus className="h-4 w-4" />}</Button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-4 px-4 py-3 rounded-2xl transition-all", pathname === item.href ? "bg-[#6366F1]/10 text-[#6366F1]" : "text-gray-400 hover:bg-[#111827]")}>
              <item.icon className="size-5" />
              {!collapsed && <span className="font-semibold text-sm">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1F2937] bg-[#0B0F14]">
          {!collapsed && (
            <div className="bg-[#111827] p-3 rounded-2xl mb-4 border border-transparent hover:border-[#1F2937] transition-all cursor-pointer group relative">
               <div className="flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#22C55E] flex items-center justify-center font-bold text-white shadow-lg">{currentUser?.email?.charAt(0).toUpperCase() || 'U'}</div>
                  <div className="flex-1 overflow-hidden"><p className="text-sm font-bold text-white truncate">{currentUser?.email?.split('@')[0] || 'User'}</p><p className="text-[10px] text-[#6366F1] font-bold uppercase tracking-widest leading-none">{userRole}</p></div>
                  {userRole === 'Owner' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
                      className="size-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
               </div>
          </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-3 text-gray-500 hover:text-white px-3 py-2 rounded-xl transition-all">{collapsed ? <ChevronRight className="size-5 mx-auto" /> : <ChevronLeft className="size-5 mx-auto" />}</button>
        </div>
      </div>

      {/* Spacer to prevent sidebar from covering fixed main content if needed, though most pages use flex-1 */}
      {!collapsed && <div className="w-64 shrink-0 transition-all duration-300" />}
      {collapsed && <div className="w-20 shrink-0 transition-all duration-300" />}

      {isWSOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#0B0F14]/95 backdrop-blur-xl" onClick={() => setIsWSOpen(false)} />
           <div className="relative bg-[#111827] border border-[#1F2937] rounded-[40px] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex gap-6 mb-8 border-b border-[#1F2937]"><button onClick={() => setWsTab('create')} className={cn("pb-4 text-[10px] font-bold uppercase", wsTab === 'create' ? "text-[#6366F1] border-b-2 border-[#6366F1]" : "text-gray-500")}>Create</button><button onClick={() => setWsTab('join')} className={cn("pb-4 text-[10px] font-bold uppercase", wsTab === 'join' ? "text-[#6366F1] border-b-2 border-[#6366F1]" : "text-gray-500")}>Join</button></div>
              {wsTab === 'create' ? (generatedCode ? (<div className="text-center space-y-6"><h2 className="text-2xl font-black italic uppercase text-white">Created!</h2><div className="p-6 bg-[#0B0F14] border border-[#1F2937] rounded-3xl text-2xl font-mono font-bold text-[#6366F1]">{generatedCode}</div><Button onClick={() => setIsWSOpen(false)} className="w-full bg-[#6366F1] text-white rounded-2xl h-14">Awesome</Button></div>) : (<div className="space-y-6"><Input value={newWSName} onChange={(e) => setNewWSName(e.target.value)} className="bg-[#0B0F14] h-14 rounded-2xl" placeholder="Workspace Name" /><Button onClick={handleCreateWS} className="w-full bg-[#6366F1] h-14 uppercase tracking-widest font-black italic shadow-glow">{isActionLoading ? 'Wait...' : 'Initialize'}</Button></div>)) : (<div className="space-y-6"><Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="bg-[#0B0F14] h-20 text-center text-4xl font-mono text-[#6366F1]" placeholder="SRC-" /><Button onClick={handleJoinWS} className="w-full bg-[#6366F1] h-14 uppercase tracking-widest font-black italic shadow-glow">Send Request</Button></div>)}
           </div>
        </div>
      )}

      {showRequests && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#0B0F14]/95 backdrop-blur-xl" onClick={() => setShowRequests(false)} />
           <div className="relative bg-[#111827] border border-[#1F2937] rounded-[40px] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-10"><h3 className="text-lg font-black uppercase text-white italic tracking-tighter">Access Requests</h3><X className="size-6 text-gray-500 cursor-pointer" onClick={() => setShowRequests(false)} /></div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {pendingRequests.map(req => (
                    <div key={req.id} className="p-6 bg-[#0B0F14] border border-[#1F2937] rounded-[30px] flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="size-10 bg-[#6366F1] rounded-xl flex items-center justify-center font-bold text-white uppercase italic">{req.profiles?.email[0]}</div>
                          <div className="flex flex-col"><p className="text-sm font-bold text-white truncate max-w-[150px]">{req.profiles?.email}</p><p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Pending Verification</p></div>
                       </div>
                       <Button className="bg-[#6366F1] text-white h-10 px-6 font-black uppercase text-[10px] italic">Approve</Button>
                    </div>
                 ))}
                 {pendingRequests.length === 0 && <p className="text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest py-10 opacity-30">No requests pending</p>}
              </div>
           </div>
        </div>
      )}

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#0B0F14]/95 backdrop-blur-xl" onClick={() => setIsDeleteDialogOpen(false)} />
           <div className="relative bg-[#111827] border border-red-500/30 rounded-[40px] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="size-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                 <Trash2 className="size-10" />
              </div>
              <div className="text-center space-y-4 mb-8">
                 <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Nuclear Action</h3>
                 <p className="text-gray-500 text-sm">
                    Warning: You are about to delete <span className="text-white font-bold">{activeWorkspace?.name}</span>. This will permanently wipe all sources, chat history, and generated wikis. This action is irreversible.
                 </p>
              </div>
              <div className="flex flex-col gap-3">
                 <Button onClick={handleDeleteWorkspace} disabled={isDeleting} className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-black uppercase italic tracking-widest shadow-glow-red rounded-2xl">
                    {isDeleting ? "Wiping Brain..." : "Confirm Purge"}
                 </Button>
                 <button onClick={() => setIsDeleteDialogOpen(false)} className="w-full py-4 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Abort Mission</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}
