import type {
  AppSettings,
  DerivedProjectStatus,
  ProjectPrimaryPhase,
  ProjectStatusOverlay,
  ProjectStatusReasonCode,
  ProgressWeights,
  SOPProject,
  WorkflowArtifact,
} from "./useStore";
import {
  getActiveAnalysisRun,
  getRequiredArtifactRegistry,
} from "./useStore";

// ---------------------------------------------------------------------------
// Sub-selectors: atomic readiness booleans used by phase derivation
// ---------------------------------------------------------------------------

/** Is setup fully completed (interview understanding >= 100 or flag set)? */
const isSetupCompleted = (project: SOPProject): boolean =>
  !!(project.setupCompleted ?? (project.understanding >= 100));

/** Return counts for required doc readiness. */
const requiredDocReadiness = (project: SOPProject) => {
  const registry = getRequiredArtifactRegistry(project);
  const requiredDocs = registry.filter((a) => a.artifactType === "doc");
  let finalized = 0;
  let scribeComplete = 0;

  for (const entry of requiredDocs) {
    if (!entry.docId) continue;
    const workspace = project.docWorkspace?.[entry.docId];
    if (workspace?.finalized) finalized++;
    const doc = findDocInLevels(project, entry.docId);
    if (doc?.scribeChecked) scribeComplete++;
  }

  return {
    total: requiredDocs.length,
    finalized,
    scribeComplete,
    allFinalizedAndScribed: requiredDocs.length > 0 && finalized === requiredDocs.length && scribeComplete === requiredDocs.length,
  };
};

/** Return counts for required workflow readiness. */
const requiredWorkflowReadiness = (project: SOPProject) => {
  const registry = getRequiredArtifactRegistry(project);
  const requiredWorkflows = registry.filter((a) => a.artifactType === "workflow");
  let synced = 0;
  let validLink = 0;
  let blocked = 0;
  let stale = 0;

  for (const entry of requiredWorkflows) {
    if (!entry.workflowId) continue;
    const workflow = project.workflowArtifacts?.[entry.workflowId];
    if (!workflow) continue;
    if (workflow.lifecycleState === "Synced") synced++;
    if (workflow.linkHealthStatus === "Valid") validLink++;
    if (workflow.blocked) blocked++;
    if (workflow.stale) stale++;
  }

  return {
    total: requiredWorkflows.length,
    synced,
    validLink,
    blocked,
    stale,
    allSyncedAndValid:
      requiredWorkflows.length > 0 &&
      synced === requiredWorkflows.length &&
      validLink === requiredWorkflows.length,
  };
};

/** Lightweight doc lookup across all levels. */
function findDocInLevels(project: SOPProject, docId: string) {
  if (project.levels.L1.id === docId) return project.levels.L1;
  if (project.levels.L2.id === docId) return project.levels.L2;
  return (
    project.levels.L3.find((d) => d.id === docId) ??
    project.levels.L4.find((d) => d.id === docId)
  );
}

// ---------------------------------------------------------------------------
// Primary phase derivation — deterministic, non-overridable precedence
// ---------------------------------------------------------------------------

