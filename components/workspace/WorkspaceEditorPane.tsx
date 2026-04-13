"use client";

import { useMemo, useState } from "react";
import {
  ClockCounterClockwise,
  Eye,
  FloppyDiskBack,
  Lock,
  PencilSimple,
  SealCheck,
  Sparkle,
  UploadSimple,
} from "@phosphor-icons/react";
import { WorkspaceDocWorkflowPane } from "@/components/workspace/WorkspaceDocWorkflowPane";
import { Capabilities, CenterPaneMode, SOPProject, useStore } from "@/lib/store/useStore";
import { cn } from "@/lib/utils";

interface WorkspaceEditorPaneProps {
  project: SOPProject;
  docId: string;
  capabilities: Capabilities;
  centerPaneMode: CenterPaneMode;
  onCenterPaneModeChange: (mode: CenterPaneMode) => void;
}

type DocLevel = "L1" | "L2" | "L3" | "L4";

interface SectionTemplate {
  id: string;
  title: string;
  placeholder: string;
  minRows?: number;
}

const LEVEL_LABELS: Record<DocLevel, string> = {
  L1: "Process Overview",
  L2: "Process Map & Stages",
  L3: "Process Stage",
  L4: "Procedure",
};

const SECTION_TEMPLATES: Record<DocLevel, SectionTemplate[]> = {
  L1: [
    {
      id: "purpose",
      title: "Purpose",
      placeholder: "Describe why this process exists and the problem it solves.",
      minRows: 4,
    },
    {
      id: "guiding-principles",
      title: "Guiding Principles",
      placeholder: "List the operating principles and standards for this process family.",
      minRows: 4,
    },
    {
      id: "scope",
      title: "Scope & Boundaries",
      placeholder: "Define where this process starts, where it ends, and what's excluded.",
      minRows: 4,
    },
    {
      id: "stakeholders",
      title: "Key Stakeholders & Owners",
      placeholder: "Capture accountable owners, supporting roles, and approvers.",
      minRows: 3,
    },
    {
      id: "success-criteria",
      title: "Success Criteria",
      placeholder: "State measurable success criteria for quality, timeliness, and compliance.",
      minRows: 3,
    },
  ],
  L2: [
    {
      id: "process-purpose",
      title: "Process Purpose & Trigger",
      placeholder: "Describe what initiates this process and the expected business outcome.",
      minRows: 4,
    },
    {
      id: "high-level-map",
      title: "High-Level Process Map",
      placeholder: "Summarize the full process path with major phases and transitions.",
      minRows: 5,
    },
    {
      id: "stage-breakdown",
      title: "Stage Breakdown",
      placeholder: "List all Level 3 stages with short descriptions and ownership.",
      minRows: 5,
    },
    {
      id: "systems-tools",
      title: "Systems & Tools",
      placeholder: "List systems, templates, and reference artifacts used in this process.",
      minRows: 3,
    },
    {
      id: "handoffs",
      title: "Inputs, Outputs & Handoffs",
      placeholder: "Document critical handoffs between roles and expected outputs.",
      minRows: 4,
    },
  ],
  L3: [
    {
      id: "stage-objective",
      title: "Stage Objective",
      placeholder: "Explain the objective and intended output of this stage.",
      minRows: 4,
    },
    {
      id: "entry-criteria",
      title: "Entry Criteria",
      placeholder: "Define required prerequisites before this stage starts.",
      minRows: 3,
    },
    {
      id: "procedure-index",
      title: "Procedure Index",
      placeholder: "List related Level 4 procedures and when each should be used.",
      minRows: 5,
    },
    {
      id: "outputs",
      title: "Stage Outputs",
      placeholder: "Specify deliverables and completion evidence for this stage.",
      minRows: 3,
    },
    {
      id: "risks-controls",
      title: "Risks & Controls",
      placeholder: "Capture key risks, mitigations, and quality controls for this stage.",
      minRows: 4,
    },
  ],
  L4: [
    {
      id: "purpose",
      title: "Purpose",
      placeholder: "Describe the intent and usage context for this procedure.",
      minRows: 3,
    },
    {
      id: "requirements",
      title: "Requirements & Prerequisites",
      placeholder: "List required access, tools, data, and dependencies.",
      minRows: 4,
    },
    {
      id: "quick-links",
      title: "Quick Links & References",
      placeholder: "Add links to systems, forms, related SOPs, and supporting documents.",
      minRows: 3,
    },
    {
      id: "steps",
      title: "Step-by-Step Procedure",
      placeholder: "Write clear, numbered steps with expected outcomes.",
      minRows: 8,
    },
    {
      id: "exceptions",
      title: "Exceptions & Variations",
      placeholder: "Document edge cases, exception paths, and alternate handling.",
      minRows: 4,
    },
    {
      id: "risk-quality",
      title: "Risk & Quality Checks",
      placeholder: "Highlight controls, checks, and critical warnings before completion.",
      minRows: 4,
    },
  ],
};

