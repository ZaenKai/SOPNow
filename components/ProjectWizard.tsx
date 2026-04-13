"use client"

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  RocketLaunch, 
  ArrowRight,
  ArrowLeft,
  Folders
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { LevelDoc, useStore } from "@/lib/store/useStore";
import { faker } from "@faker-js/faker";

const COMPANIES = ['MetaShift Corp', 'Nebula Solutions', 'Quantum Logistics', 'Solaris Energy'];
const DEPARTMENTS = ['Finance & Accounting', 'Human Resources', 'Engineering', 'Customer Success', 'Marketing'];
const WORKSPACES = ['Main Workspace', 'Side Project', 'Client A'];

interface ProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectId: string) => void;
}

export function ProjectWizard({ open, onOpenChange, onProjectCreated }: ProjectWizardProps) {
  const [step, setStep] = useState(1);
  const { addProject, setCurrentProject } = useStore();
  
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    department: "",
    workspace: "",
    space: "",
    folder: ""
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleCreate = () => {
    const projectName = formData.name.trim() || "New SOP Project";
    const workspace = formData.workspace || WORKSPACES[0];
    const space = formData.space.trim() || formData.department || DEPARTMENTS[0];
    const dept = formData.department || DEPARTMENTS[0];
    const makeDoc = (title: string): LevelDoc => ({
      id: faker.string.uuid(),
      title,
      content: '',
      scribeChecked: false,
      status: 'todo',
    });
    const newProject = {
      id: crypto.randomUUID(),
      name: projectName,
      company: formData.company || COMPANIES[0],
      department: dept,
      clickupDestination: {
        workspace,
        space,
        folder: formData.folder.trim() || `${projectName} Folder`,
      },
      status: "drafting" as const,
      progress: 0,
      levels: {
        L1: makeDoc(`${projectName} Overview`),
        L2: makeDoc(`${projectName} Master Process`),
        L3: [makeDoc(`${projectName} Stage 1`), makeDoc(`${projectName} Stage 2`)],
        L4: [makeDoc(`${projectName} Procedure 1`), makeDoc(`${projectName} Procedure 2`)],
      },
      understanding: 0,
      setupCompleted: false,
      lifecycle: "active" as const,
      interviewHistory: [
        {
          id: crypto.randomUUID(),
          role: "ai" as const,
          content: `Welcome! Let's map ${projectName}. What is the primary business outcome this SOP should support?`,
          timestamp: Date.now(),
        },
      ],
    };
    
    addProject(newProject);
    setCurrentProject(newProject.id);
    onProjectCreated?.(newProject.id);
    onOpenChange(false);
    // Reset wizard
    setStep(1);
    setFormData({ name: "", company: "", department: "", workspace: "", space: "", folder: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-surface border-0 ring-0">
        <DialogHeader className="p-6 bg-canvas border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <RocketLaunch size={24} weight="fill" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Initiate SOP Project</DialogTitle>
              <DialogDescription className="text-xs">Phase 0: Context & Destination Setup</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Project Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sales Tax Filing Procedure" 
                  className="w-full px-4 py-3 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-sans"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Company</label>
                  <select 
                    className="w-full px-4 py-3 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-sans appearance-none"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  >
                    <option value="">Select Company</option>
                    {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Department</label>
                  <select 
                    className="w-full px-4 py-3 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-sans appearance-none"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Select Dept</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/10 flex gap-3">
                <Folders size={20} className="text-brand-primary shrink-0" weight="fill" />
                <p className="text-[11px] text-brand-primary/80 leading-relaxed font-medium">
                  sopnow is pulling your ClickUp hierarchy via MCP. Select the target destination for this SOP.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">ClickUp Workspace</label>
                  <select 
                    className="w-full px-4 py-3 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-sans"
                    value={formData.workspace}
                    onChange={(e) => setFormData({...formData, workspace: e.target.value})}
                  >
                    <option value="">Select Workspace</option>
                    {WORKSPACES.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Target Space (L1 Destination)</label>
                  <input 
                    type="text" 
                    placeholder="Search Spaces..." 
                    className="w-full px-4 py-3 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-sans"
                    value={formData.space}
                    onChange={(e) => setFormData({...formData, space: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-canvas border-t border-subtle">
          <div className="flex w-full justify-between items-center">
            <div className="flex gap-1.5">
              {[1, 2].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "w-6 h-1 rounded-full transition-all",
                    step === i ? "bg-brand-primary w-10" : "bg-border-muted"
                  )} 
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {step > 1 && (
                <button 
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} weight="bold" />
                  <span>Back</span>
                </button>
              )}
              
              <button 
                onClick={step === 2 ? handleCreate : handleNext}
                className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span>{step === 2 ? "Initiate Project" : "Next"}</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
