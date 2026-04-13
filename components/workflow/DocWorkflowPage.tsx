"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ClockCounterClockwise,
  Link as LinkIcon,
  Lock,
  SealCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { Sidebar } from "@/components/Sidebar";
import {
  getCapabilitiesForRole,
  getRequiredArtifactRegistry,
  useStore,
  WorkflowArtifact,
} from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";
import { buildDocWorkflowFlowchart, resolveWorkflowVisualStatus } from "@/lib/workflowVisuals";
import { DocFlowchartView } from "@/components/workflow/DocFlowchartView";
import { cn } from "@/lib/utils";

interface DocWorkflowPageProps {
  projectId: string;
  docId: string;
}

const levelRank: Record<WorkflowArtifact["level"], number> = {
  L4: 0,
  L3: 1,
  L2: 2,
  L1: 3,
};

const STATUS_PILL_CLASSNAME: Record<
  ReturnType<typeof resolveWorkflowVisualStatus>["key"],
  string
> = {
  synced: "bg-status-success/10 text-status-success",
  blocked: "bg-status-error/10 text-status-error",
  stale: "bg-status-premium/10 text-status-premium",
  "needs-clickup": "bg-status-premium/10 text-status-premium",
  "needs-review": "bg-status-premium/10 text-status-premium",
  "not-generated": "bg-brand-primary/10 text-brand-primary",
};

