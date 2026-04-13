"use client"

import { useState } from "react";
import { 
  CaretRight, 
  CaretDown, 
  CheckCircle, 
  Circle,
  Clock,
  PaperPlaneTilt,
  Buildings
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useStore, LevelDoc } from "@/lib/store/useStore";
import { Progress } from "@/components/ui/progress";

type Level = 'L1' | 'L2' | 'L3' | 'L4';

interface HierarchyNavProps {
  projectId: string;
  activeDocId: string;
  onSelect: (level: Level, id: string) => void;
}

interface NavItemProps {
  doc: LevelDoc;
  level: Level;
  isActive: boolean;
  isChild?: boolean;
  onSelect: (level: Level, id: string) => void;
}

const NavItem = ({ doc, level, isActive, isChild = false, onSelect }: NavItemProps) => {
  return (
    <button 
      onClick={() => onSelect(level, doc.id)}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all group",
        isChild ? "ml-4" : "",
        isActive 
          ? "bg-brand-primary/10 text-brand-primary font-bold" 
          : "text-text-muted hover:bg-canvas hover:text-text-primary"
      )}
    >
      {doc.status === 'completed' && doc.scribeChecked ? (
        <CheckCircle size={14} weight="fill" className="text-status-success" />
      ) : doc.status === 'in-progress' ? (
        <Clock size={14} weight="fill" className="text-status-premium" />
      ) : (
        <Circle size={14} className="text-border-subtle" />
      )}
      <span className="truncate">{doc.title}</span>
    </button>
  );
};

export function HierarchyNav({ projectId, activeDocId, onSelect }: HierarchyNavProps) {
  const { projects } = useStore();
  const project = projects.find(p => p.id === projectId);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ L1: true, L2: true, L3: true });

  if (!project) return null;

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-6 border-b border-subtle space-y-4">
        <div className="flex items-center gap-2 text-text-muted">
          <Buildings size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{project.company}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-text-muted">Overall Progress</span>
            <span className="text-brand-primary">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1" />
        </div>
      </div>

      <nav className="flex-1 overflow-auto custom-scrollbar p-4 space-y-2">
        <NavItem doc={project.levels.L1} level="L1" isActive={activeDocId === project.levels.L1.id} onSelect={onSelect} />
        <NavItem doc={project.levels.L2} level="L2" isActive={activeDocId === project.levels.L2.id} onSelect={onSelect} />
        
        <div className="space-y-1">
          <button 
            onClick={() => toggle('L3')}
            className="w-full flex items-center gap-2 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
          >
            {expanded.L3 ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}
            <span>Stages & Procedures</span>
          </button>
          
          {expanded.L3 && project.levels.L3.map((stage, i) => (
            <div key={stage.id} className="space-y-1">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-text-primary/70 italic">
                <span>{i + 1}.0 {stage.title}</span>
              </div>
              {project.levels.L4.filter((_, idx) => Math.floor(idx / 2) === i).map(proc => (
                <NavItem key={proc.id} doc={proc} level="L4" isChild isActive={activeDocId === proc.id} onSelect={onSelect} />
              ))}
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-subtle">
        <button 
          disabled={project.progress < 100}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all shadow-sm",
            project.progress === 100
              ? "bg-status-success text-white hover:opacity-90 shadow-status-success/20"
              : "bg-border-muted text-text-muted cursor-not-allowed opacity-50"
          )}
        >
          <PaperPlaneTilt size={18} weight="fill" />
          <span>Finalize & Close</span>
        </button>
      </div>
    </div>
  );
}
