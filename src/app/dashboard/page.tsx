"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  FileText, 
  BookOpen, 
  Zap, 
  ChevronRight,
  Search,
  ArrowRight,
  Clock,
  Layers,
  MessagesSquare,
  UserPlus,
  Loader2,
  Bell,
  Check,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkspaces } from "@/context/workspace-context";
import { createClient } from "@/utils/supabase/client";
import { getOwnerJoinRequests, acceptJoinRequest, rejectJoinRequest } from "@/lib/actions/workspace-actions";
import Link from "next/link";

export default function DashboardHome() {
  const { activeWorkspace, refreshWorkspaces } = useWorkspaces();
  const supabase = createClient();
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("member");
  const router = useRouter();

  // 1. Fetch Notification Data (Join Requests)
  useEffect(() => {
    const syncPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeWorkspace) return;

      if (activeWorkspace.owner_id === user.id || activeWorkspace.created_by === user.id) {
        setCurrentUserRole("owner");
        const data = await getOwnerJoinRequests();
        setPendingRequests(data || []);
      } else {
        setCurrentUserRole("member");
      }
    };
    syncPermissions();

    // Real-time subscription for Join Requests
    const channel = supabase
      .channel('dashboard_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () => {
        syncPermissions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeWorkspace]);

  // 2. Original Activity Fetch
  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchActivity = async () => {
      const { data: sources } = await supabase
        .from('sources')
        .select('*')
        .eq('workspace_id', activeWorkspace?.id)
        .limit(5);
      
      if (sources) {
        setActivities(sources.map(s => ({
          id: s.id,
          type: s.type,
          user: 'AI Brain',
          action: `indexed new ${s.name}`,
          time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      }
    };
    fetchActivity();
  }, [activeWorkspace]);

  const handleJoin = async () => {
    if (!workspaceCode.trim()) return;
    setIsJoining(true);
    const { data: targetWS } = await supabase.from('workspaces').select('id').eq('invite_code', workspaceCode.toUpperCase()).maybeSingle();
    if (!targetWS) {
        alert("Invalid Join Code.");
        setIsJoining(false);
        return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('join_requests').insert({ user_id: user?.id, workspace_id: targetWS.id, status: 'pending' });
    alert("Request sent!");
    setWorkspaceCode("");
    setIsJoining(false);
  };

  const handleActionRequest = async (req: any, status: 'accepted' | 'rejected') => {
    if (status === 'accepted') {
       await acceptJoinRequest(req.id, req.workspace_id, req.user_id);
    } else {
       await rejectJoinRequest(req.id);
    }
    const data = await getOwnerJoinRequests();
    setPendingRequests(data || []);
  };

  return (
    <div className="flex bg-[#0B0F14] min-h-screen text-[#F3F4F6]">
      <Sidebar />
      <main className="flex-1 p-10 relative overflow-y-auto pt-24 md:pt-10">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111827]/50 p-8 rounded-[40px] border border-[#1F2937] backdrop-blur-sm shadow-2xl relative">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                {activeWorkspace ? activeWorkspace.name : "Choose a Workspace"}
              </h1>
              <p className="text-gray-500">Welcome back! Manage your intel and team below.</p>
            </div>

            <div className="flex items-center gap-6 mt-6 md:mt-0">
               {/* BELL ICON NOTIFICATION */}
               {currentUserRole === 'owner' && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowBellMenu(!showBellMenu)}
                      className={cn("p-4 bg-[#0B0F14] border border-[#1F2937] rounded-3xl transition-all hover:border-[#6366F1]/50 relative", pendingRequests.length > 0 && "shadow-indigo-500/10")}
                    >
                       <Bell className={cn("size-6 text-gray-400 group-hover:text-white transition-all", pendingRequests.length > 0 && "text-yellow-500 animate-pulse")} />
                       {pendingRequests.length > 0 && <span className="absolute top-2 right-2 size-3 bg-red-500 rounded-full border-2 border-[#0B0F14] animate-bounce" />}
                    </button>

                    {/* Notification Dropdown */}
                    {showBellMenu && (
                       <div className="absolute top-20 right-0 w-80 bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-2xl z-[50] animate-in zoom-in-95 duration-200">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Pending Requests ({pendingRequests.length})</h3>
                          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                             {pendingRequests.length === 0 ? (
                               <p className="text-sm text-gray-600 italic">No new notifications</p>
                             ) : (
                               pendingRequests.map(req => (
                                 <div key={req.id} className="p-3 bg-[#0B0F14] border border-[#1F2937] rounded-2xl flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                       <div className="size-8 bg-[#6366F1] rounded-lg flex items-center justify-center font-bold text-white text-xs">{req.profiles?.full_name[0]}</div>
                                       <div className="overflow-hidden"><p className="text-xs font-bold text-white truncate">{req.profiles?.full_name}</p><p className="text-[10px] text-gray-500 truncate">{req.workspaces?.name}</p></div>
                                    </div>
                                    <div className="flex gap-2"><button onClick={() => handleActionRequest(req, 'accepted')} className="flex-1 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600">Accept</button><button onClick={() => handleActionRequest(req, 'rejected')} className="flex-1 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-500/20">Deny</button></div>
                                 </div>
                               ))
                             )}
                          </div>
                          <Link href="/dashboard/join-requests" className="block text-center pt-4 text-[10px] font-bold text-[#6366F1] uppercase tracking-widest hover:text-white transition-colors">See all requests</Link>
                       </div>
                    )}
                  </div>
               )}

               <div className="flex gap-3 bg-[#0B0F14] border border-[#1F2937] p-2 rounded-[25px] shadow-inner group">
                <Input 
                  placeholder="Enter Join Code" 
                  value={workspaceCode}
                  onChange={(e) => setWorkspaceCode(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-32 md:w-48 h-12 text-sm font-mono text-[#6366F1] placeholder-gray-700"
                />
                <Button 
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-[20px] px-8 h-12 text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20"
                >
                  {isJoining ? <Loader2 className="size-4 animate-spin" /> : "Join Team"}
                </Button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div onClick={() => router.push('/sources')} className="space-y-4 group cursor-pointer">
              <div className="flex items-center justify-between px-4 text-gray-500">
                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                  <FileText className="size-4" /> Sources
                </h2>
                <ArrowRight className="size-4 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </div>
              <div className="h-[200px] bg-[#111827] border border-[#1F2937] rounded-[40px] p-8 flex flex-col justify-center items-center group hover:border-[#6366F1]/50 transition-all shadow-xl bg-gradient-to-br from-[#111827] to-[#0B0F14]">
                 <div className="size-16 bg-[#6366F1]/10 rounded-3xl flex items-center justify-center text-[#6366F1] mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-[#6366F1]/20">
                   <Plus className="size-10" />
                 </div>
                 <p className="font-bold text-gray-500 group-hover:text-white transition-colors">Manage Data & Intelligence</p>
              </div>
            </div>

            <div onClick={() => router.push('/wiki')} className="space-y-4 group cursor-pointer">
              <div className="flex items-center justify-between px-4 text-gray-500">
                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                  <BookOpen className="size-4" /> Knowledge Wiki
                </h2>
                <ArrowRight className="size-4 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </div>
              <div className="h-[200px] bg-[#111827] border border-[#1F2937] rounded-[40px] p-8 flex flex-col justify-between group hover:border-[#6366F1]/50 transition-all shadow-xl bg-gradient-to-br from-[#111827] to-[#0B0F14]">
                 <div className="flex items-center justify-between">
                    <div className="size-12 bg-[#6366F1]/10 rounded-2xl flex items-center justify-center text-[#6366F1]"><BookOpen className="size-7" /></div>
                    <span className="text-[10px] font-bold text-[#6366F1] uppercase bg-[#6366F1]/10 px-4 py-1.5 rounded-full tracking-widest border border-indigo-500/20">Self-Healing</span>
                 </div>
                 <div>
                    <h3 className="font-bold text-3xl mb-1 text-white tracking-tight">Project Wiki</h3>
                    <p className="text-sm text-gray-500">Collaborative documentation engine.</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-widest px-4 text-gray-500 flex items-center gap-3"><Clock className="size-4" /> Activity Feed</h2>
                <div className="bg-[#111827] border border-[#1F2937] rounded-[40px] overflow-hidden shadow-2xl p-2 bg-gradient-to-b from-[#111827] to-[#111827]/50">
                   {activities.length > 0 ? activities.map(activity => (
                     <div key={activity.id} className="m-2 p-6 bg-[#0B0F14]/50 border border-[#1F2937] rounded-[30px] flex items-center justify-between hover:bg-white/[0.03] transition-all cursor-pointer group hover:border-gray-800">
                        <div className="flex items-center gap-5">
                           <div className="size-12 bg-[#1c2533] rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-[#6366F1] group-hover:bg-[#6366F1]/10 transition-all shadow-lg border border-transparent group-hover:border-indigo-500/30">
                              <Zap className="size-6" />
                           </div>
                           <div>
                              <p className="text-base font-bold text-white group-hover:text-[#6366F1] transition-colors">{activity.user} <span className="font-normal text-gray-400">{activity.action}</span></p>
                              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 text-opacity-50">{activity.time}</p>
                           </div>
                        </div>
                        <ChevronRight className="size-5 text-gray-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                     </div>
                   )) : (
                     <div className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest text-xs opacity-50">No recent updates</div>
                   )}
                </div>
             </div>

             <div className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-widest px-4 text-gray-500 flex items-center gap-3"><Zap className="size-4" /> Core Tools</h2>
                <div className="space-y-4">
                  <div onClick={() => router.push('/chat')} className="bg-[#111827] border border-[#1F2937] p-8 rounded-[40px] flex items-center justify-between hover:border-[#6366F1]/50 transition-all cursor-pointer group hover:bg-[#1C2533] shadow-md">
                    <div className="flex items-center gap-5">
                      <div className="size-14 bg-[#6366F1]/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center text-[#6366F1] shadow-lg group-hover:scale-110 transition-transform">
                        <Search className="size-7" />
                      </div>
                      <h4 className="font-bold text-white text-lg">AI Brain Chat</h4>
                    </div>
                    <ChevronRight className="size-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>

                  <div onClick={() => router.push('/team')} className="bg-[#111827] border border-[#1F2937] p-8 rounded-[40px] flex items-center justify-between hover:border-[#22C55E]/50 transition-all cursor-pointer group hover:bg-[#1C2533] shadow-md">
                    <div className="flex items-center gap-5">
                      <div className="size-14 bg-[#22C55E]/10 border border-green-500/20 rounded-3xl flex items-center justify-center text-[#22C55E] shadow-lg group-hover:scale-110 transition-transform">
                        <UserPlus className="size-7" />
                      </div>
                      <h4 className="font-bold text-white text-lg">Team Space</h4>
                    </div>
                    <ChevronRight className="size-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