export function DocWorkflowPage({ projectId, docId }: DocWorkflowPageProps) {
  useSeedData();
  const router = useRouter();
  const {
    projects,
    settings,
    generateWorkflow,
    regenerateWorkflowFromChildren,
    submitWorkflowProof,
    verifyWorkflowSync,
    setWorkflowClickupResource,
    runWorkflowLinkHealthSweep,
  } = useStore();
  const project = projects.find((candidate) => candidate.id === projectId);
  const capabilities = getCapabilitiesForRole(settings.currentUserRole, settings);

  const allDocs = useMemo(
    () =>
      project
        ? [project.levels.L1, project.levels.L2, ...project.levels.L3, ...project.levels.L4]
        : [],
    [project]
  );
  const doc = allDocs.find((candidate) => candidate.id === docId) ?? null;

  const workflows = useMemo(() => {
    if (!project) return [];
    return Object.values(project.workflowArtifacts ?? {}).sort((a, b) => {
      const byLevel = levelRank[a.level] - levelRank[b.level];
      if (byLevel !== 0) return byLevel;
      return a.title.localeCompare(b.title);
    });
  }, [project]);

  const workflowByDocId = useMemo(
    () => new Map(workflows.map((workflow) => [workflow.docId, workflow])),
    [workflows]
  );

  const focusedWorkflow = workflowByDocId.get(docId);
  const focusedStatus = resolveWorkflowVisualStatus(focusedWorkflow);
  const selectedProofDraft = {
    reviewedChanges: focusedWorkflow?.proof?.reviewedChanges ?? false,
    clickupUpdated: focusedWorkflow?.proof?.clickupUpdated ?? false,
    embedVerified: focusedWorkflow?.proof?.embedVerified ?? false,
  };

  useEffect(() => {
    if (!project || !doc) return;
    const intervalMs = Math.max(settings.workspacePolicy.linkHealthSweepMinutes, 1) * 60 * 1000;
    const timer = window.setInterval(() => {
      runWorkflowLinkHealthSweep(project.id);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [doc, project, runWorkflowLinkHealthSweep, settings.workspacePolicy.linkHealthSweepMinutes]);

  const requiredWorkflowEntries = project
    ? getRequiredArtifactRegistry(project).filter((artifact) => artifact.artifactType === "workflow")
    : [];
  const unsyncedRequired = requiredWorkflowEntries.filter((artifact) => {
    if (!project) return true;
    const workflowId = artifact.workflowId;
    if (!workflowId) return true;
    const workflow = project.workflowArtifacts?.[workflowId];
    return !workflow || workflow.lifecycleState !== "Synced";
  }).length;
  const staleCount = workflows.filter((workflow) => workflow.stale).length;
  const docFlowchart = useMemo(
    () => (project && doc ? buildDocWorkflowFlowchart(project, doc.id, workflowByDocId) : { width: 0, height: 0, nodes: [], edges: [] }),
    [project, doc, workflowByDocId]
  );
  const workflowById = useMemo(
    () => Object.fromEntries(workflows.map((w) => [w.id, w])),
    [workflows]
  );

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-text-muted">Project not found.</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="text-sm text-text-muted">Requested document not found.</p>
          <Link
            href={`/projects/${projectId}`}
            className="text-xs text-brand-primary font-semibold hover:underline"
          >
            Return to project
          </Link>
        </div>
      </div>
    );
  }

  const updateProof = (
    key: keyof Pick<typeof selectedProofDraft, "reviewedChanges" | "clickupUpdated" | "embedVerified">,
    value: boolean
  ) => {
    if (!focusedWorkflow) return;
    submitWorkflowProof(project.id, focusedWorkflow.id, {
      ...selectedProofDraft,
      [key]: value,
    });
  };

  const handleProvisionLink = () => {
    if (!focusedWorkflow) return;
    const clickupResourceId = `wf-${focusedWorkflow.id.replace(/[:]/g, "-")}`;
    setWorkflowClickupResource(project.id, focusedWorkflow.id, {
      clickupResourceType: "doc",
      clickupResourceId,
      clickupUrl: `https://app.clickup.com/t/${clickupResourceId}`,
    });
  };

  return (
    <div className="flex h-full min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 pl-[var(--sidebar-width,16rem)] min-h-screen overflow-auto custom-scrollbar transition-[padding] duration-200">
        <header className="h-16 border-b border-subtle glass px-4 lg:px-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="text-xs text-text-muted flex items-center gap-1 min-w-0">
              <Link href="/projects" className="hover:text-text-primary hover:underline underline-offset-2">
                Projects
              </Link>
              <span>/</span>
              <Link
                href={`/projects/${projectId}`}
                className="hover:text-text-primary hover:underline underline-offset-2"
              >
                {project.name}
              </Link>
              <span>/</span>
              <Link
                href={`/projects/${projectId}/docs/${doc.id}`}
                className="hover:text-text-primary hover:underline underline-offset-2 truncate"
              >
                {doc.title}
              </Link>
              <span>/</span>
              <span className="text-text-primary">Workflow</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/workflows`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Project Workflows
            </Link>
            <Link
              href={`/projects/${projectId}/docs/${doc.id}`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Open Doc
            </Link>
            <Link
              href={`/projects/${projectId}/analysis`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Analysis
            </Link>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-4">
          <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">
                  Focused workflow execution
                </p>
                <h2 className="text-base font-bold text-text-primary">{doc.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runWorkflowLinkHealthSweep(project.id)}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold flex items-center gap-1.5"
                >
                  <LinkIcon size={13} />
                  Check Links
                </button>
                <button
                  onClick={() => router.push(`/projects/${projectId}/workflows`)}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
                >
                  Open project map
                </button>
              </div>
            </div>
            <div className="text-xs text-text-muted flex flex-wrap items-center gap-3">
              <span>{requiredWorkflowEntries.length} required workflow artifacts</span>
              <span>{unsyncedRequired} unsynced required workflows</span>
              <span>{staleCount} stale workflows</span>
            </div>
            <div className="rounded-lg border border-subtle bg-canvas p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-text-primary">
                  Status: {focusedWorkflow?.lifecycleState ?? "Not generated"}
                </span>
                <span className={cn("px-2 py-0.5 rounded-full font-semibold", STATUS_PILL_CLASSNAME[focusedStatus.key])}>
                  {focusedStatus.badgeLabel}
                </span>
              </div>
              <div className="text-[11px] text-text-muted flex flex-wrap items-center gap-2">
                <span>Link: {focusedWorkflow?.linkHealthStatus ?? "Unknown"}</span>
                {focusedWorkflow?.blockedReason && (
                  <span className="text-status-error">• {focusedWorkflow.blockedReason}</span>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
            <h3 className="text-sm font-bold">Doc workflow flowchart</h3>
            <DocFlowchartView
              flowchart={docFlowchart}
              workflowById={workflowById}
              showLegend
              ariaLabel={`${doc.title} workflow flowchart`}
            />
          </section>

          {focusedWorkflow ? (
            <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
              <h3 className="text-sm font-bold">Proof and sync actions</h3>
              <div className="grid lg:grid-cols-3 gap-2">
                {[
                  {
                    key: "reviewedChanges",
                    label: "Reviewed generated changes",
                  },
                  {
                    key: "clickupUpdated",
                    label: "Updated/created in ClickUp",
                  },
                  {
                    key: "embedVerified",
                    label: "Embed/reference verified",
                  },
                ].map((item) => {
                  const checked = selectedProofDraft[item.key as keyof typeof selectedProofDraft];
                  return (
                    <label
                      key={item.key}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                        checked
                          ? "border-status-success/50 bg-status-success/10"
                          : "border-subtle bg-canvas"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          updateProof(item.key as keyof typeof selectedProofDraft, event.target.checked)
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => generateWorkflow(project.id, focusedWorkflow.id)}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
                >
                  Generate
                </button>
                <button
                  onClick={() => regenerateWorkflowFromChildren(project.id, focusedWorkflow.id)}
                  disabled={!capabilities.canRegenerateWorkflows}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ClockCounterClockwise size={13} />
                  Regenerate
                </button>
                <button
                  onClick={handleProvisionLink}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
                >
                  Provision ClickUp Link
                </button>
                <button
                  disabled={!capabilities.canSubmitWorkflowProof}
                  onClick={() =>
                    submitWorkflowProof(project.id, focusedWorkflow.id, {
                      ...selectedProofDraft,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {capabilities.canSubmitWorkflowProof ? "Submit proof" : "Submit proof (restricted)"}
                </button>
                <button
                  disabled={!capabilities.canVerifyWorkflowSync}
                  onClick={() =>
                    verifyWorkflowSync(project.id, focusedWorkflow.id, {
                      approved: true,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-status-success text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {capabilities.canVerifyWorkflowSync ? <SealCheck size={13} /> : <Lock size={13} />}
                  Verify & Sync
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-subtle bg-surface p-4 text-sm text-text-muted">
              No workflow artifact is currently registered for this document.
            </section>
          )}

          <section className="rounded-xl border border-subtle bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-subtle">
              <h3 className="text-sm font-bold">Workflow update queue</h3>
            </div>
            <div className="divide-y divide-subtle">
              {workflows.map((workflow) => {
                const visualStatus = resolveWorkflowVisualStatus(workflow);
                return (
                  <div key={workflow.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{workflow.title}</p>
                      <div className="text-[11px] text-text-muted flex items-center flex-wrap gap-2">
                        <span>{workflow.level}</span>
                        <span>•</span>
                        <span>{workflow.lifecycleState}</span>
                        <span>•</span>
                        <span>Link: {workflow.linkHealthStatus}</span>
                        <span className={cn("px-1.5 py-0.5 rounded", STATUS_PILL_CLASSNAME[visualStatus.key])}>
                          {visualStatus.badgeLabel}
                        </span>
                        {workflow.docId === docId && (
                          <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {visualStatus.queueLabel === "Synced" ? (
                        <span className="text-xs font-semibold text-status-success flex items-center gap-1">
                          <CheckCircle size={13} />
                          Synced
                        </span>
                      ) : (
                        <span className="text-xs text-status-premium flex items-center gap-1">
                          <WarningCircle size={13} />
                          Pending
                        </span>
                      )}
                      <button
                        onClick={() => router.push(`/projects/${projectId}/docs/${workflow.docId}/workflow`)}
                        className="px-2.5 py-1 rounded border border-subtle text-xs font-bold"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
