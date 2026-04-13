"use client"

import { useState } from "react";
import { HierarchyNav } from "./HierarchyNav";
import { DocEditor } from "./DocEditor";
import { useStore } from "@/lib/store/useStore";
import { X } from "@phosphor-icons/react";

interface ProductionWorkspaceProps {
  projectId: string;
  onClose: () => void;
}

export function ProductionWorkspace({ projectId, onClose }: ProductionWorkspaceProps) {
  const { projects } = useStore();
  const project = projects.find(p => p.id === projectId);
  
  const [activeDoc, setActiveDoc] = useState<{level: 'L1' | 'L2' | 'L3' | 'L4', id: string}>({
    level: 'L1',
    id: project?.levels.L1.id || ''
  });

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-canvas z-[60] flex animate-in fade-in duration-300">
      {/* Sidebar Nav */}
      <aside className="w-72 border-r border-subtle h-full">
        <HierarchyNav 
          projectId={projectId} 
          activeDocId={activeDoc.id} 
          onSelect={(level, id) => setActiveDoc({ level, id })}
        />
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-canvas relative">
        <button 
          onClick={onClose}
          className="absolute right-6 top-4 z-50 p-2 rounded-lg hover:bg-surface transition-colors text-text-muted border border-subtle"
        >
          <X size={20} weight="bold" />
        </button>
        
        <DocEditor 
          key={activeDoc.id}
          projectId={projectId} 
          docId={activeDoc.id} 
          level={activeDoc.level} 
        />
      </main>
    </div>
  );
}
