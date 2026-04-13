"use client"

import { useState, useEffect, useRef } from "react";
import { 
  PaperPlaneRight, 
  User, 
  Robot,
  CheckCircle,
  X,
  TrendUp,
  TreeView,
  ArrowRight
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useStore, InterviewMessage } from "@/lib/store/useStore";
import { Progress } from "@/components/ui/progress";

interface BreakdownInterviewProps {
  projectId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function BreakdownInterview({ projectId, onClose, onComplete }: BreakdownInterviewProps) {
  const { projects, addMessage, setUnderstanding } = useStore();
  const project = projects.find(p => p.id === projectId);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [project?.interviewHistory]);

  if (!project) return null;

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: InterviewMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    addMessage(projectId, userMsg);
    setInputValue("");

    // Simulate AI thinking and response
    setTimeout(() => {
      const aiMsg: InterviewMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'ai',
        content: `That's a great point about the ${inputValue.split(' ').slice(0, 2).join(' ')} step. Based on that, I've identified a new potential stage for the L3 hierarchy. Should we group the data gathering steps into a 'Preparation' stage?`,
        timestamp: Date.now()
      };
      addMessage(projectId, aiMsg);
      
      // Increase understanding incrementally
      const newUnderstanding = Math.min(project.understanding + 15, 100);
      setUnderstanding(projectId, newUnderstanding);
    }, 1500);
  };

  const isReady = project.understanding === 100;

  return (
    <div className="fixed inset-0 bg-canvas z-[60] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <header className="h-20 border-b border-subtle glass px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-canvas transition-colors text-text-muted"
          >
            <X size={20} weight="bold" />
          </button>
          <div className="h-8 w-[1px] bg-border-muted mx-2" />
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">{project.name}</h2>
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Phase 1: SOP Breakdown Interview</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
            <div className="flex justify-between w-full text-[10px] font-bold uppercase tracking-wider">
              <span className="text-text-muted flex items-center gap-1">
                <TrendUp size={12} weight="bold" /> AI Understanding
              </span>
              <span className="text-brand-primary">{project.understanding}%</span>
            </div>
            <Progress value={project.understanding} className="h-1.5" />
          </div>
          
          <button 
            disabled={!isReady}
            onClick={onComplete}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm",
              isReady 
                ? "bg-brand-primary text-white hover:opacity-90 shadow-brand-primary/20" 
                : "bg-border-muted text-text-muted cursor-not-allowed"
            )}
          >
            <span>Finalize Structure</span>
            <CheckCircle size={18} weight="fill" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-canvas relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-auto custom-scrollbar p-8 space-y-8 scroll-smooth"
          >
            {project.interviewHistory.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'ai' ? "bg-brand-primary text-white" : "bg-surface border border-subtle"
                )}>
                  {msg.role === 'ai' ? <Robot size={22} weight="fill" /> : <User size={22} weight="bold" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border",
                  msg.role === 'ai' 
                    ? "bg-surface border-subtle rounded-tl-none text-text-primary" 
                    : "bg-brand-primary text-white border-brand-primary rounded-tr-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-8 bg-gradient-to-t from-canvas to-transparent pt-12">
            <div className="max-w-3xl mx-auto relative group">
              <input 
                type="text" 
                placeholder="Type your response here..." 
                className="w-full pl-6 pr-14 py-4 bg-surface border border-subtle rounded-2xl shadow-lg focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none font-sans text-sm"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
              >
                <PaperPlaneRight size={20} weight="fill" />
              </button>
            </div>
            <p className="text-center mt-4 text-[10px] text-text-muted font-medium uppercase tracking-widest">
              AI is processing your input to optimize the ClickUp hierarchy.
            </p>
          </div>
        </div>

        {/* Hierarchy Preview Sidebar */}
        <aside className="w-80 border-l border-subtle bg-surface flex flex-col">
          <div className="p-6 border-b border-subtle flex items-center gap-2">
            <TreeView size={18} className="text-brand-primary" weight="fill" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Live Stage Tree</h3>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-6 text-text-primary">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <div className="w-5 h-5 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px]">L1</div>
                <span>{project.levels.L1.title}</span>
              </div>
              
              <div className="ml-4 space-y-4 border-l-2 border-border-muted pl-4">
                <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                  <div className="w-4 h-4 rounded bg-canvas text-text-muted flex items-center justify-center text-[8px] border border-subtle">L2</div>
                  <span>{project.levels.L2.title}</span>
                </div>

                <div className="space-y-3">
                  {project.levels.L3.map((stage, i) => (
                    <div key={stage.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-4 h-4 rounded-full bg-brand-primary text-white flex items-center justify-center text-[8px] font-bold">{i + 1}</div>
                        <span>{stage.title}</span>
                      </div>
                      <div className="ml-6 space-y-1.5">
                        {project.levels.L4.slice(i * 2, (i + 1) * 2).map(proc => (
                          <div key={proc.id} className="flex items-center gap-2 text-[10px] text-text-muted group">
                            <ArrowRight size={10} className="text-text-muted/40 group-hover:text-brand-primary transition-colors" />
                            <span className="truncate">{proc.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-canvas border-t border-subtle text-center">
             <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sync Mapping</span>
             <p className="text-[9px] text-text-muted mt-1 leading-relaxed">
               This structure will be pushed as a **Milestone (L1)** with nested **Subtasks (L2-L4)**.
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
