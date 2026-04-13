"use client";

import { useMemo, useState } from "react";
import {
  CaretDown,
  CaretRight,
  FileText,
  FolderSimple,
  DotsThree,
  Lock,
  MagnifyingGlass,
  Plus,
  Rows,
  Trash,
  Copy,
  PencilSimple,
} from "@phosphor-icons/react";
import { Capabilities, SOPProject, useStore } from "@/lib/store/useStore";
import { cn } from "@/lib/utils";

type FilterMode = "all" | "drafts" | "proposals" | "finalized";

interface WorkspaceTreePaneProps {
  project: SOPProject;
  activeDocId: string;
  capabilities: Capabilities;
  onSelectDoc: (docId: string) => void;
  onDeleteDoc: (docId: string) => void;
  onDuplicateDoc: (docId: string) => string | null;
}

export function WorkspaceTreePane({
  project,
  activeDocId,
  capabilities,
  onSelectDoc,
  onDeleteDoc,
  onDuplicateDoc,
}: WorkspaceTreePaneProps) {
  const { updateDoc, moveDocToStage } = useStore();
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [expandedStageIds, setExpandedStageIds] = useState<Record<string, boolean>>({});
  const [dragDocId, setDragDocId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const docs = project.levels.L4.filter((doc) => {
      const workspace = project.docWorkspace?.[doc.id];
      const pendingCount = workspace?.proposals.filter((proposal) => proposal.status === "pending").length ?? 0;
      const matchesQuery = normalizedQuery.length === 0 || doc.title.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "drafts" && !!workspace?.dirty) ||
        (filterMode === "proposals" && pendingCount > 0) ||
        (filterMode === "finalized" && !!workspace?.finalized);
      return matchesQuery && matchesFilter;
    });
    return new Set(docs.map((doc) => doc.id));
  }, [filterMode, project.docWorkspace, project.levels.L4, query]);

  const canManageTree = capabilities.canManageStructure;

  return (
    <div className="h-full flex flex-col bg-surface border-r border-subtle">
      <div className="p-4 border-b border-subtle space-y-3">
        <p className="text-xs uppercase tracking-widest font-bold text-text-muted">Structure</p>
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-subtle bg-canvas text-sm"
            placeholder="Search docs..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterMode}
            onChange={(event) => setFilterMode(event.target.value as FilterMode)}
            className="flex-1 px-2 py-2 rounded-lg border border-subtle bg-canvas text-xs"
          >
            <option value="all">All</option>
            <option value="drafts">Drafts</option>
            <option value="proposals">Proposals</option>
            <option value="finalized">Finalized</option>
          </select>
          <button
            disabled={!canManageTree}
            title={canManageTree ? "Create doc under first stage" : "Requires admin permissions"}
            onClick={() => {
              const firstStage = project.levels.L3[0];
              if (!firstStage) return;
              const nextTitle = `New Procedure ${project.levels.L4.length + 1}`;
              const sourceDoc = project.levels.L4[0];
              if (!sourceDoc) return;
              const duplicateId = onDuplicateDoc(sourceDoc.id);
              if (!duplicateId) return;
              moveDocToStage(project.id, duplicateId, firstStage.id);
              updateDoc(project.id, "L4", duplicateId, {
                title: nextTitle,
                status: "todo",
                scribeChecked: false,
              });
              onSelectDoc(duplicateId);
            }}
            className="px-2.5 rounded-lg border border-subtle bg-canvas disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canManageTree ? <Plus size={14} /> : <Lock size={14} />}
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-subtle text-xs text-text-muted space-y-2">
        <div className="flex items-center gap-2">
          <Rows size={14} />
          <span className="font-semibold">Locked structure levels</span>
        </div>
        <div className="space-y-1.5">
          {[project.levels.L1, project.levels.L2].map((levelDoc) => (
            <div
              key={levelDoc.id}
              className="rounded-md border border-subtle bg-canvas px-2.5 py-1.5 flex items-center gap-2"
            >
              <Lock size={12} className="shrink-0" />
              <span className="truncate">{levelDoc.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar p-3 space-y-2">
        {project.levels.L3.map((stage) => {
          const stageDocs = project.levels.L4.filter(
            (doc) => doc.parentStageId === stage.id && filteredDocs.has(doc.id)
          );
          const isExpanded = expandedStageIds[stage.id] ?? true;
          return (
            <section
              key={stage.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!dragDocId) return;
                moveDocToStage(project.id, dragDocId, stage.id);
                setDragDocId(null);
              }}
              className="rounded-lg border border-subtle bg-canvas overflow-hidden"
            >
              <button
                className="w-full px-2.5 py-2 flex items-center justify-between text-left bg-canvas hover:bg-surface"
                onClick={() =>
                  setExpandedStageIds((previous) => ({
                    ...previous,
                    [stage.id]: !isExpanded,
                  }))
                }
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
                  <FolderSimple size={13} className="text-brand-primary shrink-0" />
                  <span className="text-xs font-semibold truncate">{stage.title}</span>
                </span>
                <span className="text-[10px] text-text-muted shrink-0">{stageDocs.length} docs</span>
              </button>

              {isExpanded && (
                <div className="border-t border-subtle divide-y divide-subtle">
                  {stageDocs.map((doc) => {
                    const workspace = project.docWorkspace?.[doc.id];
                    const pendingCount =
                      workspace?.proposals.filter((proposal) => proposal.status === "pending").length ?? 0;
                    return (
                      <div
                        key={doc.id}
                        draggable={canManageTree}
                        onDragStart={() => setDragDocId(doc.id)}
                        onDragEnd={() => setDragDocId(null)}
                        className={cn(
                          "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-2 text-xs",
                          activeDocId === doc.id
                            ? "bg-brand-primary/5"
                            : "bg-surface hover:bg-canvas"
                        )}
                      >
                        <button
                          onClick={() => onSelectDoc(doc.id)}
                          className="min-w-0 text-left flex items-center gap-2"
                        >
                          <FileText size={12} className="text-text-muted shrink-0" />
                          <span
                            className={cn(
                              "truncate",
                              activeDocId === doc.id && "font-semibold text-brand-primary"
                            )}
                          >
                            {doc.title}
                          </span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <div className="hidden xl:flex items-center gap-1 text-[10px]">
                            {workspace?.dirty && (
                              <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                                Draft
                              </span>
                            )}
                            {pendingCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-status-premium/10 text-status-premium">
                                {pendingCount} proposals
                              </span>
                            )}
                            {workspace?.finalized && (
                              <span className="px-1.5 py-0.5 rounded bg-status-success/10 text-status-success">
                                Finalized
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              disabled={!canManageTree}
                              onClick={() => {
                                const renamed = window.prompt("Rename document", doc.title);
                                if (!renamed || renamed.trim().length === 0) return;
                                updateDoc(project.id, "L4", doc.id, { title: renamed.trim() });
                              }}
                              className="p-1 rounded hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Rename"
                            >
                              {canManageTree ? <PencilSimple size={12} /> : <Lock size={12} />}
                            </button>
                            <button
                              disabled={!canManageTree}
                              onClick={() => onDuplicateDoc(doc.id)}
                              className="p-1 rounded hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Duplicate"
                            >
                              {canManageTree ? <Copy size={12} /> : <Lock size={12} />}
                            </button>
                            <button
                              disabled={!canManageTree}
                              onClick={() => onDeleteDoc(doc.id)}
                              className="p-1 rounded hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {canManageTree ? <Trash size={12} /> : <Lock size={12} />}
                            </button>
                            <button className="p-1 rounded hover:bg-canvas" title="More">
                              <DotsThree size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {stageDocs.length === 0 && (
                    <p className="px-3 py-2 text-[11px] text-text-muted">No docs match current filter.</p>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