const normalizeSectionTitle = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getDocLevel = (project: SOPProject, docId: string): DocLevel => {
  if (project.levels.L1.id === docId) return "L1";
  if (project.levels.L2.id === docId) return "L2";
  if (project.levels.L3.some((candidate) => candidate.id === docId)) return "L3";
  return "L4";
};

const parseSectionsFromContent = (
  content: string,
  templates: SectionTemplate[]
): Record<string, string> => {
  const initial = templates.reduce<Record<string, string>>((accumulator, template) => {
    accumulator[template.id] = "";
    return accumulator;
  }, {});

  const normalizedContent = content.replace(/\r\n/g, "\n").trim();
  if (!normalizedContent) {
    return initial;
  }

  const headingRegex = /^##\s+(.+)$/gm;
  const headingMatches = Array.from(normalizedContent.matchAll(headingRegex));

  if (headingMatches.length === 0) {
    initial[templates[0].id] = normalizedContent;
    return initial;
  }

  headingMatches.forEach((match, index) => {
    const rawTitle = match[1]?.trim() ?? "";
    const headingStart = match.index ?? 0;
    const nextHeadingStart = headingMatches[index + 1]?.index ?? normalizedContent.length;
    let bodyStart = headingStart + match[0].length;

    while (normalizedContent[bodyStart] === "\n") {
      bodyStart += 1;
    }

    const body = normalizedContent.slice(bodyStart, nextHeadingStart).trim();
    const matchedTemplate = templates.find(
      (template) => normalizeSectionTitle(template.title) === normalizeSectionTitle(rawTitle)
    );

    if (!matchedTemplate) {
      const block = `## ${rawTitle}${body ? `\n${body}` : ""}`;
      initial[templates[0].id] = initial[templates[0].id]
        ? `${initial[templates[0].id]}\n\n${block}`.trim()
        : block;
      return;
    }

    initial[matchedTemplate.id] = initial[matchedTemplate.id]
      ? `${initial[matchedTemplate.id]}\n\n${body}`.trim()
      : body;
  });

  return initial;
};

const serializeSectionsToContent = (
  templates: SectionTemplate[],
  sections: Record<string, string>
): string =>
  templates
    .map((template) => {
      const value = sections[template.id]?.trim() ?? "";
      return `## ${template.title}\n${value}`;
    })
    .join("\n\n")
    .trim();