export function deriveProjectStatus(project: SOPProject): DerivedProjectStatus {
  const reasonCodes: ProjectStatusReasonCode[] = [];
  const overlays: ProjectStatusOverlay[] = [];

  // ── Complete (highest priority terminal state) ──────────────────────
  if (project.lifecycle === "finalized" && project.status === "done") {
    reasonCodes.push("project-finalized");
    return { primaryPhase: "Complete", overlays: [], reasonCodes, computedAt: Date.now() };
  }

  // ── Not Started ─────────────────────────────────────────────────────
  const setup = isSetupCompleted(project);
  const docs = requiredDocReadiness(project);
  if (!setup && docs.finalized === 0) {
    reasonCodes.push("setup-incomplete", "no-finalized-required-docs");
    return { primaryPhase: "Not Started", overlays, reasonCodes, computedAt: Date.now() };
  }

  // ── Gather analysis state ──────────────────────────────────────────
  const activeRun = getActiveAnalysisRun(project);
  const workflows = requiredWorkflowReadiness(project);

  // Compute overlays (stackable, independent of phase)
  if (workflows.blocked > 0) {
    overlays.push("Blocked");
    reasonCodes.push("blocked-workflows");
  }
  if (activeRun?.lifecycleState === "Admin Signoff (Step 3 Active)") {
    overlays.push("Awaiting Admin");
    reasonCodes.push("admin-signoff-pending");
  }
  if (activeRun?.lifecycleState === "Stakeholder Validation (Step 2 Active)") {
    overlays.push("Awaiting Stakeholders");
    reasonCodes.push("stakeholder-validation-pending");
  }
  const hasUnhealthyLinks = Object.values(project.workflowArtifacts ?? {}).some(
    (w: WorkflowArtifact) => w.linkHealthStatus !== "Valid" && w.clickupUrl
  );
  if (hasUnhealthyLinks) {
    overlays.push("Awaiting Integration");
    reasonCodes.push("integration-link-unhealthy");
  }
  if (workflows.stale > 0) {
    overlays.push("At Risk");
    reasonCodes.push("stale-workflows-at-risk");
  }

  // ── Analysis Validation (step 2 or step 3 active) ──────────────────
  if (
    activeRun?.lifecycleState === "Stakeholder Validation (Step 2 Active)" ||
    activeRun?.lifecycleState === "Admin Signoff (Step 3 Active)"
  ) {
    reasonCodes.push(
      activeRun.lifecycleState === "Stakeholder Validation (Step 2 Active)"
        ? "analysis-step2-active"
        : "analysis-step3-active"
    );
    return { primaryPhase: "Analysis Validation", overlays, reasonCodes, computedAt: Date.now() };
  }

  // ── Ready to Close ─────────────────────────────────────────────────
  if (project.lifecycle === "ready-to-close") {
    reasonCodes.push("analysis-finalized-lifecycle-ready");
    return { primaryPhase: "Ready to Close", overlays, reasonCodes, computedAt: Date.now() };
  }

  // ── Drafting Analysis (step 1 active or revision required) ─────────
  if (
    activeRun?.lifecycleState === "Initialized (Step 1 Active)" ||
    activeRun?.lifecycleState === "Revision Required"
  ) {
    reasonCodes.push(
      activeRun.lifecycleState === "Initialized (Step 1 Active)"
        ? "analysis-step1-active"
        : "analysis-revision-required"
    );
    return { primaryPhase: "Drafting Analysis", overlays, reasonCodes, computedAt: Date.now() };
  }

  // ── Waiting on Workflows ───────────────────────────────────────────
  if (docs.allFinalizedAndScribed && !workflows.allSyncedAndValid) {
    reasonCodes.push("required-workflows-not-synced");
    return { primaryPhase: "Waiting on Workflows", overlays, reasonCodes, computedAt: Date.now() };
  }

  // ── Document Drafting (default working state) ──────────────────────
  reasonCodes.push("required-docs-pending");
  return { primaryPhase: "Document Drafting", overlays, reasonCodes, computedAt: Date.now() };
}

// ---------------------------------------------------------------------------
// Progress formula engine
// ---------------------------------------------------------------------------

/** Compute docs component (0-100): finalized + scribe compliance of required docs. */
function computeDocsComponent(project: SOPProject): number {
  const registry = getRequiredArtifactRegistry(project);
  const requiredDocs = registry.filter((a) => a.artifactType === "doc");
  if (requiredDocs.length === 0) return 100;

  let score = 0;
  for (const entry of requiredDocs) {
    if (!entry.docId) continue;
    const workspace = project.docWorkspace?.[entry.docId];
    const doc = findDocInLevels(project, entry.docId);
    // Each doc contributes up to 1.0: 0.6 for finalized, 0.4 for scribe
    if (workspace?.finalized) score += 0.6;
    if (doc?.scribeChecked) score += 0.4;
  }
  return Math.round((score / requiredDocs.length) * 100);
}

