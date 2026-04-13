"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Lock,
  Prohibit,
  SealCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { Sidebar } from "@/components/Sidebar";
import {
  evaluateGovernanceGate,
  getActiveAnalysisRun,
  getCapabilitiesForRole,
  getRequiredArtifactRegistry,
  useStore,
} from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";
import { cn } from "@/lib/utils";

interface ProjectAnalysisPageProps {
  projectId: string;
}

export function ProjectAnalysisPage({ projectId }: ProjectAnalysisPageProps) {
  useSeedData();
  const {
    projects,
    settings,
    initializeAnalysisRun,
    updateAnalysisStepOneSection,
    setAnalysisUnresolvedPrompts,
    completeAnalysisStepOne,
    recordStakeholderDecision,
    submitAnalysisRevision,
    extendAnalysisValidationWindow,
    refreshAnalysisMetrics,
    finalizeAnalysisRun,
    cancelAnalysisRun,
    reinitializeAnalysisRun,
  } = useStore();
  const project = projects.find((candidate) => candidate.id === projectId);
  const capabilities = getCapabilitiesForRole(settings.currentUserRole, settings);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-text-muted">Project not found.</p>
      </div>
    );
  }

  const requiredArtifacts = getRequiredArtifactRegistry(project);
  const initGate = evaluateGovernanceGate(project, "initialize-analysis");
  const activeRun = getActiveAnalysisRun(project);
  const analysisRuns = project.analysisState?.runs ?? [];
  const latestCanceledRun = [...analysisRuns]
    .reverse()
    .find((run) => run.lifecycleState === "Canceled");

  const requiredRows = requiredArtifacts.map((artifact) => {
    if (artifact.artifactType === "doc" && artifact.docId) {
      const workspace = project.docWorkspace?.[artifact.docId];
      const doc = [
        project.levels.L1,
        project.levels.L2,
        ...project.levels.L3,
        ...project.levels.L4,
      ].find((candidate) => candidate.id === artifact.docId);
      const ready = !!workspace?.finalized && !!doc?.scribeChecked;
      return {
        id: artifact.id,
        label: artifact.title,
        ready,
        deepLink: `/projects/${project.id}/docs/${artifact.docId}`,
        reason: ready ? "Finalized and checklist complete" : "Finalize doc and verify Scribe checklist",
      };
    }

    if (artifact.artifactType === "workflow" && artifact.workflowId && artifact.docId) {
      const workflow = project.workflowArtifacts?.[artifact.workflowId];
      const ready =
        !!workflow &&
        workflow.lifecycleState === "Synced" &&
        workflow.linkHealthStatus === "Valid";
      return {
        id: artifact.id,
        label: artifact.title,
        ready,
        deepLink: `/projects/${project.id}/docs/${artifact.docId}/workflow`,
        reason: ready
          ? "Synced with valid link"
          : `Sync state ${workflow?.lifecycleState ?? "Unknown"} / Link ${workflow?.linkHealthStatus ?? "Unknown"}`,
      };
    }

    return {
      id: artifact.id,
      label: artifact.title,
      ready: false,
      deepLink: `/projects/${project.id}`,
      reason: "Artifact unavailable",
    };
  });

  const activeRunWindowLabel = !activeRun?.stepTwo.deadlineAt
    ? "No validation deadline set"
    : `Validation deadline: ${new Date(activeRun.stepTwo.deadlineAt).toLocaleString()}`;

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
                href={`/projects/${project.id}`}
                className="hover:text-text-primary hover:underline underline-offset-2"
              >
                {project.name}
              </Link>
              <span>/</span>
              <span className="text-text-primary">Analysis</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/analysis"
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Analysis Hub
            </Link>
            <Link
              href={`/projects/${project.id}`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Project Home
            </Link>
            <Link
              href={`/projects/${project.id}/docs/${project.levels.L2.id}`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Documents
            </Link>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-4">
          <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">
                  Analysis readiness dashboard
                </p>
                <h2 className="text-base font-bold">
                  {initGate.ready ? "Ready to initialize analysis" : "Initialization blocked"}
                </h2>
              </div>
              <button
                disabled={!capabilities.canInitializeAnalysis || !initGate.ready || !!activeRun}
                onClick={() => initializeAnalysisRun(project.id)}
                className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Initialize analysis
              </button>
            </div>

            {initGate.blockers.length > 0 && (
              <div className="rounded-lg border border-status-error/30 bg-status-error/10 p-3">
                <p className="text-xs font-semibold text-status-error mb-2">Blocking conditions</p>
                <ul className="space-y-1 text-xs text-status-error">
                  {initGate.blockers.map((blocker) => (
                    <li key={blocker.id} className="flex items-start gap-1.5">
                      <WarningCircle size={12} className="mt-0.5 shrink-0" />
                      <span>{blocker.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-2">
              {requiredRows.map((row) => (
                <Link
                  key={row.id}
                  href={row.deepLink}
                  className={cn(
                    "rounded-lg border p-2.5 text-xs flex items-start justify-between gap-2",
                    row.ready
                      ? "border-status-success/40 bg-status-success/10"
                      : "border-subtle bg-canvas"
                  )}
                >
                  <div>
                    <p className="font-semibold text-text-primary">{row.label}</p>
                    <p className="text-text-muted mt-0.5">{row.reason}</p>
                  </div>
                  {row.ready ? (
                    <CheckCircle size={14} className="text-status-success shrink-0" />
                  ) : (
                    <WarningCircle size={14} className="text-status-premium shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </section>

          {activeRun && (
            <section className="rounded-xl border border-subtle bg-surface p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">
                    Active run
                  </p>
                  <h3 className="text-base font-bold">
                    Run #{activeRun.runNumber} · {activeRun.lifecycleState}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!capabilities.canRefreshAnalysisMetrics}
                    onClick={() => refreshAnalysisMetrics(project.id)}
                    className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Refresh metrics
                  </button>
                  <button
                    disabled={!capabilities.canCancelAnalysis}
                    onClick={() => {
                      const reason = window.prompt("Cancel reason (required)");
                      if (!reason) return;
                      cancelAnalysisRun(project.id, reason);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-status-error/40 text-status-error text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Prohibit size={13} />
                    Cancel run
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-subtle bg-canvas p-3 text-xs grid sm:grid-cols-3 gap-2">
                <div>
                  <p className="text-text-muted">Metrics captured</p>
                  <p className="font-semibold">{new Date(activeRun.metricsSnapshot.capturedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-muted">Completion snapshot</p>
                  <p className="font-semibold">{activeRun.metricsSnapshot.metrics.completionPercent}%</p>
                </div>
                <div>
                  <p className="text-text-muted">Synced workflows</p>
                  <p className="font-semibold">{activeRun.metricsSnapshot.metrics.syncedWorkflows}</p>
                </div>
              </div>

              {(activeRun.lifecycleState === "Initialized (Step 1 Active)" ||
                activeRun.lifecycleState === "Revision Required") && (
                <div className="space-y-3 rounded-lg border border-subtle bg-canvas p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">Step 1 · Process-owner interview</p>
                    <button
                      onClick={() => completeAnalysisStepOne(project.id)}
                      className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold"
                    >
                      Complete Step 1
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {activeRun.stepOne.mandatorySectionIds.map((sectionId) => (
                      <div key={sectionId} className="space-y-1">
                        <label className="text-[11px] uppercase tracking-widest text-text-muted font-bold">
                          {sectionId}
                        </label>
                        <textarea
                          value={activeRun.stepOne.sections[sectionId] ?? ""}
                          onChange={(event) =>
                            updateAnalysisStepOneSection(project.id, sectionId, event.target.value)
                          }
                          rows={3}
                          className="w-full rounded-lg border border-subtle bg-surface px-2.5 py-2 text-xs"
                        />
                      </div>
                    ))}
                    <label className="text-xs text-text-muted flex items-center gap-2">
                      Unresolved required prompts
                      <input
                        type="number"
                        min={0}
                        value={activeRun.stepOne.unresolvedRequiredPrompts}
                        onChange={(event) =>
                          setAnalysisUnresolvedPrompts(project.id, Number(event.target.value) || 0)
                        }
                        className="w-16 rounded border border-subtle bg-surface px-2 py-1 text-xs"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeRun.lifecycleState === "Stakeholder Validation (Step 2 Active)" && (
                <div className="space-y-3 rounded-lg border border-subtle bg-canvas p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold">Step 2 · Stakeholder validation</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted flex items-center gap-1.5">
                        <Clock size={13} />
                        {activeRunWindowLabel}
                      </span>
                      <button
                        onClick={() => extendAnalysisValidationWindow(project.id, 2)}
                        className="px-2.5 py-1 rounded border border-subtle text-xs font-bold"
                      >
                        Extend +2d
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {activeRun.stepTwo.groups.map((group) => (
                      <div key={group.id} className="rounded-lg border border-subtle bg-surface p-2.5 space-y-2">
                        <p className="text-xs font-semibold">
                          {group.label} · min approvals {group.minimumApprovals}
                          {group.required ? " (required)" : ""}
                        </p>
                        {group.stakeholders.map((stakeholder) => (
                          <div key={stakeholder.id} className="rounded border border-subtle bg-canvas p-2 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-xs">
                                <p className="font-semibold">{stakeholder.displayName}</p>
                                <p className="text-text-muted">Decision: {stakeholder.decision}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {(["Approve", "Reject", "Needs Info"] as const).map((decision) => (
                                  <button
                                    key={decision}
                                    onClick={() =>
                                      recordStakeholderDecision(project.id, {
                                        groupId: group.id,
                                        stakeholderId: stakeholder.id,
                                        decision,
                                        comment: decisionNotes[stakeholder.id],
                                      })
                                    }
                                    className={cn(
                                      "px-2 py-1 rounded text-[11px] font-bold border",
                                      decision === "Approve"
                                        ? "border-status-success/40 text-status-success"
                                        : decision === "Reject"
                                          ? "border-status-error/40 text-status-error"
                                          : "border-status-premium/40 text-status-premium"
                                    )}
                                  >
                                    {decision}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <textarea
                              value={decisionNotes[stakeholder.id] ?? stakeholder.comment ?? ""}
                              onChange={(event) =>
                                setDecisionNotes((current) => ({
                                  ...current,
                                  [stakeholder.id]: event.target.value,
                                }))
                              }
                              rows={2}
                              className="w-full rounded border border-subtle bg-surface px-2 py-1 text-xs"
                              placeholder="Comment (required for Reject/Needs Info)"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeRun.lifecycleState === "Revision Required" && (
                <div className="rounded-lg border border-status-premium/40 bg-status-premium/10 p-3 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <p className="font-semibold text-status-premium">Revision Required</p>
                    <p className="text-status-premium/80">
                      Stakeholder feedback requested updates. Submit revisions to resume Step 2.
                    </p>
                  </div>
                  <button
                    onClick={() => submitAnalysisRevision(project.id)}
                    className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold"
                  >
                    Submit revision
                  </button>
                </div>
              )}

              {activeRun.lifecycleState === "Admin Signoff (Step 3 Active)" && (
                <div className="rounded-lg border border-status-success/30 bg-status-success/10 p-3 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <p className="font-semibold text-status-success">Step 3 · Admin signoff</p>
                    <p className="text-status-success/80">
                      Final signoff transitions the project to Ready to Close and locks analysis edits.
                    </p>
                  </div>
                  <button
                    disabled={!capabilities.canSignoffAnalysis}
                    onClick={() => finalizeAnalysisRun(project.id)}
                    className="px-3 py-1.5 rounded-lg bg-status-success text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {capabilities.canSignoffAnalysis ? <SealCheck size={13} /> : <Lock size={13} />}
                    Finalize analysis
                  </button>
                </div>
              )}
            </section>
          )}

          {!activeRun && latestCanceledRun && (
            <section className="rounded-xl border border-subtle bg-surface p-4 space-y-2">
              <p className="text-xs font-semibold">
                Latest run was canceled{latestCanceledRun.canceledReason ? `: ${latestCanceledRun.canceledReason}` : "."}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={!capabilities.canInitializeAnalysis}
                  onClick={() => reinitializeAnalysisRun(project.id, "Resume Draft")}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Resume Draft
                </button>
                <button
                  disabled={!capabilities.canInitializeAnalysis}
                  onClick={() => reinitializeAnalysisRun(project.id, "Start Fresh")}
                  className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start Fresh
                </button>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-subtle bg-surface p-4">
            <p className="text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Run history</p>
            <div className="space-y-2">
              {[...analysisRuns]
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((run) => (
                  <div
                    key={run.id}
                    className="rounded-lg border border-subtle bg-canvas px-3 py-2 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold">Run #{run.runNumber}</p>
                      <p className="text-text-muted">{new Date(run.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {run.lifecycleState === "Finalized" ? (
                        <CheckCircle size={13} className="text-status-success" />
                      ) : (
                        <WarningCircle size={13} className="text-status-premium" />
                      )}
                      <span>{run.lifecycleState}</span>
                    </div>
                  </div>
                ))}
              {analysisRuns.length === 0 && (
                <p className="text-xs text-text-muted">No analysis runs created yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
