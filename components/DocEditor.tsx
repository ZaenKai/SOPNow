"use client"

import { 
  Check, 
  FileText, 
  ChatTeardropText, 
  Eye, 
  CloudArrowUp,
  FloppyDisk,
  Warning,
  Info,
  Lightbulb,
  WarningCircle
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useStore, LevelDoc } from "@/lib/store/useStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocEditorProps {
  projectId: string;
  docId: string;
  level: 'L1' | 'L2' | 'L3' | 'L4';
}

export function DocEditor({ projectId, docId, level }: DocEditorProps) {
  const { projects, updateDoc } = useStore();
  const project = projects.find(p => p.id === projectId);
  
  // Find the doc based on level and id
  let doc: LevelDoc | undefined;
  if (level === 'L1' || level === 'L2') {
    doc = project?.levels[level];
  } else {
    doc = project?.levels[level].find(d => d.id === docId);
  }

  if (!doc) return null;

  const handleScribeToggle = () => {
    updateDoc(projectId, level, docId, { scribeChecked: !doc?.scribeChecked });
  };

  const handleComplete = () => {
    updateDoc(projectId, level, docId, { status: 'completed' });
  };

  return (
    <div className="flex flex-col h-full bg-canvas animate-in fade-in slide-in-from-right-2 duration-300">
      {/* Header */}
      <header className="h-16 border-b border-subtle bg-surface px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center text-text-muted border border-subtle">
            <FileText size={18} weight="fill" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-tight">{doc.title}</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
              <span>{level} Doc</span>
              <span>•</span>
              <span className={cn(
                doc.status === 'completed' ? "text-status-success" : "text-status-premium"
              )}>
                {doc.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-text-muted hover:bg-canvas transition-colors">
            <FloppyDisk size={16} />
            <span>Save & Close</span>
          </button>
          <button 
            onClick={handleComplete}
            className="bg-brand-primary text-white flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 shadow-sm shadow-brand-primary/20"
          >
            <CloudArrowUp size={16} weight="bold" />
            <span>Complete & Push</span>
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Scribe Checklist Banner */}
        <div className={cn(
          "px-6 py-3 border-b transition-colors flex items-center justify-between",
          doc.scribeChecked 
            ? "bg-status-success/5 border-status-success/20" 
            : "bg-status-error/5 border-status-error/20"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
              doc.scribeChecked 
                ? "bg-status-success border-status-success text-white" 
                : "bg-surface border-border-subtle"
            )} onClick={handleScribeToggle}>
              {doc.scribeChecked && <Check size={14} weight="bold" />}
            </div>
            <span className={cn(
              "text-xs font-bold tracking-tight",
              doc.scribeChecked ? "text-status-success" : "text-status-error"
            )}>
              Did you embed the Scribe visual guide in ClickUp?
            </span>
          </div>
          {!doc.scribeChecked && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-status-error uppercase">
              <WarningCircle size={14} weight="fill" />
              <span>Required for 100% completion</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <div className="px-6 border-b border-subtle bg-surface/30">
            <TabsList className="bg-transparent gap-6 h-12">
              <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-primary rounded-none px-0 text-xs font-bold uppercase tracking-widest text-text-muted data-[state=active]:text-brand-primary">
                <ChatTeardropText size={16} className="mr-2" />
                AI Discussion
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-primary rounded-none px-0 text-xs font-bold uppercase tracking-widest text-text-muted data-[state=active]:text-brand-primary">
                <Eye size={16} className="mr-2" />
                ClickUp Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 overflow-auto custom-scrollbar p-8 m-0 bg-canvas/30">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-surface p-4 rounded-2xl border border-subtle shadow-sm">
                <p className="text-sm leading-relaxed text-text-primary">
                  Welcome to the refinement stage for <span className="font-bold text-brand-primary">&quot;{doc.title}&quot;</span>. I&apos;ve analyzed your Scribe upload and drafted the procedure below. Is there any specific step we should emphasize, or should I add a Warning block for the authentication step?
                </p>
              </div>
              
              {/* Mock AI input for refinement */}
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Ask AI to refine this section..." 
                  className="w-full pl-4 pr-12 py-3 bg-surface border border-subtle rounded-xl shadow-md focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none font-sans text-sm text-text-primary"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors">
                  <Check size={20} weight="bold" />
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto custom-scrollbar p-8 m-0 bg-surface dark:bg-canvas">
            <div className="max-w-3xl mx-auto space-y-8 font-sans">
              <h1 className="text-4xl font-bold tracking-tight text-text-primary border-b border-subtle pb-4">
                {doc.title}
              </h1>

              {/* Mock ClickUp Callout Blocks - Using fixed semantic colors for ClickUp compatibility preview */}
              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                  <Info size={24} weight="fill" className="text-blue-500 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Purpose</span>
                    <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                      This procedure outlines the necessary steps to successfully {doc.title.toLowerCase()}. Adherence to this guide ensures data integrity across all systems.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500">
                  <Lightbulb size={24} weight="fill" className="text-emerald-500 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Requirements</span>
                    <ul className="text-sm text-emerald-900 dark:text-emerald-100 list-disc ml-4 space-y-1">
                      <li>Administrator access to ClickUp</li>
                      <li>Verified Scribe account</li>
                      <li>Internal Process ID</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text-primary">Step-by-Step Procedure</h3>
                  <div className="space-y-6">
                    {[1, 2, 3].map(step => (
                      <div key={step} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-canvas flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0 border border-subtle">
                          {step}
                        </div>
                        <div className="space-y-2 flex-1">
                          <p className="text-sm text-text-primary leading-relaxed">
                            {faker.lorem.sentence()}
                          </p>
                          <div className="aspect-video bg-canvas rounded-lg border border-dashed border-subtle flex flex-col items-center justify-center gap-2 text-text-muted">
                            <CloudArrowUp size={24} />
                            <span className="text-[10px] uppercase font-bold tracking-widest">[ Scribe Placeholder ]</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500">
                  <Warning size={24} weight="fill" className="text-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Variations & Risks</span>
                    <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                      If the system returns a 403 error, verify that Developer Mode is enabled in your ClickUp workspace settings before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Inline faker import since we are in a component
import { faker } from "@faker-js/faker";