export function WorkspaceEditorPane({
  project,
  docId,
  capabilities,
  centerPaneMode,
  onCenterPaneModeChange,
}: WorkspaceEditorPaneProps) {
  const {
    commitRevision,
    createRevisionThread,
    discardDraft,
    finalizeDoc,
    restoreRevision,
    setDraftContent,
  } = useStore();
  const [showRevisionDrawer, setShowRevisionDrawer] = useState(false);
  const [editModeState, setEditModeState] = useState<{ activeDocId: string; enabled: boolean }>({
    activeDocId: docId,
    enabled: false,
  });

  const doc = useMemo(
    () =>
      [project.levels.L1, project.levels.L2, ...project.levels.L3, ...project.levels.L4].find(
        (candidate) => candidate.id === docId
      ),
    [docId, project.levels.L1, project.levels.L2, project.levels.L3, project.levels.L4]
  );
  const workspace = project.docWorkspace?.[docId];

  const docLevel = getDocLevel(project, docId);
  const sectionTemplates = SECTION_TEMPLATES[docLevel];
  const structuredSections = useMemo(
    () => parseSectionsFromContent(workspace?.draftContent ?? "", sectionTemplates),
    [sectionTemplates, workspace?.draftContent]
  );
  const hasMeaningfulContent = sectionTemplates.some(
    (template) => (structuredSections[template.id] ?? "").trim().length > 0
  );
  const pendingProposalCount = workspace?.proposals.filter((proposal) => proposal.status === "pending").length ?? 0;
  const canEdit = !!workspace && capabilities.canEditDocs && !workspace.finalized;
  const isEditModeRequested = editModeState.activeDocId === docId ? editModeState.enabled : false;
  const isEditMode = canEdit && isEditModeRequested;
  const canCommit = canEdit && !!workspace?.dirty;
  const isDocumentMode = centerPaneMode === "document";
  const canFinalize =
    !!workspace &&
    capabilities.canFinalizeDocs &&
    !workspace.finalized &&
    !workspace.dirty &&
    pendingProposalCount === 0 &&
    hasMeaningfulContent;

  if (!doc || !workspace) {
    return (
      <div className="h-full flex items-center justify-center bg-canvas">
        <p className="text-sm text-text-muted">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-canvas">
      <header className="h-16 border-b border-subtle bg-surface px-4 lg:px-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-text-muted font-bold">
            {isDocumentMode ? "Document" : "Workflow"}
          </p>
          <h2 className="text-sm lg:text-base font-bold text-text-primary truncate">{workspace.draftTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-subtle bg-canvas p-0.5">
            <button
              onClick={() => onCenterPaneModeChange("document")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider",
                isDocumentMode ? "bg-surface text-text-primary" : "text-text-muted"
              )}
            >
              Document
            </button>
            <button
              onClick={() => onCenterPaneModeChange("workflow")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider",
                !isDocumentMode ? "bg-surface text-text-primary" : "text-text-muted"
              )}
            >
              Workflow
            </button>
          </div>

          {isDocumentMode && (
            <>
              <div className="inline-flex items-center rounded-lg border border-subtle bg-canvas p-0.5">
                <button
                  onClick={() => setEditModeState({ activeDocId: docId, enabled: false })}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1",
                    !isEditMode ? "bg-surface text-text-primary" : "text-text-muted"
                  )}
                >
                  <Eye size={12} />
                  View
                </button>
                <button
                  onClick={() => setEditModeState({ activeDocId: docId, enabled: true })}
                  disabled={!canEdit}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed",
                    isEditMode ? "bg-surface text-text-primary" : "text-text-muted"
                  )}
                >
                  {canEdit ? <PencilSimple size={12} /> : <Lock size={12} />}
                  Edit
                </button>
              </div>
              <button
                onClick={() => setShowRevisionDrawer((current) => !current)}
                className="px-2.5 py-1.5 rounded-lg border border-subtle text-xs font-bold flex items-center gap-1.5"
              >
                <ClockCounterClockwise size={14} />
                Revisions
              </button>
              <button
                disabled={!canCommit}
                onClick={() => commitRevision(project.id, docId)}
                className="px-2.5 py-1.5 rounded-lg border border-subtle text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {capabilities.canEditDocs ? <UploadSimple size={14} /> : <Lock size={14} />}
                Commit Revision
              </button>
            </>
          )}
        </div>
      </header>

      {isDocumentMode && workspace.finalized && (
        <div className="px-4 lg:px-6 py-2 border-b border-status-success/20 bg-status-success/10 text-xs flex items-center justify-between gap-3">
          <span className="font-semibold text-status-success">
            Snapshot finalized. Create a revision thread to edit this document again.
          </span>
          <button
            onClick={() => createRevisionThread(project.id, docId)}
            className="px-2 py-1 rounded border border-status-success/30 text-status-success font-bold"
          >
            Create Revision Thread
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        {isDocumentMode ? (
          <>
            <div className="flex-1 p-4 lg:p-6 overflow-auto custom-scrollbar">
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Title</label>
                    <input
                      disabled={!canEdit}
                      value={workspace.draftTitle}
                      onChange={(event) => {
                        const next = event.target.value;
                        setDraftContent(project.id, docId, { title: next }, "manual");
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-subtle bg-surface text-sm disabled:opacity-60"
                    />
                  </div>
                  {sectionTemplates.map((template) => (
                    <div key={template.id} className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                        {template.title}
                      </label>
                      <textarea
                        disabled={!canEdit}
                        value={structuredSections[template.id] ?? ""}
                        onChange={(event) => {
                          const nextSections = {
                            ...structuredSections,
                            [template.id]: event.target.value,
                          };
                          setDraftContent(
                            project.id,
                            docId,
                            { content: serializeSectionsToContent(sectionTemplates, nextSections) },
                            "manual"
                          );
                        }}
                        rows={template.minRows ?? 4}
                        placeholder={template.placeholder}
                        className="w-full px-3 py-2 rounded-lg border border-subtle bg-surface text-sm leading-relaxed disabled:opacity-60"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mx-auto w-full max-w-4xl">
                  <article className="bg-white text-slate-900 border border-slate-200 rounded-sm shadow-sm">
                    <div className="px-8 py-9 lg:px-12 lg:py-10 space-y-6">
                      <header className="space-y-2 border-b border-slate-200 pb-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          {docLevel} · {LEVEL_LABELS[docLevel]}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight leading-snug text-slate-900">
                          {workspace.draftTitle}
                        </h1>
                        <p className="text-xs text-slate-500">
                          Last updated {new Date(workspace.lastUpdatedAt).toLocaleString()}
                        </p>
                      </header>

                      {sectionTemplates.map((template) => (
                        <section key={template.id} className="space-y-2">
                          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
                            {template.title}
                          </h2>
                          {(structuredSections[template.id] ?? "").trim().length > 0 ? (
                            <p className="text-sm leading-7 whitespace-pre-wrap text-slate-800">
                              {structuredSections[template.id]}
                            </p>
                          ) : (
                            <p className="text-sm italic text-slate-400">No content added yet.</p>
                          )}
                        </section>
                      ))}
                    </div>
                  </article>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-subtle bg-surface p-3 text-xs text-text-muted">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkle size={14} className="text-brand-primary" />
                    Draft autosave
                  </span>
                  <span>{workspace.dirty ? "Unsaved revision changes" : "Draft and committed revision are in sync"}</span>
                </div>
              </div>
            </div>

            {showRevisionDrawer && (
              <aside className="w-72 border-l border-subtle bg-surface p-3 overflow-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest font-bold text-text-muted">Revision timeline</p>
                  <button
                    onClick={() => setShowRevisionDrawer(false)}
                    className="text-[10px] text-text-muted uppercase font-bold"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {workspace.revisions.length === 0 && (
                    <p className="text-xs text-text-muted">No committed revisions yet.</p>
                  )}
                  {workspace.revisions.map((revision) => (
                    <div key={revision.id} className="rounded-lg border border-subtle bg-canvas p-2.5 space-y-2">
                      <p className="text-xs font-semibold truncate">{revision.title}</p>
                      <p className="text-[10px] text-text-muted">{new Date(revision.committedAt).toLocaleString()}</p>
                      <button
                        onClick={() => restoreRevision(project.id, docId, revision.id)}
                        className="w-full px-2 py-1 rounded border border-subtle text-[10px] font-bold"
                      >
                        Restore to Draft
                      </button>
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </>
        ) : (
          <WorkspaceDocWorkflowPane project={project} docId={docId} capabilities={capabilities} />
        )}
      </div>

      {isDocumentMode && (
        <footer className="border-t border-subtle bg-surface p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-text-muted flex items-center gap-2">
            <FloppyDiskBack size={14} />
            {workspace.dirty ? "Draft changed" : "No draft changes"}
            {pendingProposalCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-status-premium/10 text-status-premium">
                {pendingProposalCount} pending proposals
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!workspace.dirty || !capabilities.canEditDocs}
              onClick={() => discardDraft(project.id, docId)}
              className="px-2.5 py-1.5 rounded-lg border border-subtle text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Discard Draft
            </button>
            <button
              disabled={!canFinalize}
              onClick={() => finalizeDoc(project.id, docId)}
              className="px-3 py-1.5 rounded-lg bg-status-success text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <SealCheck size={14} weight="fill" />
              Finalize Doc
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