/** Compute workflows component (0-100): synced + valid link health of required workflows. */
function computeWorkflowsComponent(project: SOPProject): number {
  const registry = getRequiredArtifactRegistry(project);
  const requiredWorkflows = registry.filter((a) => a.artifactType === "workflow");
  if (requiredWorkflows.length === 0) return 100;

  let score = 0;
  for (const entry of requiredWorkflows) {
    if (!entry.workflowId) continue;
    const workflow = project.workflowArtifacts?.[entry.workflowId];
    if (!workflow) continue;
    // Each workflow contributes up to 1.0: 0.7 for synced, 0.3 for valid link
    if (workflow.lifecycleState === "Synced") score += 0.7;
    if (workflow.linkHealthStatus === "Valid") score += 0.3;
  }
  return Math.round((score / requiredWorkflows.length) * 100);
}

/** Compute analysis component (0-100): based on run stage progression. */
function computeAnalysisComponent(project: SOPProject): number {
  const runs = project.analysisState?.runs ?? [];
  const hasFinalized = runs.some((r) => r.lifecycleState === "Finalized");
  if (hasFinalized) return 100;

  const activeRun = getActiveAnalysisRun(project);
  if (!activeRun) return 0;

  switch (activeRun.lifecycleState) {
    case "Not Initialized":
      return 0;
    case "Initialized (Step 1 Active)":
      return 20;
    case "Revision Required":
      return 25;
    case "Stakeholder Validation (Step 2 Active)":
      return 55;
    case "Admin Signoff (Step 3 Active)":
      return 80;
    case "Finalized":
      return 100;
    case "Canceled":
      return 10;
    default:
      return 0;
  }
}

/**
 * Derive deterministic progress for a project.
 * Uses configurable weights and caps at `preCompleteProgressCap` when
 * the primary phase is not `Complete`. Returns exactly 100 when Complete.
 */
export function deriveProjectProgress(
  project: SOPProject,
  settings: AppSettings
): number {
  const derived = deriveProjectStatus(project);

  // Hard 100 for Complete
  if (derived.primaryPhase === "Complete") return 100;

  const weights: ProgressWeights = settings.workspacePolicy.progressWeights;
  const cap = settings.workspacePolicy.preCompleteProgressCap;

  const docsScore = computeDocsComponent(project);
  const workflowScore = computeWorkflowsComponent(project);
  const analysisScore = computeAnalysisComponent(project);

  const weightTotal = weights.docs + weights.workflows + weights.analysis;
  const raw =
    weightTotal === 0
      ? 0
      : (docsScore * weights.docs +
          workflowScore * weights.workflows +
          analysisScore * weights.analysis) /
        weightTotal;

  return Math.min(cap, Math.round(raw));
}

// ---------------------------------------------------------------------------
// Phase display helpers
// ---------------------------------------------------------------------------

export const PHASE_COLOR_MAP: Record<ProjectPrimaryPhase, { bg: string; text: string }> = {
  "Not Started": { bg: "bg-text-muted/10", text: "text-text-muted" },
  "Document Drafting": { bg: "bg-brand-primary/10", text: "text-brand-primary" },
  "Waiting on Workflows": { bg: "bg-status-premium/10", text: "text-status-premium" },
  "Drafting Analysis": { bg: "bg-brand-secondary/10", text: "text-brand-secondary" },
  "Analysis Validation": { bg: "bg-status-premium/10", text: "text-status-premium" },
  "Ready to Close": { bg: "bg-status-success/10", text: "text-status-success" },
  "Complete": { bg: "bg-status-success/10", text: "text-status-success" },
};

export const OVERLAY_COLOR_MAP: Record<ProjectStatusOverlay, { bg: string; text: string }> = {
  "Blocked": { bg: "bg-status-error/10", text: "text-status-error" },
  "Awaiting Admin": { bg: "bg-status-premium/10", text: "text-status-premium" },
  "Awaiting Stakeholders": { bg: "bg-status-premium/10", text: "text-status-premium" },
  "Awaiting Integration": { bg: "bg-brand-secondary/10", text: "text-brand-secondary" },
  "At Risk": { bg: "bg-status-error/10", text: "text-status-error" },
};
