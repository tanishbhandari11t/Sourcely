"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Check, X, Users, Mail, AlertCircle, Loader2, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOwnerJoinRequests, acceptJoinRequest, rejectJoinRequest } from "@/lib/actions/workspace-actions";
import Link from "next/link";

export default function JoinRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    const data = await getOwnerJoinRequests();
    setRequests(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (req: any) => {
    try {
      await acceptJoinRequest(req.id, req.workspace_id, req.user_id);
      fetchRequests();
    } catch (e) {
      alert("Error approving request");
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await rejectJoinRequest(reqId);
      fetchRequests();
    } catch (e) {
      alert("Error rejecting request");
    }
  };

  return (
    <div className="flex bg-[#0B0F14] min-h-screen text-[#F3F4F6]">
      <Sidebar />
      <main className="flex-1 p-10 relative overflow-y-auto">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
             <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
             <ArrowRight className="size-3" />
             <span className="text-[#6366F1]">Join Requests</span>
          </div>

          <div>
            <h1 className="text-4xl font-black mb-3 tracking-tighter text-white uppercase italic">PENDING ACCESS</h1>
            <p className="text-gray-400 max-w-xl">
              Found <span className="text-white font-bold">{requests.length}</span> people waiting to join your workspaces. Review them below.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
               <Loader2 className="size-12 text-[#6366F1] animate-spin" />
               <p className="text-gray-500 animate-pulse uppercase tracking-widest text-xs font-bold">Scanning secure requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="h-96 border-2 border-dashed border-[#1F2937] rounded-[40px] flex flex-col items-center justify-center space-y-6 bg-[#111827]/30">
               <div className="size-20 bg-[#1F2937] rounded-3xl flex items-center justify-center text-gray-600">
                  <Users className="size-10" />
               </div>
               <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Inbox Zero</h3>
                  <p className="text-sm text-gray-500">You don't have any pending join requests at the moment.</p>
               </div>
               <Link href="/dashboard">
                  <Button className="bg-[#6366F1] text-white rounded-xl px-10 h-12 font-bold uppercase tracking-widest text-xs">Return to Dashboard</Button>
               </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
               {requests.map(req => (
                 <div key={req.id} className="group bg-[#111827] border border-[#1F2937] hover:border-[#6366F1]/30 rounded-[40px] p-8 flex items-center justify-between shadow-2xl transition-all shadow-indigo-500/0 hover:shadow-indigo-500/5">
                    <div className="flex items-center gap-6">
                       <div className="size-16 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-3xl flex items-center justify-center text-white font-bold text-2xl uppercase shadow-xl transform transition-transform group-hover:scale-110">
                          {(req.profiles?.full_name || 'G')[0]}
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-3">
                             <h3 className="text-xl font-bold text-white leading-none">{req.profiles?.full_name || 'Guest'}</h3>
                             <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#6366F1]/20 text-[#6366F1] rounded-full border border-[#6366F1]/30">{req.workspaces?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                             <Mail className="size-3" />
                             <p className="text-sm font-medium">{req.profiles?.email}</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => handleReject(req.id)}
                         className="flex items-center gap-2 px-6 py-4 text-gray-400 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all group/btn"
                       >
                          <X className="size-5 group-hover/btn:scale-125 transition-transform" />
                          <span className="text-xs font-bold uppercase tracking-widest">Reject</span>
                       </button>
                       <button 
                         onClick={() => handleAccept(req)}
                         className="flex items-center gap-2 px-8 py-4 bg-[#6366F1] text-white rounded-2xl shadow-xl shadow-[#6366F1]/20 hover:bg-[#4F46E5] transition-all group/btn"
                       >
                          <Check className="size-5 group-hover/btn:scale-125 transition-transform text-white" />
                          <span className="text-xs font-bold uppercase tracking-widest">Accept Access</span>
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
