"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Bot, 
  Sparkles, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  BrainCircuit,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaces } from "@/context/workspace-context";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { generateWikiIntelligence } from "@/lib/actions/ai-actions";

export default function WikiPage() {
  const { activeWorkspace } = useWorkspaces();
  const supabase = createClient();
  const router = useRouter();
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChunks, setHasChunks] = useState<boolean | null>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    fetchPages();
    checkIntelligence();
  }, [activeWorkspace]);

  const checkIntelligence = async () => {
    const { count } = await supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', activeWorkspace?.id);
    setHasChunks((count || 0) > 0);
  };

  const fetchPages = async () => {
    const { data } = await supabase
      .from('wiki_pages')
      .select('*')
      .eq('workspace_id', activeWorkspace?.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setPages(data);
      if (data.length > 0 && !selectedPage) setSelectedPage(data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!activeWorkspace) return;
    setIsGenerating(true);
    try {
      const res = await generateWikiIntelligence(activeWorkspace.id);
      if (res.success) {
        await fetchPages();
        await checkIntelligence();
      } else {
        alert(res.error || "Generation failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex bg-[#0B0F14] h-screen text-[#F3F4F6] overflow-hidden">
      <Sidebar />
      <div className="w-80 border-r border-[#1F2937] bg-[#0B0F14]/50 flex flex-col p-8 space-y-10 backdrop-blur-3xl">
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Wiki Portal</h2>
              <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-[0.3em]">AI Intel</p>
           </div>
           <button 
             onClick={handleGenerate}
             disabled={isGenerating || hasChunks === false}
             className={cn(
               "p-3 rounded-2xl shadow-2xl transition-all",
               isGenerating ? "bg-indigo-900 animate-pulse" : "bg-[#6366F1] hover:bg-[#4F46E5] text-white"
             )}
           >
              {isGenerating ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
           </button>
        </div>

        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
           <Input 
             placeholder="Search brain..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-12 bg-[#111827] border-[#1F2937] rounded-3xl h-14 text-sm"
           />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
           {filteredPages.map(page => (
             <button 
               key={page.id}
               onClick={() => setSelectedPage(page)}
               className={cn(
                 "w-full text-left p-6 rounded-[30px] transition-all border",
                 selectedPage?.id === page.id 
                   ? "bg-gradient-to-tr from-[#6366F1]/10 to-indigo-950/20 border-[#6366F1]/40 shadow-2xl" 
                   : "border-transparent hover:bg-white/[0.03]"
               )}
             >
                <p className={cn("font-bold text-base leading-tight mb-2", selectedPage?.id === page.id ? "text-white" : "text-gray-400")}>{page.title}</p>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none">AI Page • {new Date(page.created_at).toLocaleDateString()}</p>
             </button>
           ))}
        </div>
      </div>

      <main className="flex-1 p-16 overflow-y-auto relative bg-[#0B0F14]">
        <div className="max-w-4xl mx-auto relative z-10 h-full">
          {selectedPage ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               <div className="flex items-center justify-between">
                  <div className="px-4 py-1.5 bg-[#6366F1]/10 text-[#6366F1] rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-indigo-500/20 shadow-indigo-500/5">
                     <span className="animate-pulse mr-2">●</span> Intelligence Verified
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">ID: {selectedPage.id.substring(0,8)}</span>
               </div>
               <h1 className="text-7xl font-black tracking-tighter text-white italic uppercase">{selectedPage.title}</h1>
               <div className="prose prose-invert max-w-none prose-p:text-gray-400 prose-p:text-xl prose-p:leading-relaxed">
                  <div className="whitespace-pre-wrap font-medium">
                    {selectedPage.content}
                  </div>
               </div>
            </div>
          ) : hasChunks === false ? (
            <div className="h-full flex flex-col items-center justify-center space-y-10 text-center">
               <div className="size-32 bg-[#111827] border-2 border-[#1F2937] rounded-[45px] flex items-center justify-center text-[#6366F1] shadow-2xl transform -rotate-12">
                  <Bot className="size-16" />
               </div>
               <div className="max-w-md space-y-6">
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">Brain Empty</h2>
                  <p className="text-gray-500 font-medium text-lg leading-relaxed">No sources have been indexed yet. Go to the Sources tab to feed the workspace brain.</p>
                  <Button onClick={() => router.push('/sources')} className="bg-[#6366F1] text-white rounded-2xl h-16 px-10 font-bold uppercase tracking-widest text-xs">Feed Brain</Button>
               </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-10 text-center opacity-30 cursor-pointer group" onClick={handleGenerate}>
               <Sparkles className="size-20 text-[#6366F1] animate-pulse group-hover:scale-125 transition-transform" />
               <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">Synthesize Intel</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
