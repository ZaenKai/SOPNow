"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowsClockwise,
  CheckCircle,
  ClockCounterClockwise,
  Link as LinkIcon,
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
import {
  FlowNode,
  FlowShape,
  NODE_HEIGHT,
  NODE_WIDTH,
  SHAPE_STYLES,
  buildCombinedWorkflowFlowchart,
  buildFlowRows,
  buildWorkflowCoverageSummary,
  resolveWorkflowVisualStatus,
  splitLabelIntoLines,
} from "@/lib/workflowVisuals";
import { cn } from "@/lib/utils";

interface ProjectWorkflowsPageProps {
  projectId: string;
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

export function ProjectWorkflowsPage({ projectId }: ProjectWorkflowsPageProps) {
  useSeedData();
  const router = useRouter();
  const {
    projects,
    settings,
    projectUIPreferences,
    generateWorkflow,
    regenerateWorkflowFromChildren,
    regenerateAllStaleWorkflows,
    submitWorkflowProof,
    verifyWorkflowSync,
    setWorkflowClickupResource,
    runWorkflowLinkHealthSweep,
  } = useStore();
  const project = projects.find((candidate) => candidate.id === projectId);
  const capabilities = getCapabilitiesForRole(settings.currentUserRole, settings);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const allDocs = useMemo(
    () =>
      project
        ? [project.levels.L1, project.levels.L2, ...project.levels.L3, ...project.levels.L4]
        : [],
    [project]
  );

  const workflows = useMemo(() => {
    if (!project) return [];
    return Object.values(project.workflowArtifacts ?? {}).sort((a, b) => {
      const byLevel = levelRank[a.level] - levelRank[b.level];
      if (byLevel !== 0) return byLevel;
      return a.title.localeCompare(b.title);
    });
  }, [project]);

  const selectedWorkflow =
    workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? workflows[0] ?? null;
  const selectedDoc = selectedWorkflow
    ? allDocs.find((candidate) => candidate.id === selectedWorkflow.docId) ?? null
    : null;

  const selectedProofDraft = {
    reviewedChanges: selectedWorkflow?.proof?.reviewedChanges ?? false,
    clickupUpdated: selectedWorkflow?.proof?.clickupUpdated ?? false,
    embedVerified: selectedWorkflow?.proof?.embedVerified ?? false,
  };

  useEffect(() => {
    if (!project) return;
    const intervalMs = Math.max(settings.workspacePolicy.linkHealthSweepMinutes, 1) * 60 * 1000;
    const timer = window.setInterval(() => {
      runWorkflowLinkHealthSweep(project.id);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [project, runWorkflowLinkHealthSweep, settings.workspacePolicy.linkHealthSweepMinutes]);

  const workflowByDocId = useMemo(
    () => new Map(workflows.map((workflow) => [workflow.docId, workflow])),
    [workflows]
  );

  const workflowById = useMemo(
    () => Object.fromEntries(workflows.map((workflow) => [workflow.id, workflow])),
    [workflows]
  );

  const flowRows = useMemo(() => (project ? buildFlowRows(project) : []), [project]);

  const flowchart = useMemo(() => {
    if (!project) {
      return {
        width: 0,
        height: 0,
        nodes: [] as FlowNode[],
        edges: [] as { id: string; path: string }[],
      };
    }
    return buildCombinedWorkflowFlowchart(project, workflowByDocId);
  }, [project, workflowByDocId]);

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
  const coverageSummary = project ? buildWorkflowCoverageSummary(project, workflowByDocId) : null;

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-text-muted">Project not found.</p>
      </div>
    );
  }

  const preferredDocId = projectUIPreferences[projectId]?.lastOpenedDocId;
  const workspaceDocId =
    (preferredDocId && allDocs.some((doc) => doc.id === preferredDocId) ? preferredDocId : null) ??
    project.levels.L2.id;

  const handleProvisionLink = () => {
    if (!selectedWorkflow) return;
    const clickupResourceId = `wf-${selectedWorkflow.id.replace(/[:]/g, "-")}`;
    setWorkflowClickupResource(project.id, selectedWorkflow.id, {
      clickupResourceType: "doc",
      clickupResourceId,
      clickupUrl: `https://app.clickup.com/t/${clickupResourceId}`,
    });
  };

  const renderShape = (node: FlowNode, isActive: boolean) => {
    const shapeStyle = SHAPE_STYLES[node.shape];
    const workflow = node.workflowId ? workflowById[node.workflowId] : undefined;
    const visualStatus = resolveWorkflowVisualStatus(workflow);
    const strokeWidth = isActive ? 3 : 2;
    const commonProps = {
      fill: shapeStyle.fill,
      stroke: visualStatus.stroke,
      strokeWidth,
      strokeDasharray: visualStatus.dash,
    };

    if (node.shape === "startEnd") {
      return <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEIGHT} rx={30} {...commonProps} />;
    }
    if (node.shape === "process") {
      return <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEIGHT} rx={12} {...commonProps} />;
    }
    if (node.shape === "system") {
      return <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEIGHT} rx={20} {...commonProps} />;
    }
    if (node.shape === "review") {
      return (
        <path
          d={`M 18 0 L ${NODE_WIDTH} 0 L ${NODE_WIDTH - 18} ${NODE_HEIGHT} L 0 ${NODE_HEIGHT} Z`}
          {...commonProps}
        />
      );
    }
    if (node.shape === "decision") {
      return (
        <path
          d={`M ${NODE_WIDTH / 2} 0 L ${NODE_WIDTH} ${NODE_HEIGHT / 2} L ${NODE_WIDTH / 2} ${NODE_HEIGHT} L 0 ${
            NODE_HEIGHT / 2
          } Z`}
          {...commonProps}
        />
      );
    }
    if (node.shape === "handoff") {
      return (
        <path
          d={`M 20 0 L ${NODE_WIDTH - 20} 0 L ${NODE_WIDTH} ${NODE_HEIGHT / 2} L ${
            NODE_WIDTH - 20
          } ${NODE_HEIGHT} L 20 ${NODE_HEIGHT} L 0 ${NODE_HEIGHT / 2} Z`}
          {...commonProps}
        />
      );
    }
    return (
      <g>
        <path d={`M 0 0 H ${NODE_WIDTH - 20} L ${NODE_WIDTH} 20 V ${NODE_HEIGHT} H 0 Z`} {...commonProps} />
        <path
          d={`M ${NODE_WIDTH - 20} 0 V 20 H ${NODE_WIDTH}`}
          fill="none"
          stroke={visualStatus.stroke}
          strokeWidth={strokeWidth}
        />
      </g>
    );
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
                className="hover:text-text-primary hover:underline underline-offset-2 truncate"
              >
                {project.name}
              </Link>
              <span>/</span>
              <span className="text-text-primary">Project Workflows</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${project.id}/docs/${workspaceDocId}`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Open Workspace
            </Link>
            {selectedWorkflow && (
              <button
                onClick={() => router.push(`/projects/${project.id}/docs/${selectedWorkflow.docId}/workflow`)}
                className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
              >
                Doc Workflow
              </button>
            )}
            <Link
              href={`/projects/${project.id}/analysis`}
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
                  Project workflow orchestration
                </p>
                <h2 className="text-base font-bold text-text-primary">
                  {project.pathComplexity === "complex"
                    ? "Complex path: L2 + L3 + L4 are required. L1 is optional context."
                    : "Simple path: L4 procedures are required. L1/L2 are optional context."}
                </h2>
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
                  disabled={!capabilities.canRegenerateWorkflows || staleCount === 0}
                  onClick={() => regenerateAllStaleWorkflows(project.id)}
                  className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ArrowsClockwise size={13} />
                  Regenerate all stale
                </button>
              </div>
            </div>
            <div className="text-xs text-text-muted flex flex-wrap items-center gap-3">
              <span>{requiredWorkflowEntries.length} required workflow artifacts</span>
              <span>{unsyncedRequired} unsynced required workflows</span>
              <span>{staleCount} stale workflows</span>
              <span>{flowRows.length} stage lanes</span>
              {coverageSummary && (
                <span>
                  Required synced: {coverageSummary.requiredSyncedCount}/{coverageSummary.requiredCount} · Optional
                  synced: {coverageSummary.optionalSyncedCount}/{coverageSummary.optionalCount}
                </span>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">Official flowchart legend</h3>
              <span className="text-[11px] text-text-muted">
                Derived from `docs/information/6. Flowcharting Standards-20260402091844.md`
              </span>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
              {(
                [
                  "startEnd",
                  "process",
                  "review",
                  "decision",
                  "system",
                  "document",
                  "handoff",
                ] as FlowShape[]
              ).map((shape) => (
                <div key={shape} className="rounded-lg border border-subtle bg-canvas px-2.5 py-2 flex items-center gap-2">
                  <svg width={44} height={22} viewBox="0 0 44 22" aria-hidden>
                    {shape === "startEnd" && (
                      <rect x={2} y={2} width={40} height={18} rx={9} fill={SHAPE_STYLES[shape].fill} stroke="#64748b" />
                    )}
                    {shape === "process" && (
                      <rect x={2} y={2} width={40} height={18} rx={3} fill={SHAPE_STYLES[shape].fill} stroke="#64748b" />
                    )}
                    {shape === "review" && (
                      <path d="M 7 2 L 42 2 L 37 20 L 2 20 Z" fill={SHAPE_STYLES[shape].fill} stroke="#64748b" />
                    )}
                    {shape === "decision" && (
                      <path d="M 22 2 L 42 11 L 22 20 L 2 11 Z" fill={SHAPE_STYLES[shape].fill} stroke="#64748b" />
                    )}
                    {shape === "system" && (
                      <rect x={2} y={2} width={40} height={18} rx={8} fill={SHAPE_STYLES[shape].fill} stroke="#64748b" />
                    )}
                    {shape === "document" && (
                      <path d="M 2 2 H 34 L 42 9 V 20 H 2 Z" fill={SHAPE_STYLES[shape].fill} stroke="#64748b" />
                    )}
                    {shape === "handoff" && (
                      <path d="M 8 2 H 36 L 42 11 L 36 20 H 8 L 2 11 Z" fill={SHAPE_STYLES[shape].fill} stroke="#64748b" />
                    )}
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{SHAPE_STYLES[shape].label}</p>
                    <p className="text-[11px] text-text-muted">{SHAPE_STYLES[shape].palette}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-subtle bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">Process flow map</h3>
              <span className="text-[11px] text-text-muted">
                Click a workflow node to manage generation, proof, and sync.
              </span>
            </div>

            <div className="rounded-lg border border-subtle bg-canvas overflow-auto">
              <svg width={flowchart.width} height={flowchart.height} role="img" aria-label={`${project.name} SOP flowchart`}>
                <defs>
                  <marker
                    id="flow-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#64748b" />
                  </marker>
                </defs>

                {flowchart.edges.map((edge) => (
                  <path
                    key={edge.id}
                    d={edge.path}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    markerEnd="url(#flow-arrow)"
                  />
                ))}

                {flowchart.nodes.map((node) => {
                  const workflow = node.workflowId ? workflowById[node.workflowId] : undefined;
                  const visualStatus = resolveWorkflowVisualStatus(workflow);
                  const isActive = workflow?.id === selectedWorkflow?.id;
                  const lines = splitLabelIntoLines(node.label, 18);
                  const subtitleLines = node.subtitle ? splitLabelIntoLines(node.subtitle, 18) : [];
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => {
                        if (!node.workflowId) return;
                        setSelectedWorkflowId(node.workflowId);
                      }}
                      className={cn(
                        node.workflowId ? "cursor-pointer" : "",
                        "transition-opacity hover:opacity-90"
                      )}
                    >
                      {renderShape(node, isActive)}
                      <text
                        x={NODE_WIDTH / 2}
                        y={node.subtitle ? 24 : 30}
                        textAnchor="middle"
                        className="fill-slate-900 font-semibold text-[11px]"
                      >
                        {lines.map((line, index) => (
                          <tspan key={`${node.id}-line-${index}`} x={NODE_WIDTH / 2} dy={index === 0 ? 0 : 13}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                      {node.subtitle && (
                        <text x={NODE_WIDTH / 2} y={46} textAnchor="middle" className="fill-slate-500 text-[10px]">
                          {subtitleLines[0] ?? node.subtitle}
                        </text>
                      )}
                      {workflow && visualStatus.badgeLabel.length > 0 && (
                        <g transform={`translate(${NODE_WIDTH - 78}, -12)`}>
                          <rect x={0} y={0} width={78} height={18} rx={9} fill={visualStatus.badgeFill} />
                          <text x={39} y={12} textAnchor="middle" className="fill-white text-[9px] font-bold">
                            {visualStatus.badgeLabel}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {selectedWorkflow && (
              <div className="rounded-lg border border-subtle bg-canvas p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">
                      Selected workflow node
                    </p>
                    <h4 className="text-sm font-bold">{selectedWorkflow.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDoc && (
                      <Link
                        href={`/projects/${project.id}/docs/${selectedDoc.id}`}
                        className="px-2.5 py-1 rounded border border-subtle text-xs font-bold"
                      >
                        Open Doc
                      </Link>
                    )}
                    {selectedWorkflow.docId && (
                      <button
                        onClick={() => router.push(`/projects/${project.id}/docs/${selectedWorkflow.docId}/workflow`)}
                        className="px-2.5 py-1 rounded border border-subtle text-xs font-bold"
                      >
                        Open Doc Workflow
                      </button>
                    )}
                  </div>
                </div>

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
                            : "border-subtle bg-surface"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            submitWorkflowProof(project.id, selectedWorkflow.id, {
                              ...selectedProofDraft,
                              [item.key]: event.target.checked,
                            })
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => generateWorkflow(project.id, selectedWorkflow.id)}
                    className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
                  >
                    Generate
                  </button>
                  <button
                    onClick={() => regenerateWorkflowFromChildren(project.id, selectedWorkflow.id)}
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
                      submitWorkflowProof(project.id, selectedWorkflow.id, {
                        ...selectedProofDraft,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit proof
                  </button>
                  <button
                    disabled={!capabilities.canVerifyWorkflowSync}
                    onClick={() =>
                      verifyWorkflowSync(project.id, selectedWorkflow.id, {
                        approved: true,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-status-success text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <SealCheck size={13} />
                    Verify & Sync
                  </button>
                </div>
              </div>
            )}
          </section>

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
                        onClick={() => setSelectedWorkflowId(workflow.id)}
                        className="px-2.5 py-1 rounded border border-subtle text-xs font-bold"
                      >
                        Select
                      </button>
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
