"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  FileText, 
  Globe, 
  Trash2, 
  RefreshCw,
  X,
  Upload,
  Layers,
  MessagesSquare,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  HardDrive,
  Database,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaces } from "@/context/workspace-context";
import { createClient } from "@/utils/supabase/client";
import { ingestSource } from "@/lib/actions/ai-actions";

export default function SourcesPage() {
  const { activeWorkspace, currentUser } = useWorkspaces();
  const supabase = createClient();
  const [sources, setSources] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingChunks, setViewingChunks] = useState<any[] | null>(null);
  const [viewingSource, setViewingSource] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    fetchSources();
  }, [activeWorkspace]);

  const fetchSources = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('sources')
      .select('*')
      .eq('workspace_id', activeWorkspace?.id)
      .order('created_at', { ascending: false });
    if (data) setSources(data);
    setIsLoading(false);
  };

  const handleExplore = async (source: any) => {
     setViewingSource(source);
     const { data } = await supabase.from('chunks').select('*').eq('source_id', source.id);
     setViewingChunks(data || []);
  };

  const handleIngest = async (source: any) => {
     setIsConnecting(source.id);
     try {
        const res = await ingestSource(source.id, activeWorkspace!.id, source.name, source.type);
        if (res.success) {
           await fetchSources();
        }
     } catch (err) {
        console.error(err);
     } finally {
        setIsConnecting(null);
     }
  };

  const detectType = (urlStr: string) => {
     const url = urlStr.toLowerCase();
     if (url.includes('slack.com')) return 'slack';
     if (url.includes('github.com')) return 'github';
     if (url.includes('jira.com') || url.includes('atlassian')) return 'jira';
     return 'website';
  };

  const addSource = async (typeOverride?: string, nameOverride?: string) => {
    if (!activeWorkspace || !currentUser) return;
    
    let type = typeOverride || detectType(linkInput);
    let finalName = nameOverride || `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    if (!nameOverride && linkInput) {
      try {
        const url = new URL(linkInput.startsWith('http') ? linkInput : `https://${linkInput}`);
        const domain = url.hostname.replace('www.', '').split('.')[0];
        finalName = domain.charAt(0).toUpperCase() + domain.slice(1);
        if (type === 'slack') finalName = "Slack Workspace";
      } catch (e) {
        finalName = "Source Link";
      }
    }

    const { data, error } = await supabase
      .from('sources')
      .insert({
        workspace_id: activeWorkspace.id,
        name: finalName,
        type: type as any,
        status: 'processing',
        owner_id: currentUser.id,
        metadata: { url: linkInput }
      })
      .select()
      .single();

    if (data) {
       setSources([data, ...sources]);
       await handleIngest(data);
    }
    
    setIsAddOpen(false);
    setLinkInput("");
  };

  const deleteSource = async (id: string) => {
    // 1. Optimistic Update
    setSources(prev => prev.filter(s => s.id !== id));
    
    // 2. Clear Database
    try {
       await supabase.from('chunks').delete().eq('source_id', id);
       const { error } = await supabase.from('sources').delete().eq('id', id);
       if (error) {
          console.error(error);
          fetchSources();
       }
    } catch (e) {
       console.error(e);
    }
  };

  return (
    <div className="flex bg-[#0B0F14] min-h-screen text-[#F3F4F6] overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 p-10 relative overflow-y-auto pt-24 md:pt-10 z-0">
        {/* Background grid with pointer-events-none to prevent blocking clicks */}
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none z-0" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase mb-2">Workspace Brain</h1>
              <p className="text-[#6366F1] font-bold uppercase text-[10px] tracking-[0.3em]">
                {activeWorkspace ? `Connected: ${activeWorkspace.name}` : 'Select a Project Brain'}
              </p>
            </div>
            {activeWorkspace && (
              <Button 
                onClick={() => setIsAddOpen(true)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full shadow-2xl px-10 h-16 font-bold uppercase tracking-widest text-[10px] italic shadow-indigo-500/20"
              >
                <Plus className="mr-3 h-5 w-5" /> Add Intelligence
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="size-10 text-[#6366F1] animate-spin" /></div>
          ) : sources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sources.map((source) => (
                <div key={source.id} className="p-10 bg-[#111827] border border-[#1F2937] rounded-[45px] hover:border-[#6366F1]/40 transition-all group relative bg-gradient-to-br from-[#111827] to-[#0B0F14] shadow-2xl">
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="size-20 bg-[#6366F1]/10 rounded-[30px] flex items-center justify-center text-[#6366F1]">
                      {source.type === 'file' && <FileText className="size-10" />}
                      {source.type === 'website' && <Globe className="size-10" />}
                      {source.type === 'slack' && <MessagesSquare className="size-10" />}
                      {source.type === 'github' && <Layers className="size-10" />}
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => handleIngest(source)} className="p-4 bg-white/5 text-gray-500 hover:text-[#6366F1] rounded-2xl transition-all"><RefreshCw className={cn("size-6", isConnecting === source.id && "animate-spin text-[#6366F1]")} /></button>
                       <button onClick={() => deleteSource(source.id)} className="p-4 bg-white/5 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><Trash2 className="size-6" /></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-3xl truncate text-white tracking-tighter italic mb-2 uppercase relative z-10">{source.name}</h3>
                  <div className="flex items-center gap-2 mb-8 uppercase text-[10px] font-black tracking-widest text-gray-600 relative z-10">
                      <span>{source.type}</span>
                      <span>•</span>
                      <span className={cn(source.status === 'ready' ? "text-[#22C55E]" : "text-yellow-500")}>
                        {source.status === 'ready' ? 'Analyzed' : 'Reading...'}
                      </span>
                  </div>
                  <Button onClick={() => handleExplore(source)} variant="ghost" className="w-full h-14 rounded-[25px] bg-white/5 border border-white/5 text-gray-500 hover:text-white uppercase font-black text-[10px] tracking-[0.2em] italic group-hover:bg-[#6366F1] group-hover:text-white transition-all relative z-10">
                     Explore Data <ChevronRight className="ml-2 size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#1F2937] rounded-[45px] opacity-30 text-center">
                <Database className="size-16 mb-4" />
                <p className="font-bold uppercase tracking-widest text-[10px]">Brain empty for this workspace</p>
             </div>
          )}
        </div>

        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
           const file = e.target.files?.[0];
           if (file) addSource('file', file.name);
        }} />

        {/* Intelligence Viewer Modal */}
        {viewingSource && viewingChunks && (
           <div className="fixed inset-0 z-[500] flex items-center justify-end">
              <div className="absolute inset-0 bg-[#0B0F14]/95 backdrop-blur-xl" onClick={() => { setViewingSource(null); setViewingChunks(null); }} />
              <div className="relative bg-[#111827] border-l border-[#1F2937] h-screen w-full max-w-2xl shadow-2xl p-16 overflow-y-auto animate-in slide-in-from-right duration-500">
                 <div className="flex justify-between items-start mb-12">
                    <div><h2 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-2">{viewingSource.name}</h2><p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-[0.3em]">Knowledge Fragments</p></div>
                    <X className="size-8 text-gray-500 hover:text-white cursor-pointer" onClick={() => { setViewingSource(null); setViewingChunks(null); }} />
                 </div>
                 <div className="space-y-6">
                    {viewingChunks.map((chunk, i) => (
                       <div key={chunk.id} className="p-8 bg-[#0B0F14] border border-[#1F2937] rounded-[40px] relative group hover:border-[#6366F1]/40 transition-all">
                          <div className="absolute -left-3 top-8 size-6 bg-[#6366F1] rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-glow">{i+1}</div>
                          <p className="text-xl font-medium text-gray-400 italic leading-relaxed">{chunk.content}</p>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* Add Source Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B0F14]/95 backdrop-blur-2xl" onClick={() => setIsAddOpen(false)} />
            <div className="relative bg-[#111827] border border-[#1F2937] rounded-[60px] p-16 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-12"><h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">Expand Brain</h2><X className="size-8 text-gray-500 cursor-pointer" onClick={() => setIsAddOpen(false)} /></div>
               <div className="space-y-6">
                  <div onClick={() => fileInputRef.current?.click()} className="p-10 border border-[#1F2937] bg-[#0B0F14]/50 rounded-[40px] hover:border-[#6366F1] cursor-pointer flex items-center gap-8 group transition-all">
                     <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center group-hover:text-[#6366F1] transition-all"><HardDrive className="size-10" /></div>
                     <div><h4 className="font-bold text-2xl text-white italic uppercase">Local Asset</h4><p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">PDF, DOCX, TXT</p></div>
                  </div>
                  <div className="p-10 border border-[#1F2937] bg-[#0B0F14]/80 rounded-[40px] space-y-8">
                     <div className="flex items-center gap-8"><div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center"><Globe className="size-10 text-gray-600" /></div><div><h4 className="font-bold text-2xl text-white italic uppercase">Platform Sync</h4><p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Slack, GitHub, Web</p></div></div>
                     <div className="flex gap-4">
                        <Input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} className="bg-[#111827] border-[#1F2937] h-16 rounded-3xl text-white font-bold px-6 text-lg" placeholder="Paste link..." />
                        <Button onClick={() => addSource()} className="bg-[#6366F1] text-white h-16 px-10 font-bold rounded-3xl uppercase text-xs italic shadow-glow">Import</Button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
