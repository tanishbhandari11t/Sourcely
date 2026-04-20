"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Sourcely AI assistant. I've indexed your workspace knowledge. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);


    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, workspace_id: "default-workspace" }),
      });

      const data = await res.json();
      
      if (data.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        throw new Error("No answer from AI");
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex bg-[#0B0F14] min-h-screen text-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

        {/* Header */}
        <header className="p-6 border-b border-[#1F2937] flex items-center justify-between bg-[#0B0F14]/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-[#6366F1]/20 rounded-lg flex items-center justify-center text-[#6366F1]">
              <Sparkles className="size-4" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">AI Knowledge Assistant</h1>
          </div>
          <div className="text-xs text-gray-500 font-medium px-3 py-1 bg-[#111827] border border-[#1F2937] rounded-full">
            Model: Llama-3 70B
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  m.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "size-10 shrink-0 rounded-xl flex items-center justify-center shadow-lg",
                  m.role === "assistant" ? "bg-[#6366F1]/20 text-[#6366F1]" : "bg-[#111827] text-gray-400 border border-[#1F2937]"
                )}>
                  {m.role === "assistant" ? <Sparkles className="size-5" /> : <User className="size-5" />}
                </div>
                <div className={cn(
                  "space-y-1.5 max-w-[80%]",
                  m.role === "user" ? "items-end" : ""
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl shadow-xl text-sm leading-relaxed",
                    m.role === "assistant" 
                      ? "bg-[#111827] border border-[#1F2937] rounded-tl-none text-white" 
                      : "bg-[#6366F1] rounded-tr-none text-white"
                  )}>
                    {m.content}
                  </div>
                  <p className={cn(
                    "text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1",
                    m.role === "user" ? "text-right" : ""
                  )}>
                    {m.role === "assistant" ? "Sourcely AI" : "You"}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 animate-pulse">
                <div className="size-10 bg-[#6366F1]/10 rounded-xl flex items-center justify-center text-[#6366F1]">
                  <Loader2 className="size-5 animate-spin" />
                </div>
                <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-2xl rounded-tl-none w-24 h-12" />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#0B0F14] to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366F1] to-[#22C55E] rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition duration-500" />
            <div className="relative">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask anything about your workspace sources..." 
                className="h-14 pl-6 pr-16 bg-[#111827] border-[#1F2937] text-white focus:border-[#6366F1] focus:ring-0 rounded-2xl shadow-2xl transition-all"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage}
                disabled={isLoading}
                className="absolute right-2 top-2 h-10 w-10 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl transition-all shadow-lg active:scale-95"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-[0.2em] font-medium">
            AI-powered answers grounded in your data
          </p>
        </div>
      </main>
    </div>
  );
}
