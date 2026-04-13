import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Role = "user" | "ai";
export type RoleTag = "planner" | "writer" | "reviewer";
export type UserRole = "admin" | "editor" | "viewer" | "portfolio-viewer" | "stakeholder";
export type SettingsTab = "general" | "workspace" | "security";
export type MobileWorkspacePane = "tree" | "doc" | "chat";
export type CenterPaneMode = "document" | "workflow";
export type WorkflowLevel = "L1" | "L2" | "L3" | "L4";
export type ProjectPathComplexity = "simple" | "complex";
export type WorkflowLifecycleState =
  | "Not Generated"
  | "Generated (Needs Review)"
  | "Needs ClickUp Update"
  | "Synced";
export type ClickupResourceType = "doc" | "task" | "wiki";
export type LinkHealthStatus = "Valid" | "Invalid" | "Auth Required";
export type SyncStatus = "unsynced" | "pending-proof" | "ready-for-verification" | "synced";
export type GovernanceGate = "initialize-analysis" | "finalize-analysis" | "finalize-project";
export type RequiredArtifactType = "doc" | "workflow";
export type AnalysisLifecycleState =
  | "Not Initialized"
  | "Initialized (Step 1 Active)"
  | "Stakeholder Validation (Step 2 Active)"
  | "Admin Signoff (Step 3 Active)"
  | "Finalized"
  | "Revision Required"
  | "Canceled";
export type StakeholderDecision = "Approve" | "Reject" | "Needs Info" | "Pending";
export type AnalysisReinitMode = "Resume Draft" | "Start Fresh";
export type AnalysisTrend = "improved" | "flat" | "degraded";
export type RecommendationLifecycleState =
  | "New"
  | "Under Review"
  | "Approved"
  | "In Progress"
  | "Realized"
  | "Rejected";
export type RecommendationActionLinkStatus = "queued" | "created" | "failed";
export type AnalysisHubRefreshSource = "nightly" | "manual";
export type AnalysisHubRefreshStatus = "idle" | "running" | "success" | "failed";
export type ToolRegistryStatus = "Active" | "Under Review" | "Planned" | "Deprecated";

export type ProjectPrimaryPhase =
  | "Not Started"
  | "Document Drafting"
  | "Waiting on Workflows"
  | "Drafting Analysis"
  | "Analysis Validation"
  | "Ready to Close"
  | "Complete";

export type ProjectStatusOverlay =
  | "Blocked"
  | "Awaiting Admin"
  | "Awaiting Stakeholders"
  | "Awaiting Integration"
  | "At Risk";

export type ProjectStatusReasonCode =
  | "setup-incomplete"
  | "no-finalized-required-docs"
  | "required-docs-pending"
  | "required-workflows-not-synced"
  | "analysis-step1-active"
  | "analysis-revision-required"
  | "analysis-step2-active"
  | "analysis-step3-active"
  | "analysis-finalized-lifecycle-ready"
  | "project-finalized"
  | "blocked-workflows"
  | "admin-signoff-pending"
  | "stakeholder-validation-pending"
  | "integration-link-unhealthy"
  | "stale-workflows-at-risk";

export interface DerivedProjectStatus {
  primaryPhase: ProjectPrimaryPhase;
  overlays: ProjectStatusOverlay[];
  reasonCodes: ProjectStatusReasonCode[];
  computedAt: number;
}

export interface ProgressWeights {
  docs: number;
  workflows: number;
  analysis: number;
}

export const PROJECT_PRIMARY_PHASES: ProjectPrimaryPhase[] = [
  "Not Started",
  "Document Drafting",
  "Waiting on Workflows",
  "Drafting Analysis",
  "Analysis Validation",
  "Ready to Close",
  "Complete",
];

export interface AnalysisCitation {
  id: string;
  artifactType: "doc" | "workflow" | "analysis-run";
  sourceId: string;
  label: string;
  href: string;
}

export interface AnalysisRecommendationActionSnapshot {
  recommendationId: string;
  title: string;
  summary: string;
  ownerDepartment: string;
  priorityRank: number;
  citations: AnalysisCitation[];
  sourceRunIds: string[];
}

export interface AnalysisRecommendationActionLinkage {
  status: RecommendationActionLinkStatus;
  payload: AnalysisRecommendationActionSnapshot;
  queuedAt: number;
  lastAttemptAt?: number;
  deliveryAttempts: number;
  clickupActionId?: string;
  clickupUrl?: string;
  failureReason?: string;
}

export interface AnalysisRecommendation {
  id: string;
  projectId: string;
  projectName: string;
  departmentId: string;
  departmentName: string;
  title: string;
  summary: string;
  citations: AnalysisCitation[];
  impactScore: number;
  effortScore: number;
  effortNormalized: number;
  confidenceScore: number;
  confidenceModifier: number;
  priorityRank: number;
  lifecycleState: RecommendationLifecycleState;
  sourceRunIds: string[];
  processKey: string;
  processName: string;
  primaryOwnerDepartment: string;
  participatingDepartments: string[];
  createdAt: number;
  updatedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
  reviewRationale?: string;
  approvedSnapshot?: AnalysisRecommendationActionSnapshot;
  actionLinkage?: AnalysisRecommendationActionLinkage;
}

export interface AnalysisHubRefreshMetadata {
  status: AnalysisHubRefreshStatus;
  stale: boolean;
  lastRefreshedAt?: number;
  source?: AnalysisHubRefreshSource;
  failureReason?: string;
  refreshedBy?: string;
}

export interface AnalysisToolRegistryEntry {
  id: string;
  toolName: string;
  ownerDepartment: string | null;
  status: ToolRegistryStatus;
  version: string | null;
  usageLimits: string | null;
  estimatedMonthlyCost: string | null;
  notes?: string;
}

export interface DepartmentScorecard {
  departmentId: string;
  departmentName: string;
  projectCount: number;
  healthScore: number;
  trend: AnalysisTrend;
  staleProjectCount: number;
  blockedWorkflowCount: number;
  unresolvedRecommendations: number;
}

export interface PortfolioScorecard {
  projectCount: number;
  departmentCount: number;
  avgHealthScore: number;
  improvedDepartmentCount: number;
  degradedDepartmentCount: number;
  revalidationCount: number;
}

export interface ProcessBottleneckSummary {
  id: string;
  projectId: string;
  projectName: string;
  departmentId: string;
  departmentName: string;
  processKey: string;
  processName: string;
  score: number;
  severity: "low" | "medium" | "high";
  trend: AnalysisTrend;
  scoreInputs: {
    blockedWorkflows: number;
    staleWorkflows: number;
    unsyncedRequiredArtifacts: number;
    governanceBlockers: number;
    completionGap: number;
  };
  primaryOwnerDepartment: string;
  participatingDepartments: string[];
  citations: AnalysisCitation[];
}

export interface RevalidationQueueItem {
  id: string;
  projectId: string;
  projectName: string;
  departmentId: string;
  departmentName: string;
  reason: string;
  staleSince: number;
  urgency: "low" | "medium" | "high";
}

export type RecommendationQueueItem = AnalysisRecommendation;

export interface PortfolioAnalysisDashboard {
  portfolioScorecard: PortfolioScorecard;
  departmentScorecards: DepartmentScorecard[];
  bottlenecks: ProcessBottleneckSummary[];
  opportunityQueue: RecommendationQueueItem[];
  revalidationQueue: RevalidationQueueItem[];
}

export interface DepartmentAnalysisDashboard {
  scorecard: DepartmentScorecard;
  bottlenecks: ProcessBottleneckSummary[];
  recommendations: RecommendationQueueItem[];
  revalidationQueue: RevalidationQueueItem[];
}

export interface InterviewMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface LevelDoc {
  id: string;
  title: string;
  content: string;
  scribeChecked: boolean;
  status: "todo" | "in-progress" | "completed";
  parentStageId?: string;
}

export interface DocChatMessage {
  id: string;
  role: Role;
  roleTag: RoleTag;
  content: string;
  timestamp: number;
  agentOverride?: RoleTag;
}

export interface DocProposal {
  id: string;
  title: string;
  summary: string;
  contentPatch: string;
  targetField: "content" | "title";
  status: "pending" | "applied" | "rejected" | "invalidated";
  conflictKey: string;
  createdAt: number;
}

export interface DocRevision {
  id: string;
  title: string;
  content: string;
  committedAt: number;
  authorRole: Role;
}

export interface DocThread {
  id: string;
  status: "active" | "archived";
  messages: DocChatMessage[];
  createdAt: number;
  closedAt?: number;
}

export interface DocumentWorkspaceState {
  activeThread: DocThread;
  threadHistory: DocThread[];
  proposals: DocProposal[];
  revisions: DocRevision[];
  draftTitle: string;
  draftContent: string;
  dirty: boolean;
  finalized: boolean;
  finalizedAt?: number;
  lastUpdatedAt: number;
}

export interface WorkflowVersion {
  id: string;
  createdAt: number;
  createdBy: string;
  source: "generate" | "regenerate" | "resume";
  baselineVersionId: string | null;
  content: string;
  diffSummary: string;
  lineage: {
    parentArtifactIds: string[];
    reason: string;
  };
  syncedAt?: number;
  syncedBy?: string;
}

export interface WorkflowSyncProof {
  reviewedChanges: boolean;
  clickupUpdated: boolean;
  embedVerified: boolean;
  submittedAt?: number;
  submittedBy?: string;
  adminVerifiedAt?: number;
  adminVerifiedBy?: string;
  notes?: string;
}

export interface WorkflowArtifact {
  id: string;
  projectId: string;
  docId: string;
  level: WorkflowLevel;
  title: string;
  parentArtifactId?: string;
  childArtifactIds: string[];
  lifecycleState: WorkflowLifecycleState;
  stale: boolean;
  blocked: boolean;
  blockedReason?: string;
  versions: WorkflowVersion[];
  currentVersionId?: string;
  lastSyncedVersionId?: string;
  diffBaselineVersionId?: string;
  clickupResourceType: ClickupResourceType;
  clickupResourceId?: string;
  clickupUrl?: string;
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  lastSyncedBy?: string;
  linkHealthStatus: LinkHealthStatus;
  linkHealthCheckedAt?: number;
  linkHealthReason?: string;
  proof?: WorkflowSyncProof;
}

export interface RequiredArtifactOverride {
  id: string;
  targetId: string;
  action: "add" | "remove";
  reason: string;
  requestedBy: string;
  requestedAt: number;
  executiveSponsorApprovedBy?: string;
  approvedAt?: number;
}

export interface RequiredArtifactRegistryEntry {
  id: string;
  artifactType: RequiredArtifactType;
  title: string;
  level: WorkflowLevel;
  docId?: string;
  workflowId?: string;
  source: "auto" | "override-add";
}

export interface GovernanceGateBlocker {
  id: string;
  artifactId?: string;
  gate: GovernanceGate;
  message: string;
  severity: "blocking";
}

export interface GovernanceGateEvaluation {
  ready: boolean;
  blockers: GovernanceGateBlocker[];
  requiredArtifacts: RequiredArtifactRegistryEntry[];
}

export interface GovernanceAuditEvent {
  id: string;
  timestamp: number;
  type: string;
  actor: string;
  reason?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AnalysisStepOneState {
  sections: Record<string, string>;
  mandatorySectionIds: string[];
  unresolvedRequiredPrompts: number;
  completedAt?: number;
  completedBy?: string;
}

export interface AnalysisStakeholder {
  id: string;
  displayName: string;
  decision: StakeholderDecision;
  comment?: string;
  updatedAt?: number;
}

export interface AnalysisStakeholderGroup {
  id: string;
  label: string;
  minimumApprovals: number;
  required: boolean;
  stakeholders: AnalysisStakeholder[];
}

export interface AnalysisStepTwoState {
  groups: AnalysisStakeholderGroup[];
  startedAt?: number;
  deadlineAt?: number;
  remindersSentAt: number[];
}

export interface AnalysisStepThreeState {
  startedAt?: number;
  signedOffAt?: number;
  signedOffBy?: string;
}

export interface AnalysisMetricsSnapshot {
  capturedAt: number;
  capturedBy: string;
  metrics: {
    totalDocs: number;
    finalizedDocs: number;
    syncedWorkflows: number;
    staleWorkflows: number;
    blockedWorkflows: number;
    completionPercent: number;
  };
}

export interface AnalysisRun {
  id: string;
  runNumber: number;
  lifecycleState: AnalysisLifecycleState;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  frozenArtifactIds: string[];
  clickupResourceId: string;
  clickupUrl: string;
  metricsSnapshot: AnalysisMetricsSnapshot;
  stepOne: AnalysisStepOneState;
  stepTwo: AnalysisStepTwoState;
  stepThree: AnalysisStepThreeState;
  revisionRequestedByStakeholderIds: string[];
  canceledReason?: string;
  canceledAt?: number;
  canceledBy?: string;
  archivedAt?: number;
  readOnly: boolean;
  auditMirror: string[];
}

export interface ProcessAnalysisSummaryArtifact {
  id: string;
  clickupResourceId?: string;
  clickupUrl?: string;
  syncStatus: SyncStatus;
  activeRunId: string | null;
  runIds: string[];
}

export interface ProjectAnalysisState {
  summaryArtifact: ProcessAnalysisSummaryArtifact;
  runs: AnalysisRun[];
  activeRunId: string | null;
}

export interface StakeholderGroupPolicy {
  id: string;
  label: string;
  minimumApprovals: number;
  required: boolean;
  members: string[];
}

export interface ProjectAnalysisConfig {
  validationWindowDaysOverride?: number;
  stakeholderGroupOverrides?: StakeholderGroupPolicy[];
}

export interface SOPProject {
  id: string;
  name: string;
  company: string;
  department: string;
  clickupDestination: {
    workspace: string;
    space: string;
    folder: string;
  };
  status: "drafting" | "review" | "done";
  lifecycle?: "active" | "analysis-pending" | "ready-to-close" | "finalized";
  setupCompleted?: boolean;
  pathComplexity?: ProjectPathComplexity;
  progress: number;
  levels: {
    L1: LevelDoc;
    L2: LevelDoc;
    L3: LevelDoc[];
    L4: LevelDoc[];
  };
  interviewHistory: InterviewMessage[];
  understanding: number;
  docWorkspace?: Record<string, DocumentWorkspaceState>;
  workflowArtifacts?: Record<string, WorkflowArtifact>;
  requiredArtifactOverrides?: RequiredArtifactOverride[];
  analysisState?: ProjectAnalysisState;
  analysisConfig?: ProjectAnalysisConfig;
  auditTrail?: GovernanceAuditEvent[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: "active" | "invited" | "inactive";
  assignedProjects: number;
  lastActiveAt: number;
}

export interface WorkspacePolicy {
  threadRetentionDays: number;
  proposalRetentionDays: number;
  autoArchiveThreadsOnFinalize: boolean;
  allowNonAdminFinalizeProject: boolean;
  analysisValidationWindowDays: number;
  linkHealthSweepMinutes: number;
  defaultStakeholderGroups: StakeholderGroupPolicy[];
  progressWeights: ProgressWeights;
  preCompleteProgressCap: number;
}

export interface AppSettings {
  defaultWorkspace: string;
  syncIntervalMinutes: number;
  notifyOnReviewReady: boolean;
  notifyOnSyncErrors: boolean;
  dailyDigest: boolean;
  autoAssignNewSops: boolean;
  requireMfa: boolean;
  sessionTimeoutMinutes: number;
  activeSettingsTab: SettingsTab;
  workspacePolicy: WorkspacePolicy;
  currentUserRole: UserRole;
  currentUserDepartment: string;
  portfolioDepartmentScopes: string[];
}

export interface ProjectUIPreferences {
  lastOpenedDocId: string | null;
  docHistory: string[];
  paneWidths: {
    left: number;
    middle: number;
    right: number;
  };
  lastMobilePane: MobileWorkspacePane;
  centerPaneModeByDocId: Record<string, CenterPaneMode>;
}

export interface ProjectsDashboardState {
  searchQuery: string;
  statusFilter: "all" | ProjectPrimaryPhase;
  departmentFilter: string;
  groupBy: "none" | "phase" | "department" | "company";
  viewMode: "grid" | "list";
  scrollTop: number;
}

export interface Capabilities {
  canEditDocs: boolean;
  canApplyProposals: boolean;
  canFinalizeDocs: boolean;
  canFinalizeProject: boolean;
  canManageStructure: boolean;
  canManagePolicies: boolean;
  canRegenerateWorkflows: boolean;
  canSubmitWorkflowProof: boolean;
  canVerifyWorkflowSync: boolean;
  canInitializeAnalysis: boolean;
  canCancelAnalysis: boolean;
  canSignoffAnalysis: boolean;
  canRefreshAnalysisMetrics: boolean;
  canViewPortfolioAnalysis: boolean;
  canViewDepartmentAnalysis: boolean;
  canApproveRecommendations: boolean;
  canRefreshAnalysisHub: boolean;
}

type NormalizedProject = SOPProject & {
  setupCompleted: boolean;
  lifecycle: NonNullable<SOPProject["lifecycle"]>;
  pathComplexity: NonNullable<SOPProject["pathComplexity"]>;
  docWorkspace: Record<string, DocumentWorkspaceState>;
  workflowArtifacts: Record<string, WorkflowArtifact>;
  requiredArtifactOverrides: RequiredArtifactOverride[];
  analysisState: ProjectAnalysisState;
  analysisConfig: ProjectAnalysisConfig;
  auditTrail: GovernanceAuditEvent[];
};

const DEFAULT_ANALYSIS_HUB_REFRESH_METADATA: AnalysisHubRefreshMetadata = {
  status: "idle",
  stale: true,
};

const DEFAULT_TOOLS_REGISTRY: AnalysisToolRegistryEntry[] = [
  {
    id: "tool-clickup",
    toolName: "ClickUp",
    ownerDepartment: "Operations",
    status: "Active",
    version: null,
    usageLimits: null,
    estimatedMonthlyCost: null,
    notes: "Primary execution and task-tracking platform.",
  },
  {
    id: "tool-scribe",
    toolName: "Scribe",
    ownerDepartment: "Operations",
    status: "Under Review",
    version: null,
    usageLimits: null,
    estimatedMonthlyCost: null,
    notes: "SOP step capture and proofing support.",
  },
  {
    id: "tool-notion",
    toolName: "Notion",
    ownerDepartment: "Operations",
    status: "Planned",
    version: null,
    usageLimits: null,
    estimatedMonthlyCost: null,
    notes: "Structured documentation and reporting workspace.",
  },
  {
    id: "tool-zapier",
    toolName: "Zapier",
    ownerDepartment: "Engineering",
    status: "Deprecated",
    version: null,
    usageLimits: null,
    estimatedMonthlyCost: null,
    notes: "Legacy automations under migration review.",
  },
];

interface AppState {
  projects: SOPProject[];
  currentProjectId: string | null;
  employees: Employee[];
  settings: AppSettings;
  analysisHubRecommendations: Record<string, AnalysisRecommendation>;
  analysisHubRefreshMetadata: AnalysisHubRefreshMetadata;
  toolsRegistry: AnalysisToolRegistryEntry[];
  projectUIPreferences: Record<string, ProjectUIPreferences>;
  projectsDashboardState: ProjectsDashboardState;
  lastWorkspaceNotice: string | null;

  addProject: (project: SOPProject) => void;
  updateProject: (id: string, updates: Partial<SOPProject>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  markProjectSetupComplete: (projectId: string) => void;
  setProjectLifecycle: (
    projectId: string,
    lifecycle: NonNullable<SOPProject["lifecycle"]>
  ) => void;
  finalizeProjectWithGovernance: (projectId: string, actor?: string) => boolean;
  setProjectPathComplexity: (projectId: string, complexity: ProjectPathComplexity) => void;

  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;

  updateSettings: (updates: Partial<AppSettings>) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setUserRole: (role: UserRole) => void;

  updateProjectDashboardState: (updates: Partial<ProjectsDashboardState>) => void;
  setProjectScrollTop: (scrollTop: number) => void;
  setWorkspaceNotice: (notice: string | null) => void;

  setLastOpenedDoc: (projectId: string, docId: string) => void;
  setPaneWidths: (projectId: string, widths: ProjectUIPreferences["paneWidths"]) => void;
  setLastMobilePane: (projectId: string, pane: MobileWorkspacePane) => void;
  setCenterPaneMode: (projectId: string, docId: string, mode: CenterPaneMode) => void;
  appendDocHistory: (projectId: string, docId: string) => void;
  clearDocHistory: (projectId: string) => void;

  updateDoc: (
    projectId: string,
    level: "L1" | "L2" | "L3" | "L4",
    docId: string,
    updates: Partial<LevelDoc>
  ) => void;
  setDraftContent: (
    projectId: string,
    docId: string,
    updates: { title?: string; content?: string },
    source?: "manual" | "proposal"
  ) => void;
  discardDraft: (projectId: string, docId: string) => void;
  commitRevision: (projectId: string, docId: string) => void;
  restoreRevision: (projectId: string, docId: string, revisionId: string) => void;
  finalizeDoc: (projectId: string, docId: string) => void;
  createRevisionThread: (projectId: string, docId: string) => void;

  addMessage: (projectId: string, message: InterviewMessage) => void;
  setUnderstanding: (projectId: string, value: number) => void;
  addDocMessage: (projectId: string, docId: string, message: Omit<DocChatMessage, "id" | "timestamp">) => void;

  addProposal: (projectId: string, docId: string, proposal: Omit<DocProposal, "id" | "createdAt">) => void;
  applyProposal: (projectId: string, docId: string, proposalId: string) => void;
  rejectProposal: (projectId: string, docId: string, proposalId: string) => void;
  applyAllNonConflictingProposals: (projectId: string, docId: string) => void;
  rejectAllProposals: (projectId: string, docId: string) => void;
  invalidateConflictingProposals: (projectId: string, docId: string, conflictKey: string) => void;
  archiveActiveThread: (projectId: string, docId: string) => void;

  duplicateDoc: (projectId: string, docId: string) => string | null;
  moveDocToStage: (projectId: string, docId: string, stageId: string) => void;
  deleteDoc: (projectId: string, docId: string) => { deletedDoc: LevelDoc | null; nextDocId: string | null };
  restoreDeletedDoc: (projectId: string, doc: LevelDoc) => void;

  setRequiredArtifactOverride: (
    projectId: string,
    input: {
      targetId: string;
      action: "add" | "remove";
      reason: string;
      executiveSponsorApprovedBy?: string;
      actor?: string;
    }
  ) => boolean;

  generateWorkflow: (projectId: string, workflowId: string, actor?: string) => boolean;
  regenerateWorkflowFromChildren: (projectId: string, workflowId: string, actor?: string) => boolean;
  regenerateAllStaleWorkflows: (
    projectId: string,
    actor?: string
  ) => { regenerated: number; blocked: number; unchanged: number; blockedWorkflowIds: string[] };
  submitWorkflowProof: (
    projectId: string,
    workflowId: string,
    input: {
      reviewedChanges: boolean;
      clickupUpdated: boolean;
      embedVerified: boolean;
      notes?: string;
      actor?: string;
    }
  ) => boolean;
  verifyWorkflowSync: (
    projectId: string,
    workflowId: string,
    input: { approved: boolean; reason?: string; actor?: string }
  ) => boolean;
  setWorkflowClickupResource: (
    projectId: string,
    workflowId: string,
    payload: {
      clickupResourceType: ClickupResourceType;
      clickupResourceId: string;
      clickupUrl: string;
      actor?: string;
    }
  ) => boolean;
  setWorkflowLinkHealthStatus: (
    projectId: string,
    workflowId: string,
    status: LinkHealthStatus,
    reason?: string,
    actor?: string
  ) => void;
  runWorkflowLinkHealthSweep: (
    projectId: string,
    actor?: string
  ) => { valid: number; invalid: number; authRequired: number };

  initializeAnalysisRun: (
    projectId: string,
    actor?: string
  ) => { ok: boolean; blockers: GovernanceGateBlocker[] };
  updateAnalysisStepOneSection: (projectId: string, sectionId: string, value: string, actor?: string) => void;
  setAnalysisUnresolvedPrompts: (projectId: string, count: number, actor?: string) => void;
  completeAnalysisStepOne: (projectId: string, actor?: string) => boolean;
  recordStakeholderDecision: (
    projectId: string,
    payload: {
      groupId: string;
      stakeholderId: string;
      decision: StakeholderDecision;
      comment?: string;
      actor?: string;
    }
  ) => boolean;
  submitAnalysisRevision: (projectId: string, actor?: string) => boolean;
  extendAnalysisValidationWindow: (projectId: string, days: number, actor?: string) => boolean;
  refreshAnalysisMetrics: (projectId: string, actor?: string) => boolean;
  cancelAnalysisRun: (projectId: string, reason: string, actor?: string) => boolean;
  reinitializeAnalysisRun: (projectId: string, mode: AnalysisReinitMode, actor?: string) => boolean;
  finalizeAnalysisRun: (projectId: string, actor?: string) => boolean;
  refreshAnalysisHubInsights: (
    source?: AnalysisHubRefreshSource,
    actor?: string
  ) => { ok: boolean; reason?: string };
  reviewAnalysisRecommendation: (
    recommendationId: string,
    input: { decision: "approve" | "reject"; rationale: string; actor?: string }
  ) => boolean;
  updateRecommendationLifecycleState: (
    recommendationId: string,
    lifecycleState: RecommendationLifecycleState,
    actor?: string
  ) => boolean;
  dispatchRecommendationAction: (
    recommendationId: string,
    input?: { actor?: string; forceFailure?: boolean; failureReason?: string }
  ) => boolean;
  retryRecommendationActionDispatch: (recommendationId: string, actor?: string) => boolean;

  seedBulkData: (projects: SOPProject[], employees: Employee[]) => void;

  estimateCleanupImpact: (nextPolicy: WorkspacePolicy) => { threadCount: number; docCount: number };
}

const WORKFLOW_LEVEL_ORDER: WorkflowLevel[] = ["L4", "L3", "L2", "L1"];
const ANALYSIS_MANDATORY_SECTION_IDS = [
  "current-state",
  "bottlenecks",
  "future-state",
  "implementation-plan",
] as const;
const FINALIZED_ANALYSIS_STATE: AnalysisLifecycleState = "Finalized";

const DEFAULT_STAKEHOLDER_GROUPS: StakeholderGroupPolicy[] = [
  {
    id: "process-owner-dept-lead",
    label: "Process Owner Dept Lead",
    minimumApprovals: 1,
    required: true,
    members: ["Department Lead"],
  },
  {
    id: "executive-sponsor",
    label: "Executive Sponsor",
    minimumApprovals: 1,
    required: true,
    members: ["Executive Sponsor"],
  },
  {
    id: "operations-representatives",
    label: "Operations Representatives",
    minimumApprovals: 1,
    required: false,
    members: ["Operations Manager"],
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  defaultWorkspace: "Main Workspace",
  syncIntervalMinutes: 15,
  notifyOnReviewReady: true,
  notifyOnSyncErrors: true,
  dailyDigest: false,
  autoAssignNewSops: true,
  requireMfa: false,
  sessionTimeoutMinutes: 60,
  activeSettingsTab: "general",
  workspacePolicy: {
    threadRetentionDays: 30,
    proposalRetentionDays: 14,
    autoArchiveThreadsOnFinalize: true,
    allowNonAdminFinalizeProject: false,
    analysisValidationWindowDays: 7,
    linkHealthSweepMinutes: 15,
    defaultStakeholderGroups: DEFAULT_STAKEHOLDER_GROUPS,
    progressWeights: { docs: 40, workflows: 35, analysis: 25 },
    preCompleteProgressCap: 99,
  },
  currentUserRole: "admin",
  currentUserDepartment: "Engineering",
  portfolioDepartmentScopes: ["all"],
};

const DEFAULT_DASHBOARD_STATE: ProjectsDashboardState = {
  searchQuery: "",
  statusFilter: "all",
  departmentFilter: "all",
  groupBy: "none" as const,
  viewMode: "grid",
  scrollTop: 0,
};

const DEFAULT_PROJECT_PREFERENCES: ProjectUIPreferences = {
  lastOpenedDocId: null,
  docHistory: [],
  paneWidths: {
    left: 24,
    middle: 46,
    right: 30,
  },
  lastMobilePane: "doc",
  centerPaneModeByDocId: {},
};

const cryptoSafeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createThread = (): DocThread => ({
  id: cryptoSafeId(),
  status: "active",
  createdAt: Date.now(),
  messages: [],
});

const createDocWorkspace = (doc: LevelDoc): DocumentWorkspaceState => ({
  activeThread: createThread(),
  threadHistory: [],
  proposals: [],
  revisions: [],
  draftTitle: doc.title,
  draftContent: doc.content,
  dirty: false,
  finalized: false,
  lastUpdatedAt: Date.now(),
});

const allDocs = (project: SOPProject) => [
  project.levels.L1,
  project.levels.L2,
  ...project.levels.L3,
  ...project.levels.L4,
];

export const getProjectDocIds = (project: SOPProject) => allDocs(project).map((doc) => doc.id);

const findDocById = (project: SOPProject, docId: string): LevelDoc | undefined =>
  allDocs(project).find((doc) => doc.id === docId);

const getDocLevel = (project: SOPProject, docId: string): WorkflowLevel => {
  if (project.levels.L1.id === docId) return "L1";
  if (project.levels.L2.id === docId) return "L2";
  if (project.levels.L3.some((item) => item.id === docId)) return "L3";
  return "L4";
};

const getWorkflowArtifactId = (level: WorkflowLevel, docId: string) => `workflow:${level}:${docId}`;
const getSummaryArtifactId = (projectId: string) => `analysis-summary:${projectId}`;

const evaluateLinkHealthFromUrl = (
  clickupUrl?: string
): { status: LinkHealthStatus; reason: string } => {
  if (!clickupUrl || clickupUrl.trim().length === 0) {
    return { status: "Invalid", reason: "Missing ClickUp URL" };
  }
  if (clickupUrl.toLowerCase().includes("auth-required")) {
    return { status: "Auth Required", reason: "Authorization required to access link" };
  }
  if (!clickupUrl.startsWith("https://")) {
    return { status: "Invalid", reason: "Link must use HTTPS" };
  }
  return { status: "Valid", reason: "Link verified" };
};

const createWorkflowArtifact = (
  projectId: string,
  level: WorkflowLevel,
  docId: string,
  title: string,
  parentArtifactId?: string
): WorkflowArtifact => ({
  id: getWorkflowArtifactId(level, docId),
  projectId,
  docId,
  level,
  title,
  parentArtifactId,
  childArtifactIds: [],
  lifecycleState: "Not Generated",
  stale: false,
  blocked: false,
  versions: [],
  clickupResourceType: "doc",
  syncStatus: "unsynced",
  linkHealthStatus: "Invalid",
});

const buildWorkflowSkeleton = (project: SOPProject): Record<string, WorkflowArtifact> => {
  const records: Record<string, WorkflowArtifact> = {};
  const l1Workflow = createWorkflowArtifact(
    project.id,
    "L1",
    project.levels.L1.id,
    `Workflow · ${project.levels.L1.title}`
  );
  const l2Workflow = createWorkflowArtifact(
    project.id,
    "L2",
    project.levels.L2.id,
    `Workflow · ${project.levels.L2.title}`,
    l1Workflow.id
  );
  records[l1Workflow.id] = l1Workflow;
  records[l2Workflow.id] = l2Workflow;

  project.levels.L3.forEach((stage) => {
    const stageWorkflow = createWorkflowArtifact(
      project.id,
      "L3",
      stage.id,
      `Workflow · ${stage.title}`,
      l2Workflow.id
    );
    records[stageWorkflow.id] = stageWorkflow;
  });

  project.levels.L4.forEach((procedure) => {
    const parentStageId =
      procedure.parentStageId ??
      project.levels.L3[Math.min(project.levels.L3.length - 1, 0)]?.id ??
      project.levels.L2.id;
    const parentWorkflowId = getWorkflowArtifactId("L3", parentStageId);
    const procedureWorkflow = createWorkflowArtifact(
      project.id,
      "L4",
      procedure.id,
      `Workflow · ${procedure.title}`,
      parentWorkflowId
    );
    records[procedureWorkflow.id] = procedureWorkflow;
  });

  Object.values(records).forEach((artifact) => {
    if (!artifact.parentArtifactId) return;
    const parent = records[artifact.parentArtifactId];
    if (!parent) return;
    parent.childArtifactIds = [...parent.childArtifactIds, artifact.id];
  });

  return records;
};

const mergeWorkflowArtifacts = (
  baseArtifacts: Record<string, WorkflowArtifact>,
  existingArtifacts?: Record<string, WorkflowArtifact>
): Record<string, WorkflowArtifact> => {
  const merged: Record<string, WorkflowArtifact> = {};
  Object.values(baseArtifacts).forEach((base) => {
    const incoming = existingArtifacts?.[base.id];
    const linkHealthEvaluation = evaluateLinkHealthFromUrl(incoming?.clickupUrl);
    merged[base.id] = {
      ...base,
      ...incoming,
      id: base.id,
      projectId: base.projectId,
      docId: base.docId,
      level: base.level,
      title: base.title,
      parentArtifactId: base.parentArtifactId,
      childArtifactIds: base.childArtifactIds,
      versions: incoming?.versions ?? [],
      lifecycleState: incoming?.lifecycleState ?? base.lifecycleState,
      stale: incoming?.stale ?? false,
      blocked: incoming?.blocked ?? false,
      blockedReason: incoming?.blockedReason,
      currentVersionId: incoming?.currentVersionId ?? incoming?.versions?.at(-1)?.id,
      lastSyncedVersionId: incoming?.lastSyncedVersionId,
      diffBaselineVersionId:
        incoming?.diffBaselineVersionId ?? incoming?.lastSyncedVersionId ?? undefined,
      clickupResourceType: incoming?.clickupResourceType ?? "doc",
      clickupResourceId: incoming?.clickupResourceId,
      clickupUrl: incoming?.clickupUrl,
      syncStatus:
        incoming?.syncStatus ??
        (incoming?.lifecycleState === "Synced" ? "synced" : "unsynced"),
      lastSyncedAt: incoming?.lastSyncedAt,
      lastSyncedBy: incoming?.lastSyncedBy,
      linkHealthStatus: incoming?.linkHealthStatus ?? linkHealthEvaluation.status,
      linkHealthCheckedAt: incoming?.linkHealthCheckedAt,
      linkHealthReason: incoming?.linkHealthReason ?? linkHealthEvaluation.reason,
      proof: incoming?.proof,
    };
  });
  return merged;
};

const createDefaultAnalysisState = (projectId: string): ProjectAnalysisState => ({
  summaryArtifact: {
    id: getSummaryArtifactId(projectId),
    syncStatus: "unsynced",
    activeRunId: null,
    runIds: [],
  },
  runs: [],
  activeRunId: null,
});

const calculateProjectMetrics = (
  project: Pick<SOPProject, "levels" | "docWorkspace" | "workflowArtifacts">
) => {
  const totalDocs = allDocs(project as SOPProject).length;
  const finalizedDocs = allDocs(project as SOPProject).filter(
    (doc) => project.docWorkspace?.[doc.id]?.finalized
  ).length;
  const workflows = Object.values(project.workflowArtifacts ?? {});
  const syncedWorkflows = workflows.filter((workflow) => workflow.lifecycleState === "Synced").length;
  const staleWorkflows = workflows.filter((workflow) => workflow.stale).length;
  const blockedWorkflows = workflows.filter((workflow) => workflow.blocked).length;
  const completionPercent = totalDocs === 0 ? 0 : Math.round((finalizedDocs / totalDocs) * 100);
  return {
    totalDocs,
    finalizedDocs,
    syncedWorkflows,
    staleWorkflows,
    blockedWorkflows,
    completionPercent,
  };
};

const createAnalysisRun = (
  project: NormalizedProject,
  runNumber: number,
  actor: string,
  stakeholders: AnalysisStakeholderGroup[],
  frozenArtifactIds: string[]
): AnalysisRun => {
  const now = Date.now();
  const clickupResourceId = `analysis-${project.id}-${runNumber}-${cryptoSafeId().slice(0, 6)}`;
  return {
    id: `analysis-run-${cryptoSafeId()}`,
    runNumber,
    lifecycleState: "Initialized (Step 1 Active)",
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    frozenArtifactIds,
    clickupResourceId,
    clickupUrl: `https://app.clickup.com/t/${clickupResourceId}`,
    metricsSnapshot: {
      capturedAt: now,
      capturedBy: actor,
      metrics: calculateProjectMetrics(project),
    },
    stepOne: {
      sections: ANALYSIS_MANDATORY_SECTION_IDS.reduce<Record<string, string>>((accumulator, sectionId) => {
        accumulator[sectionId] = "";
        return accumulator;
      }, {}),
      mandatorySectionIds: [...ANALYSIS_MANDATORY_SECTION_IDS],
      unresolvedRequiredPrompts: 0,
    },
    stepTwo: {
      groups: stakeholders,
      remindersSentAt: [],
    },
    stepThree: {},
    revisionRequestedByStakeholderIds: [],
    readOnly: false,
    auditMirror: [`[${new Date(now).toISOString()}] Run initialized by ${actor}`],
  };
};

const ensureProjectPreferences = (
  current: Record<string, ProjectUIPreferences>,
  projectId: string
): Record<string, ProjectUIPreferences> => ({
  ...current,
  [projectId]: {
    ...DEFAULT_PROJECT_PREFERENCES,
    ...(current[projectId] ?? {}),
  },
});

const normalizeProject = (project: SOPProject): NormalizedProject => {
  const levels = { ...project.levels };
  levels.L4 = levels.L4.map((doc, index) => {
    if (doc.parentStageId) return doc;
    const stage = levels.L3[Math.min(levels.L3.length - 1, Math.floor(index / 2))];
    return { ...doc, parentStageId: stage?.id };
  });

  const workspace = { ...(project.docWorkspace ?? {}) };
  allDocs({ ...project, levels }).forEach((doc) => {
    if (!workspace[doc.id]) {
      workspace[doc.id] = createDocWorkspace(doc);
      return;
    }
    workspace[doc.id] = {
      ...createDocWorkspace(doc),
      ...workspace[doc.id],
      draftTitle: workspace[doc.id].draftTitle ?? doc.title,
      draftContent: workspace[doc.id].draftContent ?? doc.content,
      activeThread: workspace[doc.id].activeThread ?? createThread(),
      threadHistory: workspace[doc.id].threadHistory ?? [],
      proposals: workspace[doc.id].proposals ?? [],
      revisions: workspace[doc.id].revisions ?? [],
    };
  });

  const normalizedProject = {
    ...project,
    levels,
    setupCompleted: project.setupCompleted ?? project.understanding >= 100,
    lifecycle: project.lifecycle ?? "active",
    pathComplexity:
      project.pathComplexity ?? (levels.L4.length <= 3 ? ("simple" as const) : ("complex" as const)),
    docWorkspace: workspace,
    requiredArtifactOverrides: project.requiredArtifactOverrides ?? [],
    analysisState: project.analysisState ?? createDefaultAnalysisState(project.id),
    analysisConfig: project.analysisConfig ?? {},
    auditTrail: project.auditTrail ?? [],
  } as NormalizedProject;

  const skeleton = buildWorkflowSkeleton(normalizedProject);
  normalizedProject.workflowArtifacts = mergeWorkflowArtifacts(skeleton, project.workflowArtifacts);
  if (!normalizedProject.analysisState.summaryArtifact) {
    normalizedProject.analysisState = createDefaultAnalysisState(project.id);
  } else {
    normalizedProject.analysisState = {
      ...createDefaultAnalysisState(project.id),
      ...normalizedProject.analysisState,
      summaryArtifact: {
        ...createDefaultAnalysisState(project.id).summaryArtifact,
        ...normalizedProject.analysisState.summaryArtifact,
        id: getSummaryArtifactId(project.id),
      },
    };
  }

  return normalizedProject;
};

const getWorkflowForDocId = (project: SOPProject, docId: string): WorkflowArtifact | undefined =>
  Object.values(project.workflowArtifacts ?? {}).find((artifact) => artifact.docId === docId);

const getRequiredWorkflowLevels = (project: SOPProject): WorkflowLevel[] =>
  project.pathComplexity === "simple" ? ["L4"] : ["L4", "L3", "L2"];

const isWorkflowDependencySatisfied = (project: NormalizedProject, workflow: WorkflowArtifact): boolean => {
  if (workflow.level === "L4") return true;
  if (workflow.childArtifactIds.length === 0) return false;
  return workflow.childArtifactIds
    .map((childId) => project.workflowArtifacts[childId])
    .filter(Boolean)
    .every((child) => !!child.currentVersionId);
};

const markWorkflowChainStale = (
  project: NormalizedProject,
  workflowId: string | undefined,
  reason: string,
  actor: string
) => {
  let currentId = workflowId;
  while (currentId) {
    const workflow = project.workflowArtifacts[currentId];
    if (!workflow) break;
    workflow.stale = true;
    workflow.blocked = false;
    workflow.blockedReason = undefined;
    currentId = workflow.parentArtifactId;
  }
  project.auditTrail = [
    ...project.auditTrail,
    {
      id: cryptoSafeId(),
      timestamp: Date.now(),
      type: "workflow.stale-propagation",
      actor,
      reason,
      metadata: { workflowId: workflowId ?? "unknown" },
    },
  ];
};

const getLatestRunByState = (
  project: SOPProject,
  lifecycleState: AnalysisLifecycleState
): AnalysisRun | undefined =>
  [...(project.analysisState?.runs ?? [])]
    .reverse()
    .find((run) => run.lifecycleState === lifecycleState);

export const getActiveAnalysisRun = (project: SOPProject): AnalysisRun | null => {
  const analysisState = project.analysisState;
  const activeId = analysisState?.activeRunId;
  if (!activeId) return null;
  return analysisState.runs.find((run) => run.id === activeId) ?? null;
};

const isFreezeActiveForRun = (run: AnalysisRun | null): boolean =>
  !!run && run.lifecycleState !== "Canceled" && run.lifecycleState !== FINALIZED_ANALYSIS_STATE;

const isDocFrozenForAnalysis = (project: SOPProject, docId: string): boolean => {
  const run = getActiveAnalysisRun(project);
  if (!run || !isFreezeActiveForRun(run)) return false;
  const workflow = getWorkflowForDocId(project, docId);
  const docRef = `doc:${docId}`;
  const workflowRef = workflow ? `workflow:${workflow.id}` : null;
  return (
    run.frozenArtifactIds.includes(docRef) ||
    (workflowRef ? run.frozenArtifactIds.includes(workflowRef) : false)
  );
};

const materializeStakeholderGroups = (
  project: NormalizedProject,
  employees: Employee[],
  settings: AppSettings
): AnalysisStakeholderGroup[] => {
  const groupPolicies =
    project.analysisConfig.stakeholderGroupOverrides?.length
      ? project.analysisConfig.stakeholderGroupOverrides
      : settings.workspacePolicy.defaultStakeholderGroups;

  const requiredIds = new Set(["process-owner-dept-lead", "executive-sponsor"]);
  const normalizedPolicies = [...groupPolicies];
  requiredIds.forEach((requiredId) => {
    if (normalizedPolicies.some((group) => group.id === requiredId)) return;
    const fallback = DEFAULT_STAKEHOLDER_GROUPS.find((group) => group.id === requiredId);
    if (fallback) normalizedPolicies.push(fallback);
  });

  return normalizedPolicies.map((groupPolicy) => {
    const stakeholderMembers = groupPolicy.members.map((memberLabel, index) => {
      const matchingEmployee =
        employees.find(
          (employee) =>
            employee.name.toLowerCase().includes(memberLabel.toLowerCase()) ||
            employee.role.toLowerCase().includes(memberLabel.toLowerCase()) ||
            employee.department === project.department
        ) ?? employees[index % Math.max(employees.length, 1)];
      return {
        id: `${groupPolicy.id}:${index}:${cryptoSafeId().slice(0, 6)}`,
        displayName: matchingEmployee?.name ?? memberLabel,
        decision: "Pending" as const,
      };
    });

    return {
      id: groupPolicy.id,
      label: groupPolicy.label,
      minimumApprovals: groupPolicy.minimumApprovals,
      required: groupPolicy.required,
      stakeholders: stakeholderMembers,
    };
  });
};

export const getRequiredArtifactRegistry = (project: SOPProject): RequiredArtifactRegistryEntry[] => {
  const normalizedProject = normalizeProject(project);
  const requiredLevels = getRequiredWorkflowLevels(normalizedProject);
  const registry = new Map<string, RequiredArtifactRegistryEntry>();

  const addDocIfRequired = (doc: LevelDoc, level: WorkflowLevel) => {
    if (!requiredLevels.includes(level)) return;
    registry.set(`doc:${doc.id}`, {
      id: `doc:${doc.id}`,
      artifactType: "doc",
      title: doc.title,
      level,
      docId: doc.id,
      source: "auto",
    });
  };

  addDocIfRequired(normalizedProject.levels.L2, "L2");
  normalizedProject.levels.L3.forEach((stage) => addDocIfRequired(stage, "L3"));
  normalizedProject.levels.L4.forEach((procedure) => addDocIfRequired(procedure, "L4"));
  if (requiredLevels.includes("L1")) {
    addDocIfRequired(normalizedProject.levels.L1, "L1");
  }

  Object.values(normalizedProject.workflowArtifacts).forEach((workflow) => {
    if (!requiredLevels.includes(workflow.level)) return;
    registry.set(`workflow:${workflow.id}`, {
      id: `workflow:${workflow.id}`,
      artifactType: "workflow",
      title: workflow.title,
      level: workflow.level,
      workflowId: workflow.id,
      docId: workflow.docId,
      source: "auto",
    });
  });

  normalizedProject.requiredArtifactOverrides.forEach((override) => {
    if (override.action === "remove") {
      if (!override.executiveSponsorApprovedBy) return;
      registry.delete(override.targetId);
      return;
    }
    if (registry.has(override.targetId)) return;
    if (override.targetId.startsWith("doc:")) {
      const targetDocId = override.targetId.replace("doc:", "");
      const doc = findDocById(normalizedProject, targetDocId);
      if (!doc) return;
      registry.set(override.targetId, {
        id: override.targetId,
        artifactType: "doc",
        title: doc.title,
        level: getDocLevel(normalizedProject, targetDocId),
        docId: targetDocId,
        source: "override-add",
      });
      return;
    }
    if (override.targetId.startsWith("workflow:")) {
      const targetWorkflowId = override.targetId.replace("workflow:", "");
      const workflow = normalizedProject.workflowArtifacts[targetWorkflowId];
      if (!workflow) return;
      registry.set(override.targetId, {
        id: override.targetId,
        artifactType: "workflow",
        title: workflow.title,
        level: workflow.level,
        workflowId: workflow.id,
        docId: workflow.docId,
        source: "override-add",
      });
    }
  });

  return [...registry.values()].sort((a, b) =>
    WORKFLOW_LEVEL_ORDER.indexOf(a.level) - WORKFLOW_LEVEL_ORDER.indexOf(b.level)
  );
};

export const evaluateGovernanceGate = (
  project: SOPProject,
  gate: GovernanceGate
): GovernanceGateEvaluation => {
  const normalizedProject = normalizeProject(project);
  const requiredArtifacts = getRequiredArtifactRegistry(normalizedProject);
  const blockers: GovernanceGateBlocker[] = [];

  requiredArtifacts.forEach((artifact) => {
    if (artifact.artifactType === "doc" && artifact.docId) {
      const doc = findDocById(normalizedProject, artifact.docId);
      const workspace = normalizedProject.docWorkspace[artifact.docId];
      if (!doc || !workspace?.finalized) {
        blockers.push({
          id: `blocker:${gate}:${artifact.id}:finalized`,
          artifactId: artifact.id,
          gate,
          message: `${artifact.title} is not finalized`,
          severity: "blocking",
        });
      }
      if (!doc?.scribeChecked) {
        blockers.push({
          id: `blocker:${gate}:${artifact.id}:scribe`,
          artifactId: artifact.id,
          gate,
          message: `${artifact.title} is missing required Scribe verification`,
          severity: "blocking",
        });
      }
      return;
    }

    if (artifact.artifactType === "workflow" && artifact.workflowId) {
      const workflow = normalizedProject.workflowArtifacts[artifact.workflowId];
      if (!workflow || workflow.lifecycleState !== "Synced") {
        blockers.push({
          id: `blocker:${gate}:${artifact.id}:sync`,
          artifactId: artifact.id,
          gate,
          message: `${artifact.title} is not synced`,
          severity: "blocking",
        });
      }
      if (workflow && workflow.linkHealthStatus !== "Valid") {
        blockers.push({
          id: `blocker:${gate}:${artifact.id}:link`,
          artifactId: artifact.id,
          gate,
          message: `${artifact.title} link health is ${workflow.linkHealthStatus}`,
          severity: "blocking",
        });
      }
    }
  });

  const activeRun = getActiveAnalysisRun(normalizedProject);
  if (gate === "initialize-analysis") {
    if (activeRun && activeRun.lifecycleState !== "Canceled" && activeRun.lifecycleState !== "Finalized") {
      blockers.push({
        id: `blocker:${gate}:active-run`,
        gate,
        message: "An analysis run is already active",
        severity: "blocking",
      });
    }
  }

  if (gate === "finalize-analysis") {
    if (!activeRun || activeRun.lifecycleState !== "Admin Signoff (Step 3 Active)") {
      blockers.push({
        id: `blocker:${gate}:state`,
        gate,
        message: "Analysis must be in Admin Signoff (Step 3 Active) before finalization",
        severity: "blocking",
      });
    }
  }

  if (gate === "finalize-project") {
    const latestFinalized = getLatestRunByState(normalizedProject, "Finalized");
    if (!latestFinalized) {
      blockers.push({
        id: `blocker:${gate}:analysis`,
        gate,
        message: "Project requires a finalized Process Analysis Summary before close",
        severity: "blocking",
      });
    }
    if (activeRun?.lifecycleState === "Revision Required") {
      blockers.push({
        id: `blocker:${gate}:revision-required`,
        gate,
        message: "Analysis is in Revision Required after required artifact mutation",
        severity: "blocking",
      });
    }
  }

  return {
    ready: blockers.length === 0,
    blockers,
    requiredArtifacts,
  };
};

const appendAudit = (
  project: NormalizedProject,
  input: {
    type: string;
    actor: string;
    reason?: string;
    metadata?: Record<string, string | number | boolean | null>;
    runId?: string;
  }
) => {
  const event: GovernanceAuditEvent = {
    id: cryptoSafeId(),
    timestamp: Date.now(),
    type: input.type,
    actor: input.actor,
    reason: input.reason,
    metadata: input.metadata,
  };
  project.auditTrail = [event, ...project.auditTrail];
  if (!input.runId) return;
  const run = project.analysisState.runs.find((candidateRun) => candidateRun.id === input.runId);
  if (!run) return;
  run.auditMirror = [
    ...run.auditMirror,
    `[${new Date(event.timestamp).toISOString()}] ${event.type} by ${input.actor}${
      input.reason ? ` (${input.reason})` : ""
    }`,
  ];
};

const maybeReopenAnalysisForRequiredMutation = (
  project: NormalizedProject,
  mutatedArtifactRefs: string[],
  actor: string,
  reason: string
) => {
  const finalizedRun = getLatestRunByState(project, "Finalized");
  if (!finalizedRun) return;
  const requiredIds = new Set(getRequiredArtifactRegistry(project).map((artifact) => artifact.id));
  const isRequiredMutation = mutatedArtifactRefs.some((artifactId) => requiredIds.has(artifactId));
  if (!isRequiredMutation) return;

  finalizedRun.lifecycleState = "Revision Required";
  finalizedRun.readOnly = false;
  finalizedRun.updatedAt = Date.now();
  project.analysisState.activeRunId = finalizedRun.id;
  project.analysisState.summaryArtifact.activeRunId = finalizedRun.id;
  project.lifecycle = "analysis-pending";
  appendAudit(project, {
    type: "analysis.reopened-after-required-mutation",
    actor,
    reason,
    runId: finalizedRun.id,
    metadata: { mutatedArtifacts: mutatedArtifactRefs.join(",") },
  });
};

const registerDocMutation = (
  project: NormalizedProject,
  docId: string,
  actor: string,
  reason: string
) => {
  const workflow = getWorkflowForDocId(project, docId);
  const mutatedRefs = [`doc:${docId}`];
  if (workflow) {
    mutatedRefs.push(`workflow:${workflow.id}`);
    if (workflow.lifecycleState === "Synced") {
      workflow.stale = true;
    }
    markWorkflowChainStale(project, workflow.parentArtifactId, reason, actor);
  }
  appendAudit(project, {
    type: "artifact.mutated",
    actor,
    reason,
    metadata: { docId, workflowId: workflow?.id ?? null },
  });
  maybeReopenAnalysisForRequiredMutation(project, mutatedRefs, actor, reason);
};

const createWorkflowVersion = (
  workflow: WorkflowArtifact,
  actor: string,
  source: WorkflowVersion["source"],
  reason: string,
  lineageParentIds: string[]
) => {
  const baselineId = workflow.lastSyncedVersionId ?? null;
  const nextVersion: WorkflowVersion = {
    id: `workflow-version-${cryptoSafeId()}`,
    createdAt: Date.now(),
    createdBy: actor,
    source,
    baselineVersionId: baselineId,
    content: `${workflow.title}\n\nGenerated at ${new Date().toISOString()} by ${actor}.`,
    diffSummary: baselineId
      ? `Diff computed from last synced baseline ${baselineId}.`
      : "Initial generation with no synced baseline.",
    lineage: {
      parentArtifactIds: lineageParentIds,
      reason,
    },
  };
  workflow.versions = [...workflow.versions, nextVersion];
  workflow.currentVersionId = nextVersion.id;
  workflow.diffBaselineVersionId = baselineId ?? undefined;
  workflow.lifecycleState = "Generated (Needs Review)";
  workflow.syncStatus = "pending-proof";
  workflow.stale = false;
  workflow.blocked = false;
  workflow.blockedReason = undefined;
};

const computeValidationWindowDays = (project: NormalizedProject, settings: AppSettings) =>
  project.analysisConfig.validationWindowDaysOverride ?? settings.workspacePolicy.analysisValidationWindowDays;

const RECOMMENDATION_TRANSITIONS: Record<
  RecommendationLifecycleState,
  RecommendationLifecycleState[]
> = {
  New: ["Under Review", "Approved", "Rejected"],
  "Under Review": ["Approved", "Rejected", "New"],
  Approved: ["In Progress", "Rejected"],
  "In Progress": ["Realized", "Rejected"],
  Realized: ["In Progress"],
  Rejected: ["Under Review"],
};

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundValue = (value: number, decimals = 2) => Number(value.toFixed(decimals));

export const toDepartmentSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getUniqueDepartments = (projects: SOPProject[]) =>
  [...new Set(projects.map((project) => project.department).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

export const getAllDepartments = (projects: SOPProject[]) => getUniqueDepartments(projects);

export const getDepartmentFromSlug = (projects: SOPProject[], departmentSlug: string) => {
  const lookup = toDepartmentSlug(departmentSlug);
  return getUniqueDepartments(projects).find((department) => toDepartmentSlug(department) === lookup) ?? null;
};

export const getAccessibleDepartments = (settings: AppSettings, projects: SOPProject[]) => {
  const departments = getUniqueDepartments(projects);
  if (departments.length === 0) {
    return settings.currentUserDepartment ? [settings.currentUserDepartment] : [];
  }
  if (settings.currentUserRole === "admin") {
    return departments;
  }
  if (settings.currentUserRole === "portfolio-viewer") {
    const scopes = (settings.portfolioDepartmentScopes ?? []).map((scope) => toDepartmentSlug(scope));
    if (scopes.includes("all") || scopes.includes("*")) return departments;
    const scoped = departments.filter((department) => scopes.includes(toDepartmentSlug(department)));
    return scoped.length > 0 ? scoped : departments;
  }
  const preferredDepartment = departments.find(
    (department) => toDepartmentSlug(department) === toDepartmentSlug(settings.currentUserDepartment)
  );
  return [preferredDepartment ?? departments[0]];
};

export const canAccessPortfolioAnalysis = (settings: AppSettings) =>
  settings.currentUserRole === "admin" || settings.currentUserRole === "portfolio-viewer";

export const canAccessDepartmentAnalysis = (
  settings: AppSettings,
  projects: SOPProject[],
  departmentName: string
) =>
  getAccessibleDepartments(settings, projects)
    .map((department) => toDepartmentSlug(department))
    .includes(toDepartmentSlug(departmentName));

export const getAnalysisLandingPath = (settings: AppSettings, projects: SOPProject[]) => {
  if (canAccessPortfolioAnalysis(settings)) return "/analysis/portfolio";
  const scopedDepartments = getAccessibleDepartments(settings, projects);
  const targetDepartment = scopedDepartments[0] ?? settings.currentUserDepartment;
  if (!targetDepartment) return "/analysis/tools";
  return `/analysis/departments/${toDepartmentSlug(targetDepartment)}`;
};

const normalizeProcessLabel = (title: string) =>
  title
    .replace(/\s+/g, " ")
    .trim()
    .replace(/master process$/i, "")
    .trim();

const getProcessNameForProject = (project: SOPProject) => {
  const normalized = normalizeProcessLabel(project.levels.L2.title);
  return normalized.length > 0 ? normalized : project.levels.L2.title;
};

const getProcessKeyForProject = (project: SOPProject) => toDepartmentSlug(getProcessNameForProject(project));

const getProcessParticipationLookup = (projects: SOPProject[]) => {
  const processMap = new Map<
    string,
    {
      processName: string;
      participatingDepartments: Set<string>;
      projectIds: Set<string>;
      primaryOwnerDepartment: string;
    }
  >();
  projects.forEach((project) => {
    const processKey = getProcessKeyForProject(project);
    const existing = processMap.get(processKey);
    if (!existing) {
      processMap.set(processKey, {
        processName: getProcessNameForProject(project),
        participatingDepartments: new Set([project.department]),
        projectIds: new Set([project.id]),
        primaryOwnerDepartment: project.department,
      });
      return;
    }
    existing.participatingDepartments.add(project.department);
    existing.projectIds.add(project.id);
    const sortedParticipants = [...existing.participatingDepartments].sort((a, b) => a.localeCompare(b));
    existing.primaryOwnerDepartment = sortedParticipants[0];
  });
  return processMap;
};

const getProjectTrend = (project: SOPProject): AnalysisTrend => {
  const finalizedRuns = [...(project.analysisState?.runs ?? [])]
    .filter((run) => run.lifecycleState === "Finalized")
    .sort((a, b) => b.createdAt - a.createdAt);
  if (finalizedRuns.length < 2) return "flat";
  const latest = finalizedRuns[0].metricsSnapshot.metrics.completionPercent;
  const previous = finalizedRuns[1].metricsSnapshot.metrics.completionPercent;
  const delta = latest - previous;
  if (delta >= 5) return "improved";
  if (delta <= -5) return "degraded";
  return "flat";
};

const getUnsyncedRequiredWorkflowCount = (project: SOPProject) =>
  getRequiredArtifactRegistry(project).filter((artifact) => {
    if (artifact.artifactType !== "workflow" || !artifact.workflowId) return false;
    return project.workflowArtifacts?.[artifact.workflowId]?.lifecycleState !== "Synced";
  }).length;

export const getProjectHealthScore = (project: SOPProject) => {
  const metrics = calculateProjectMetrics(project);
  const unsyncedRequiredWorkflowCount = getUnsyncedRequiredWorkflowCount(project);
  const governanceBlockers = evaluateGovernanceGate(project, "initialize-analysis").blockers.length;
  const completionGap = Math.max(0, 100 - metrics.completionPercent);
  const penalty =
    metrics.blockedWorkflows * 16 +
    metrics.staleWorkflows * 10 +
    unsyncedRequiredWorkflowCount * 8 +
    governanceBlockers * 6 +
    completionGap * 0.35;
  return clampValue(Math.round(100 - penalty), 0, 100);
};

const buildProjectCitations = (project: SOPProject): AnalysisCitation[] => {
  const citations: AnalysisCitation[] = [];
  citations.push({
    id: `citation:${project.id}:doc:${project.levels.L2.id}`,
    artifactType: "doc",
    sourceId: project.levels.L2.id,
    label: `${project.levels.L2.title} (L2)`,
    href: `/projects/${project.id}/docs/${project.levels.L2.id}`,
  });
  const l2Workflow = Object.values(project.workflowArtifacts ?? {}).find(
    (workflow) => workflow.level === "L2" && workflow.docId === project.levels.L2.id
  );
  if (l2Workflow) {
    citations.push({
      id: `citation:${project.id}:workflow:${l2Workflow.id}`,
      artifactType: "workflow",
      sourceId: l2Workflow.id,
      label: `${l2Workflow.title}`,
      href: `/projects/${project.id}/docs/${project.levels.L2.id}/workflow`,
    });
  }
  const latestRun = [...(project.analysisState?.runs ?? [])].sort((a, b) => b.createdAt - a.createdAt)[0];
  if (latestRun) {
    citations.push({
      id: `citation:${project.id}:analysis:${latestRun.id}`,
      artifactType: "analysis-run",
      sourceId: latestRun.id,
      label: `Analysis run #${latestRun.runNumber}`,
      href: `/projects/${project.id}/analysis`,
    });
  }
  return citations;
};

export const getProcessBottlenecks = (projects: SOPProject[]): ProcessBottleneckSummary[] => {
  const processLookup = getProcessParticipationLookup(projects);
  return projects
    .map((project) => {
      const metrics = calculateProjectMetrics(project);
      const unsyncedRequiredArtifacts = getUnsyncedRequiredWorkflowCount(project);
      const governanceBlockers = evaluateGovernanceGate(project, "initialize-analysis").blockers.length;
      const completionGap = Math.max(0, 100 - metrics.completionPercent);
      const score = clampValue(
        Math.round(
          metrics.blockedWorkflows * 22 +
            metrics.staleWorkflows * 14 +
            unsyncedRequiredArtifacts * 10 +
            governanceBlockers * 6 +
            completionGap * 0.35
        ),
        0,
        100
      );
      const severity: ProcessBottleneckSummary["severity"] =
        score >= 70 ? "high" : score >= 40 ? "medium" : "low";
      const processKey = getProcessKeyForProject(project);
      const processMetadata = processLookup.get(processKey);
      return {
        id: `bottleneck:${project.id}`,
        projectId: project.id,
        projectName: project.name,
        departmentId: toDepartmentSlug(project.department),
        departmentName: project.department,
        processKey,
        processName: processMetadata?.processName ?? getProcessNameForProject(project),
        score,
        severity,
        trend: getProjectTrend(project),
        scoreInputs: {
          blockedWorkflows: metrics.blockedWorkflows,
          staleWorkflows: metrics.staleWorkflows,
          unsyncedRequiredArtifacts,
          governanceBlockers,
          completionGap,
        },
        primaryOwnerDepartment: processMetadata?.primaryOwnerDepartment ?? project.department,
        participatingDepartments: processMetadata
          ? [...processMetadata.participatingDepartments].sort((a, b) => a.localeCompare(b))
          : [project.department],
        citations: buildProjectCitations(project),
      };
    })
    .sort((a, b) => b.score - a.score || a.projectName.localeCompare(b.projectName));
};

export const getSortedRecommendations = (
  recommendations: Record<string, AnalysisRecommendation>
): RecommendationQueueItem[] =>
  Object.values(recommendations).sort(
    (a, b) =>
      b.priorityRank - a.priorityRank ||
      b.impactScore - a.impactScore ||
      a.title.localeCompare(b.title)
  );

export const getDepartmentScorecards = (
  projects: SOPProject[],
  recommendations: Record<string, AnalysisRecommendation>
): DepartmentScorecard[] => {
  const recommendationList = Object.values(recommendations);
  return getUniqueDepartments(projects).map((department) => {
    const departmentProjects = projects.filter(
      (project) => toDepartmentSlug(project.department) === toDepartmentSlug(department)
    );
    const projectCount = departmentProjects.length;
    const healthScore =
      projectCount === 0
        ? 0
        : Math.round(
            departmentProjects.reduce((total, project) => total + getProjectHealthScore(project), 0) /
              projectCount
          );
    const improvedCount = departmentProjects.filter((project) => getProjectTrend(project) === "improved").length;
    const degradedCount = departmentProjects.filter((project) => getProjectTrend(project) === "degraded").length;
    const trend: AnalysisTrend = improvedCount > degradedCount ? "improved" : degradedCount > improvedCount ? "degraded" : "flat";
    const staleProjectCount = departmentProjects.filter((project) =>
      Object.values(project.workflowArtifacts ?? {}).some((workflow) => workflow.stale)
    ).length;
    const blockedWorkflowCount = departmentProjects.reduce(
      (total, project) =>
        total +
        Object.values(project.workflowArtifacts ?? {}).filter((workflow) => workflow.blocked).length,
      0
    );
    const unresolvedRecommendations = recommendationList.filter(
      (recommendation) =>
        recommendation.departmentId === toDepartmentSlug(department) &&
        recommendation.lifecycleState !== "Realized" &&
        recommendation.lifecycleState !== "Rejected"
    ).length;
    return {
      departmentId: toDepartmentSlug(department),
      departmentName: department,
      projectCount,
      healthScore,
      trend,
      staleProjectCount,
      blockedWorkflowCount,
      unresolvedRecommendations,
    };
  });
};

export const getRevalidationQueue = (projects: SOPProject[]): RevalidationQueueItem[] =>
  projects
    .map((project) => {
      const metrics = calculateProjectMetrics(project);
      const hasStaleWorkflows = metrics.staleWorkflows > 0;
      const hasBlockedWorkflows = metrics.blockedWorkflows > 0;
      const activeRun = getActiveAnalysisRun(project);
      if (!hasStaleWorkflows && !hasBlockedWorkflows && !activeRun) return null;
      const staleSince = activeRun?.updatedAt ?? Date.now() - 24 * 60 * 60 * 1000;
      const urgency: RevalidationQueueItem["urgency"] = hasBlockedWorkflows
        ? "high"
        : hasStaleWorkflows
          ? "medium"
          : "low";
      const reason = hasBlockedWorkflows
        ? "Blocked workflow synchronization requires review."
        : hasStaleWorkflows
          ? "Stale workflow artifacts detected."
          : "Analysis run is active and pending revalidation.";
      return {
        id: `revalidation:${project.id}`,
        projectId: project.id,
        projectName: project.name,
        departmentId: toDepartmentSlug(project.department),
        departmentName: project.department,
        reason,
        staleSince,
        urgency,
      } satisfies RevalidationQueueItem;
    })
    .filter((item): item is RevalidationQueueItem => !!item)
    .sort((a, b) => {
      const urgencyRank = { high: 0, medium: 1, low: 2 };
      return urgencyRank[a.urgency] - urgencyRank[b.urgency] || a.projectName.localeCompare(b.projectName);
    });

export const getPortfolioScorecard = (
  projects: SOPProject[],
  departmentScorecards: DepartmentScorecard[],
  revalidationQueue: RevalidationQueueItem[]
): PortfolioScorecard => {
  const avgHealthScore =
    projects.length === 0
      ? 0
      : Math.round(projects.reduce((total, project) => total + getProjectHealthScore(project), 0) / projects.length);
  return {
    projectCount: projects.length,
    departmentCount: departmentScorecards.length,
    avgHealthScore,
    improvedDepartmentCount: departmentScorecards.filter((scorecard) => scorecard.trend === "improved").length,
    degradedDepartmentCount: departmentScorecards.filter((scorecard) => scorecard.trend === "degraded").length,
    revalidationCount: revalidationQueue.length,
  };
};

export const buildPortfolioAnalysisDashboard = (
  projects: SOPProject[],
  recommendations: Record<string, AnalysisRecommendation>
): PortfolioAnalysisDashboard => {
  const departmentScorecards = getDepartmentScorecards(projects, recommendations);
  const bottlenecks = getProcessBottlenecks(projects);
  const revalidationQueue = getRevalidationQueue(projects);
  return {
    portfolioScorecard: getPortfolioScorecard(projects, departmentScorecards, revalidationQueue),
    departmentScorecards,
    bottlenecks,
    opportunityQueue: getSortedRecommendations(recommendations),
    revalidationQueue,
  };
};

export const buildDepartmentAnalysisDashboard = (
  projects: SOPProject[],
  recommendations: Record<string, AnalysisRecommendation>,
  departmentName: string
): DepartmentAnalysisDashboard => {
  const departmentId = toDepartmentSlug(departmentName);
  const departmentProjects = projects.filter(
    (project) => toDepartmentSlug(project.department) === departmentId
  );
  const scorecard =
    getDepartmentScorecards(projects, recommendations).find(
      (departmentScorecard) => departmentScorecard.departmentId === departmentId
    ) ?? {
      departmentId,
      departmentName,
      projectCount: 0,
      healthScore: 0,
      trend: "flat",
      staleProjectCount: 0,
      blockedWorkflowCount: 0,
      unresolvedRecommendations: 0,
    };
  const projectIds = new Set(departmentProjects.map((project) => project.id));
  return {
    scorecard,
    bottlenecks: getProcessBottlenecks(projects).filter((bottleneck) =>
      projectIds.has(bottleneck.projectId)
    ),
    recommendations: getSortedRecommendations(recommendations).filter(
      (recommendation) => recommendation.departmentId === departmentId
    ),
    revalidationQueue: getRevalidationQueue(projects).filter(
      (queueItem) => queueItem.departmentId === departmentId
    ),
  };
};

export const filterToolsRegistry = (
  toolsRegistry: AnalysisToolRegistryEntry[],
  filters: { department?: string; status?: ToolRegistryStatus | "all" }
) =>
  toolsRegistry.filter((tool) => {
    const matchesDepartment =
      !filters.department ||
      filters.department === "all" ||
      toDepartmentSlug(tool.ownerDepartment ?? "unassigned") === toDepartmentSlug(filters.department);
    const matchesStatus = !filters.status || filters.status === "all" || tool.status === filters.status;
    return matchesDepartment && matchesStatus;
  });

const isValidRecommendationTransition = (
  current: RecommendationLifecycleState,
  next: RecommendationLifecycleState
) => current === next || RECOMMENDATION_TRANSITIONS[current]?.includes(next) === true;

const createRecommendationActionSnapshot = (
  recommendation: AnalysisRecommendation
): AnalysisRecommendationActionSnapshot => ({
  recommendationId: recommendation.id,
  title: recommendation.title,
  summary: recommendation.summary,
  ownerDepartment: recommendation.departmentName,
  priorityRank: recommendation.priorityRank,
  citations: recommendation.citations,
  sourceRunIds: recommendation.sourceRunIds,
});

const generateAnalysisRecommendations = (
  projects: SOPProject[],
  existingRecommendations: Record<string, AnalysisRecommendation>,
  timestamp: number
) => {
  const bottlenecks = getProcessBottlenecks(projects);
  const nextRecommendations: Record<string, AnalysisRecommendation> = {};
  bottlenecks.forEach((bottleneck) => {
    const project = projects.find((candidateProject) => candidateProject.id === bottleneck.projectId);
    if (!project) return;
    const recommendationId = `recommendation:${project.id}:${bottleneck.processKey}`;
    const existingRecommendation = existingRecommendations[recommendationId];
    const metrics = calculateProjectMetrics(project);
    const impactScore = clampValue(Math.round(bottleneck.score / 10), 1, 10);
    const effortScore = clampValue(5 - Math.floor(metrics.completionPercent / 25), 1, 5);
    const effortNormalized = roundValue((6 - effortScore) / 5, 2);
    const confidenceScore = roundValue(
      0.55 +
        Math.min(0.3, bottleneck.citations.length * 0.1) +
        (bottleneck.trend === "flat" ? 0.03 : 0.07),
      2
    );
    const confidenceModifier = roundValue(0.8 + confidenceScore * 0.25, 2);
    const priorityRank = roundValue(impactScore * effortNormalized * confidenceModifier, 3);
    const sourceRunIds = [...(project.analysisState?.runs ?? [])]
      .filter((run) => run.lifecycleState === "Finalized")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 2)
      .map((run) => run.id);
    if (bottleneck.citations.length === 0) {
      throw new Error(`Recommendation ${recommendationId} is missing required citations.`);
    }
    nextRecommendations[recommendationId] = {
      id: recommendationId,
      projectId: project.id,
      projectName: project.name,
      departmentId: toDepartmentSlug(project.department),
      departmentName: project.department,
      title: `Reduce bottlenecks for ${project.name}`,
      summary:
        bottleneck.scoreInputs.blockedWorkflows > 0
          ? "Prioritize blocked workflow synchronization and finalize linked approvals."
          : "Address stale workflow artifacts and improve completion consistency for required SOP assets.",
      citations: bottleneck.citations,
      impactScore,
      effortScore,
      effortNormalized,
      confidenceScore,
      confidenceModifier,
      priorityRank,
      lifecycleState: existingRecommendation?.lifecycleState ?? "New",
      sourceRunIds,
      processKey: bottleneck.processKey,
      processName: bottleneck.processName,
      primaryOwnerDepartment: bottleneck.primaryOwnerDepartment,
      participatingDepartments: bottleneck.participatingDepartments,
      createdAt: existingRecommendation?.createdAt ?? timestamp,
      updatedAt: timestamp,
      reviewedBy: existingRecommendation?.reviewedBy,
      reviewedAt: existingRecommendation?.reviewedAt,
      reviewRationale: existingRecommendation?.reviewRationale,
      approvedSnapshot: existingRecommendation?.approvedSnapshot,
      actionLinkage: existingRecommendation?.actionLinkage,
    };
  });
  return nextRecommendations;
};

export const getCapabilitiesForRole = (role: UserRole, settings: AppSettings): Capabilities => {
  if (role === "admin") {
    return {
      canEditDocs: true,
      canApplyProposals: true,
      canFinalizeDocs: true,
      canFinalizeProject: true,
      canManageStructure: true,
      canManagePolicies: true,
      canRegenerateWorkflows: true,
      canSubmitWorkflowProof: true,
      canVerifyWorkflowSync: true,
      canInitializeAnalysis: true,
      canCancelAnalysis: true,
      canSignoffAnalysis: true,
      canRefreshAnalysisMetrics: true,
      canViewPortfolioAnalysis: true,
      canViewDepartmentAnalysis: true,
      canApproveRecommendations: true,
      canRefreshAnalysisHub: true,
    };
  }

  if (role === "editor") {
    return {
      canEditDocs: true,
      canApplyProposals: true,
      canFinalizeDocs: true,
      canFinalizeProject: settings.workspacePolicy.allowNonAdminFinalizeProject,
      canManageStructure: false,
      canManagePolicies: false,
      canRegenerateWorkflows: true,
      canSubmitWorkflowProof: true,
      canVerifyWorkflowSync: false,
      canInitializeAnalysis: true,
      canCancelAnalysis: false,
      canSignoffAnalysis: false,
      canRefreshAnalysisMetrics: false,
      canViewPortfolioAnalysis: false,
      canViewDepartmentAnalysis: true,
      canApproveRecommendations: true,
      canRefreshAnalysisHub: true,
    };
  }

  if (role === "portfolio-viewer") {
    return {
      canEditDocs: false,
      canApplyProposals: false,
      canFinalizeDocs: false,
      canFinalizeProject: false,
      canManageStructure: false,
      canManagePolicies: false,
      canRegenerateWorkflows: false,
      canSubmitWorkflowProof: false,
      canVerifyWorkflowSync: false,
      canInitializeAnalysis: false,
      canCancelAnalysis: false,
      canSignoffAnalysis: false,
      canRefreshAnalysisMetrics: false,
      canViewPortfolioAnalysis: true,
      canViewDepartmentAnalysis: true,
      canApproveRecommendations: false,
      canRefreshAnalysisHub: true,
    };
  }

  if (role === "stakeholder") {
    return {
      canEditDocs: false,
      canApplyProposals: false,
      canFinalizeDocs: false,
      canFinalizeProject: false,
      canManageStructure: false,
      canManagePolicies: false,
      canRegenerateWorkflows: false,
      canSubmitWorkflowProof: false,
      canVerifyWorkflowSync: false,
      canInitializeAnalysis: false,
      canCancelAnalysis: false,
      canSignoffAnalysis: false,
      canRefreshAnalysisMetrics: false,
      canViewPortfolioAnalysis: false,
      canViewDepartmentAnalysis: true,
      canApproveRecommendations: false,
      canRefreshAnalysisHub: false,
    };
  }

  return {
    canEditDocs: false,
    canApplyProposals: false,
    canFinalizeDocs: false,
    canFinalizeProject: false,
    canManageStructure: false,
    canManagePolicies: false,
    canRegenerateWorkflows: false,
    canSubmitWorkflowProof: false,
    canVerifyWorkflowSync: false,
    canInitializeAnalysis: false,
    canCancelAnalysis: false,
    canSignoffAnalysis: false,
    canRefreshAnalysisMetrics: false,
    canViewPortfolioAnalysis: false,
    canViewDepartmentAnalysis: true,
    canApproveRecommendations: false,
    canRefreshAnalysisHub: false,
  };
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      employees: [],
      settings: DEFAULT_SETTINGS,
      analysisHubRecommendations: {},
      analysisHubRefreshMetadata: DEFAULT_ANALYSIS_HUB_REFRESH_METADATA,
      toolsRegistry: DEFAULT_TOOLS_REGISTRY,
      projectUIPreferences: {},
      projectsDashboardState: DEFAULT_DASHBOARD_STATE,
      lastWorkspaceNotice: null,

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, normalizeProject(project)],
          projectUIPreferences: ensureProjectPreferences(state.projectUIPreferences, project.id),
        })),
      updateProject: (id, updates) =>
        set((state) => {
          const attemptedWorkflowMutation = Object.prototype.hasOwnProperty.call(
            updates,
            "workflowArtifacts"
          );
          const { workflowArtifacts: ignoredWorkflowArtifacts, ...safeUpdates } = updates;
          void ignoredWorkflowArtifacts;
          return {
            projects: state.projects.map((project) =>
              project.id === id ? normalizeProject({ ...project, ...safeUpdates }) : project
            ),
            lastWorkspaceNotice: attemptedWorkflowMutation
              ? "Workflow ClickUp URLs are integration-managed and cannot be edited directly."
              : state.lastWorkspaceNotice,
          };
        }),
      deleteProject: (id) =>
        set((state) => {
          const nextPreferences = { ...state.projectUIPreferences };
          delete nextPreferences[id];
          return {
            projects: state.projects.filter((project) => project.id !== id),
            currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
            projectUIPreferences: nextPreferences,
          };
        }),
      setCurrentProject: (id) => set({ currentProjectId: id }),
      markProjectSetupComplete: (projectId) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, setupCompleted: true } : project
          ),
        })),
      setProjectLifecycle: (projectId, lifecycle) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, lifecycle } : project
          ),
        })),
      finalizeProjectWithGovernance: (projectId, actor = get().settings.currentUserRole) => {
        let finalized = false;
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          const projects = state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const gate = evaluateGovernanceGate(nextProject, "finalize-project");
            if (!gate.ready) {
              nextNotice = gate.blockers[0]?.message ?? "Project cannot be finalized yet.";
              return nextProject;
            }
            nextProject.lifecycle = "finalized";
            nextProject.status = "done";
            finalized = true;
            appendAudit(nextProject, {
              type: "project.finalized",
              actor,
              reason: "Governance gate passed",
            });
            return { ...nextProject };
          });
          return { projects, lastWorkspaceNotice: nextNotice };
        });
        return finalized;
      },
      setProjectPathComplexity: (projectId, complexity) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? normalizeProject({ ...project, pathComplexity: complexity }) : project
          ),
        })),

      addEmployee: (employee) => set((state) => ({ employees: [...state.employees, employee] })),
      updateEmployee: (id, updates) =>
        set((state) => ({
          employees: state.employees.map((employee) =>
            employee.id === id ? { ...employee, ...updates } : employee
          ),
        })),
      removeEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((employee) => employee.id !== id),
        })),

      updateSettings: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...updates,
          },
        })),
      setSettingsTab: (tab) =>
        set((state) => ({
          settings: {
            ...state.settings,
            activeSettingsTab: tab,
          },
        })),
      setUserRole: (role) =>
        set((state) => ({
          settings: {
            ...state.settings,
            currentUserRole: role,
          },
        })),

      updateProjectDashboardState: (updates) =>
        set((state) => ({
          projectsDashboardState: { ...state.projectsDashboardState, ...updates },
        })),
      setProjectScrollTop: (scrollTop) =>
        set((state) => ({
          projectsDashboardState: { ...state.projectsDashboardState, scrollTop },
        })),
      setWorkspaceNotice: (notice) => set({ lastWorkspaceNotice: notice }),

      setLastOpenedDoc: (projectId, docId) =>
        set((state) => {
          const nextPreferences = ensureProjectPreferences(state.projectUIPreferences, projectId);
          return {
            projectUIPreferences: {
              ...nextPreferences,
              [projectId]: {
                ...nextPreferences[projectId],
                lastOpenedDocId: docId,
              },
            },
          };
        }),
      setPaneWidths: (projectId, widths) =>
        set((state) => {
          const nextPreferences = ensureProjectPreferences(state.projectUIPreferences, projectId);
          return {
            projectUIPreferences: {
              ...nextPreferences,
              [projectId]: {
                ...nextPreferences[projectId],
                paneWidths: widths,
              },
            },
          };
        }),
      setLastMobilePane: (projectId, pane) =>
        set((state) => {
          const nextPreferences = ensureProjectPreferences(state.projectUIPreferences, projectId);
          return {
            projectUIPreferences: {
              ...nextPreferences,
              [projectId]: {
                ...nextPreferences[projectId],
                lastMobilePane: pane,
              },
            },
          };
        }),
      setCenterPaneMode: (projectId, docId, mode) =>
        set((state) => {
          const nextPreferences = ensureProjectPreferences(state.projectUIPreferences, projectId);
          return {
            projectUIPreferences: {
              ...nextPreferences,
              [projectId]: {
                ...nextPreferences[projectId],
                centerPaneModeByDocId: {
                  ...(nextPreferences[projectId].centerPaneModeByDocId ?? {}),
                  [docId]: mode,
                },
              },
            },
          };
        }),
      appendDocHistory: (projectId, docId) =>
        set((state) => {
          const nextPreferences = ensureProjectPreferences(state.projectUIPreferences, projectId);
          const currentHistory = nextPreferences[projectId].docHistory;
          const nextHistory =
            currentHistory[currentHistory.length - 1] === docId
              ? currentHistory
              : [...currentHistory, docId].slice(-40);
          return {
            projectUIPreferences: {
              ...nextPreferences,
              [projectId]: {
                ...nextPreferences[projectId],
                docHistory: nextHistory,
              },
            },
          };
        }),
      clearDocHistory: (projectId) =>
        set((state) => {
          const nextPreferences = ensureProjectPreferences(state.projectUIPreferences, projectId);
          return {
            projectUIPreferences: {
              ...nextPreferences,
              [projectId]: {
                ...nextPreferences[projectId],
                docHistory: [],
              },
            },
          };
        }),

      updateDoc: (projectId, level, docId, updates) =>
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              const targetDocId =
                level === "L1" ? nextProject.levels.L1.id : level === "L2" ? nextProject.levels.L2.id : docId;
              if (isDocFrozenForAnalysis(nextProject, targetDocId)) {
                nextNotice = "Required artifacts are frozen while analysis is active.";
                return nextProject;
              }

              if (level === "L1" || level === "L2") {
                nextProject.levels[level] = { ...nextProject.levels[level], ...updates };
              } else {
                nextProject.levels[level] = nextProject.levels[level].map((doc) =>
                  doc.id === docId ? { ...doc, ...updates } : doc
                );
              }
              registerDocMutation(nextProject, targetDocId, state.settings.currentUserRole, "Document updated");
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        }),
      setDraftContent: (projectId, docId, updates, source = "manual") =>
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              if (isDocFrozenForAnalysis(nextProject, docId)) {
                nextNotice = "Draft edits are blocked while required artifacts are frozen.";
                return nextProject;
              }
              const workspace = nextProject.docWorkspace[docId];
              if (!workspace) return nextProject;

              workspace.draftTitle = updates.title ?? workspace.draftTitle;
              workspace.draftContent = updates.content ?? workspace.draftContent;
              workspace.dirty =
                workspace.draftTitle !== (findDocById(nextProject, docId)?.title ?? workspace.draftTitle) ||
                workspace.draftContent !==
                  (findDocById(nextProject, docId)?.content ?? workspace.draftContent);
              workspace.lastUpdatedAt = Date.now();

              if (source === "manual") {
                workspace.proposals = workspace.proposals.map((proposal) =>
                  proposal.status === "pending" && proposal.conflictKey === "content"
                    ? { ...proposal, status: "invalidated" }
                    : proposal
                );
              }
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        }),
      discardDraft: (projectId, docId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const doc = findDocById(nextProject, docId);
            if (!doc) return nextProject;
            const workspace = nextProject.docWorkspace[docId];
            workspace.draftTitle = doc.title;
            workspace.draftContent = doc.content;
            workspace.dirty = false;
            workspace.lastUpdatedAt = Date.now();
            return { ...nextProject };
          }),
        })),
      commitRevision: (projectId, docId) =>
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              if (isDocFrozenForAnalysis(nextProject, docId)) {
                nextNotice = "Cannot commit revisions while required artifacts are frozen.";
                return nextProject;
              }
              const doc = findDocById(nextProject, docId);
              if (!doc) return nextProject;
              const workspace = nextProject.docWorkspace[docId];

              const nextTitle = workspace.draftTitle.trim() || doc.title;
              const nextContent = workspace.draftContent;
              doc.title = nextTitle;
              doc.content = nextContent;
              workspace.revisions = [
                {
                  id: cryptoSafeId(),
                  title: nextTitle,
                  content: nextContent,
                  committedAt: Date.now(),
                  authorRole: "user",
                },
                ...workspace.revisions,
              ];
              workspace.dirty = false;
              workspace.lastUpdatedAt = Date.now();
              registerDocMutation(
                nextProject,
                docId,
                state.settings.currentUserRole,
                "Document revision committed"
              );
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        }),
      restoreRevision: (projectId, docId, revisionId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            const revision = workspace.revisions.find((item) => item.id === revisionId);
            if (!revision) return nextProject;

            workspace.draftTitle = revision.title;
            workspace.draftContent = revision.content;
            workspace.dirty = true;
            workspace.lastUpdatedAt = Date.now();
            return { ...nextProject };
          }),
        })),
      finalizeDoc: (projectId, docId) =>
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              if (isDocFrozenForAnalysis(nextProject, docId)) {
                nextNotice = "Cannot finalize docs while analysis freeze is active.";
                return nextProject;
              }
              const workspace = nextProject.docWorkspace[docId];
              if (!workspace) return nextProject;
              workspace.finalized = true;
              workspace.finalizedAt = Date.now();
              workspace.dirty = false;

              if (state.settings.workspacePolicy.autoArchiveThreadsOnFinalize) {
                workspace.threadHistory = [
                  ...workspace.threadHistory,
                  {
                    ...workspace.activeThread,
                    status: "archived",
                    closedAt: Date.now(),
                  },
                ];
                workspace.activeThread = createThread();
              }

              const allFinalized = getProjectDocIds(nextProject).every(
                (candidateDocId) => nextProject.docWorkspace[candidateDocId]?.finalized
              );
              nextProject.lifecycle = allFinalized ? "ready-to-close" : nextProject.lifecycle;
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        }),
      createRevisionThread: (projectId, docId) =>
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              if (isDocFrozenForAnalysis(nextProject, docId)) {
                nextNotice = "Cannot reopen finalized docs while analysis freeze is active.";
                return nextProject;
              }
              const workspace = nextProject.docWorkspace[docId];
              if (!workspace) return nextProject;
              workspace.finalized = false;
              workspace.finalizedAt = undefined;
              workspace.threadHistory = [
                ...workspace.threadHistory,
                {
                  ...workspace.activeThread,
                  status: "archived",
                  closedAt: Date.now(),
                },
              ];
              workspace.activeThread = createThread();
              registerDocMutation(
                nextProject,
                docId,
                state.settings.currentUserRole,
                "Revision thread created for finalized doc"
              );
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        }),

      addMessage: (projectId, message) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  interviewHistory: [...project.interviewHistory, message],
                }
              : project
          ),
        })),
      setUnderstanding: (projectId, value) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, understanding: value } : project
          ),
        })),
      addDocMessage: (projectId, docId, message) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            workspace.activeThread.messages = [
              ...workspace.activeThread.messages,
              { ...message, id: cryptoSafeId(), timestamp: Date.now() },
            ];
            workspace.lastUpdatedAt = Date.now();
            return { ...nextProject };
          }),
        })),

      addProposal: (projectId, docId, proposal) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            workspace.proposals = [
              ...workspace.proposals,
              { ...proposal, id: cryptoSafeId(), createdAt: Date.now() },
            ];
            return { ...nextProject };
          }),
        })),
      applyProposal: (projectId, docId, proposalId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            const proposal = workspace.proposals.find((item) => item.id === proposalId);
            if (!proposal || proposal.status !== "pending") return nextProject;

            if (proposal.targetField === "title") {
              workspace.draftTitle = proposal.contentPatch;
            } else {
              workspace.draftContent = proposal.contentPatch;
            }
            workspace.dirty = true;
            workspace.proposals = workspace.proposals.map((item) =>
              item.id === proposalId ? { ...item, status: "applied" } : item
            );
            return { ...nextProject };
          }),
        })),
      rejectProposal: (projectId, docId, proposalId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            workspace.proposals = workspace.proposals.map((proposal) =>
              proposal.id === proposalId ? { ...proposal, status: "rejected" } : proposal
            );
            return { ...nextProject };
          }),
        })),
      applyAllNonConflictingProposals: (projectId, docId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            workspace.proposals.forEach((proposal) => {
              if (proposal.status !== "pending") return;
              if (proposal.targetField === "title") {
                workspace.draftTitle = proposal.contentPatch;
              } else {
                workspace.draftContent = proposal.contentPatch;
              }
            });
            workspace.proposals = workspace.proposals.map((proposal) =>
              proposal.status === "pending" ? { ...proposal, status: "applied" } : proposal
            );
            workspace.dirty = true;
            return { ...nextProject };
          }),
        })),
      rejectAllProposals: (projectId, docId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            workspace.proposals = workspace.proposals.map((proposal) =>
              proposal.status === "pending" ? { ...proposal, status: "rejected" } : proposal
            );
            return { ...nextProject };
          }),
        })),
      invalidateConflictingProposals: (projectId, docId, conflictKey) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            workspace.proposals = workspace.proposals.map((proposal) =>
              proposal.status === "pending" && proposal.conflictKey === conflictKey
                ? { ...proposal, status: "invalidated" }
                : proposal
            );
            return { ...nextProject };
          }),
        })),
      archiveActiveThread: (projectId, docId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workspace = nextProject.docWorkspace[docId];
            if (!workspace) return nextProject;
            workspace.threadHistory = [
              ...workspace.threadHistory,
              {
                ...workspace.activeThread,
                status: "archived",
                closedAt: Date.now(),
              },
            ];
            workspace.activeThread = createThread();
            return { ...nextProject };
          }),
        })),

      duplicateDoc: (projectId, docId) => {
        const project = get().projects.find((candidate) => candidate.id === projectId);
        if (!project) return null;
        const sourceDoc = findDocById(project, docId);
        if (!sourceDoc) return null;
        if (isDocFrozenForAnalysis(project, docId)) return null;
        const duplicate: LevelDoc = {
          ...sourceDoc,
          id: cryptoSafeId(),
          title: `${sourceDoc.title} (Copy)`,
          status: "todo",
          scribeChecked: false,
        };
        set((state) => ({
          projects: state.projects.map((candidateProject) => {
            if (candidateProject.id !== projectId) return candidateProject;
            const nextProject = normalizeProject(candidateProject);
            nextProject.levels.L4 = [...nextProject.levels.L4, duplicate];
            nextProject.docWorkspace[duplicate.id] = createDocWorkspace(duplicate);
            registerDocMutation(nextProject, sourceDoc.id, state.settings.currentUserRole, "Procedure duplicated");
            return normalizeProject({ ...nextProject });
          }),
        }));
        return duplicate.id;
      },
      moveDocToStage: (projectId, docId, stageId) =>
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              if (isDocFrozenForAnalysis(nextProject, docId)) {
                nextNotice = "Cannot move documents while analysis freeze is active.";
                return nextProject;
              }
              nextProject.levels.L4 = nextProject.levels.L4.map((doc) =>
                doc.id === docId ? { ...doc, parentStageId: stageId } : doc
              );
              registerDocMutation(
                nextProject,
                docId,
                state.settings.currentUserRole,
                "Procedure moved between stages"
              );
              return normalizeProject({ ...nextProject });
            }),
            lastWorkspaceNotice: nextNotice,
          };
        }),
      deleteDoc: (projectId, docId) => {
        const project = get().projects.find((candidate) => candidate.id === projectId);
        if (!project) return { deletedDoc: null, nextDocId: null };
        const doc = findDocById(project, docId);
        if (!doc) return { deletedDoc: null, nextDocId: null };
        if (isDocFrozenForAnalysis(project, docId)) return { deletedDoc: null, nextDocId: null };
        const siblingDocs = project.levels.L4.filter((candidate) => candidate.id !== docId);
        const nextDocId = siblingDocs[0]?.id ?? project.levels.L2.id;
        set((state) => ({
          projects: state.projects.map((candidateProject) => {
            if (candidateProject.id !== projectId) return candidateProject;
            const nextProject = normalizeProject(candidateProject);
            registerDocMutation(nextProject, docId, state.settings.currentUserRole, "Procedure deleted");
            nextProject.levels.L4 = nextProject.levels.L4.filter((candidate) => candidate.id !== docId);
            delete nextProject.docWorkspace[docId];
            return normalizeProject({ ...nextProject });
          }),
        }));
        return { deletedDoc: doc, nextDocId };
      },
      restoreDeletedDoc: (projectId, doc) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            nextProject.levels.L4 = [...nextProject.levels.L4, doc];
            nextProject.docWorkspace[doc.id] = createDocWorkspace(doc);
            registerDocMutation(
              nextProject,
              doc.id,
              state.settings.currentUserRole,
              "Deleted procedure restored"
            );
            return normalizeProject({ ...nextProject });
          }),
        })),

      setRequiredArtifactOverride: (projectId, input) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            if (input.reason.trim().length === 0) return nextProject;
            if (input.action === "remove" && !input.executiveSponsorApprovedBy) return nextProject;
            const override: RequiredArtifactOverride = {
              id: `override-${cryptoSafeId()}`,
              targetId: input.targetId,
              action: input.action,
              reason: input.reason,
              requestedBy: input.actor ?? state.settings.currentUserRole,
              requestedAt: Date.now(),
              executiveSponsorApprovedBy: input.executiveSponsorApprovedBy,
              approvedAt: input.executiveSponsorApprovedBy ? Date.now() : undefined,
            };
            nextProject.requiredArtifactOverrides = [...nextProject.requiredArtifactOverrides, override];
            appendAudit(nextProject, {
              type: "required-artifact.override-set",
              actor: override.requestedBy,
              reason: override.reason,
              metadata: {
                action: override.action,
                targetId: override.targetId,
                sponsorApproval: override.executiveSponsorApprovedBy ?? null,
              },
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },

      generateWorkflow: (projectId, workflowId, actor = get().settings.currentUserRole) => {
        let generated = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workflow = nextProject.workflowArtifacts[workflowId];
            if (!workflow) return nextProject;
            if (!isWorkflowDependencySatisfied(nextProject, workflow)) {
              workflow.blocked = true;
              workflow.blockedReason = "Dependencies are missing current versions.";
              appendAudit(nextProject, {
                type: "workflow.generation-blocked",
                actor,
                reason: workflow.blockedReason,
                metadata: { workflowId },
              });
              return { ...nextProject };
            }
            createWorkflowVersion(workflow, actor, "generate", "Manual generation request", workflow.childArtifactIds);
            appendAudit(nextProject, {
              type: "workflow.generated",
              actor,
              metadata: { workflowId, source: "generate" },
            });
            generated = true;
            return { ...nextProject };
          }),
        }));
        return generated;
      },
      regenerateWorkflowFromChildren: (
        projectId,
        workflowId,
        actor = get().settings.currentUserRole
      ) => {
        let regenerated = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workflow = nextProject.workflowArtifacts[workflowId];
            if (!workflow) return nextProject;
            if (!isWorkflowDependencySatisfied(nextProject, workflow)) {
              workflow.blocked = true;
              workflow.blockedReason = "Cannot regenerate because dependency versions are missing.";
              appendAudit(nextProject, {
                type: "workflow.regeneration-blocked",
                actor,
                reason: workflow.blockedReason,
                metadata: { workflowId },
              });
              return { ...nextProject };
            }
            createWorkflowVersion(
              workflow,
              actor,
              "regenerate",
              "Regenerated from child artifacts",
              workflow.childArtifactIds
            );
            appendAudit(nextProject, {
              type: "workflow.regenerated",
              actor,
              metadata: { workflowId },
            });
            regenerated = true;
            return { ...nextProject };
          }),
        }));
        return regenerated;
      },
      regenerateAllStaleWorkflows: (projectId, actor = get().settings.currentUserRole) => {
        const result = {
          regenerated: 0,
          blocked: 0,
          unchanged: 0,
          blockedWorkflowIds: [] as string[],
        };
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workflows = Object.values(nextProject.workflowArtifacts).sort(
              (a, b) =>
                WORKFLOW_LEVEL_ORDER.indexOf(a.level) - WORKFLOW_LEVEL_ORDER.indexOf(b.level)
            );
            workflows.forEach((workflow) => {
              if (!workflow.stale) {
                result.unchanged += 1;
                return;
              }
              if (!isWorkflowDependencySatisfied(nextProject, workflow)) {
                workflow.blocked = true;
                workflow.blockedReason =
                  "Blocked during bulk regeneration: missing dependency version(s).";
                result.blocked += 1;
                result.blockedWorkflowIds.push(workflow.id);
                return;
              }
              createWorkflowVersion(
                workflow,
                actor,
                "regenerate",
                "Bulk stale workflow regeneration",
                workflow.childArtifactIds
              );
              result.regenerated += 1;
            });
            appendAudit(nextProject, {
              type: "workflow.bulk-regeneration",
              actor,
              metadata: {
                regenerated: result.regenerated,
                blocked: result.blocked,
                unchanged: result.unchanged,
              },
            });
            return { ...nextProject };
          }),
        }));
        return result;
      },
      submitWorkflowProof: (projectId, workflowId, input) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workflow = nextProject.workflowArtifacts[workflowId];
            if (!workflow) return nextProject;
            const actor = input.actor ?? state.settings.currentUserRole;
            workflow.proof = {
              reviewedChanges: input.reviewedChanges,
              clickupUpdated: input.clickupUpdated,
              embedVerified: input.embedVerified,
              notes: input.notes,
              submittedAt: Date.now(),
              submittedBy: actor,
            };
            const proofComplete =
              workflow.proof.reviewedChanges &&
              workflow.proof.clickupUpdated &&
              workflow.proof.embedVerified;
            workflow.lifecycleState = proofComplete
              ? "Needs ClickUp Update"
              : "Generated (Needs Review)";
            workflow.syncStatus = proofComplete ? "ready-for-verification" : "pending-proof";
            workflow.blocked = false;
            workflow.blockedReason = undefined;
            appendAudit(nextProject, {
              type: "workflow.proof-submitted",
              actor,
              metadata: { workflowId, proofComplete },
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },
      verifyWorkflowSync: (projectId, workflowId, input) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workflow = nextProject.workflowArtifacts[workflowId];
            if (!workflow) return nextProject;
            const actor = input.actor ?? state.settings.currentUserRole;
            const proofComplete =
              workflow.proof?.reviewedChanges &&
              workflow.proof?.clickupUpdated &&
              workflow.proof?.embedVerified;
            if (!input.approved) {
              workflow.blocked = true;
              workflow.blockedReason = input.reason ?? "Admin verification rejected.";
              workflow.lifecycleState = "Needs ClickUp Update";
              appendAudit(nextProject, {
                type: "workflow.sync-verification-rejected",
                actor,
                reason: workflow.blockedReason,
                metadata: { workflowId },
              });
              return { ...nextProject };
            }
            if (!proofComplete) {
              workflow.blocked = true;
              workflow.blockedReason = "Proof checklist is incomplete.";
              return { ...nextProject };
            }
            if (!workflow.clickupResourceId || !workflow.clickupUrl) {
              workflow.blocked = true;
              workflow.blockedReason = "Missing canonical ClickUp resource proof.";
              return { ...nextProject };
            }
            if (workflow.linkHealthStatus !== "Valid") {
              workflow.blocked = true;
              workflow.blockedReason = `Link health must be Valid, currently ${workflow.linkHealthStatus}.`;
              return { ...nextProject };
            }
            workflow.lifecycleState = "Synced";
            workflow.syncStatus = "synced";
            workflow.stale = false;
            workflow.blocked = false;
            workflow.blockedReason = undefined;
            workflow.lastSyncedAt = Date.now();
            workflow.lastSyncedBy = actor;
            workflow.proof = {
              ...workflow.proof!,
              adminVerifiedAt: Date.now(),
              adminVerifiedBy: actor,
            };
            if (workflow.currentVersionId) {
              workflow.lastSyncedVersionId = workflow.currentVersionId;
              workflow.versions = workflow.versions.map((version) =>
                version.id === workflow.currentVersionId
                  ? { ...version, syncedAt: Date.now(), syncedBy: actor }
                  : version
              );
            }
            appendAudit(nextProject, {
              type: "workflow.synced",
              actor,
              metadata: { workflowId },
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },
      setWorkflowClickupResource: (projectId, workflowId, payload) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workflow = nextProject.workflowArtifacts[workflowId];
            if (!workflow) return nextProject;
            const actor = payload.actor ?? state.settings.currentUserRole;
            workflow.clickupResourceType = payload.clickupResourceType;
            workflow.clickupResourceId = payload.clickupResourceId;
            workflow.clickupUrl = payload.clickupUrl;
            const link = evaluateLinkHealthFromUrl(payload.clickupUrl);
            workflow.linkHealthStatus = link.status;
            workflow.linkHealthReason = link.reason;
            workflow.linkHealthCheckedAt = Date.now();
            appendAudit(nextProject, {
              type: "workflow.clickup-resource-linked",
              actor,
              metadata: {
                workflowId,
                clickupResourceType: payload.clickupResourceType,
                clickupResourceId: payload.clickupResourceId,
              },
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },
      setWorkflowLinkHealthStatus: (
        projectId,
        workflowId,
        status,
        reason,
        actor = get().settings.currentUserRole
      ) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const workflow = nextProject.workflowArtifacts[workflowId];
            if (!workflow) return nextProject;
            workflow.linkHealthStatus = status;
            workflow.linkHealthReason = reason;
            workflow.linkHealthCheckedAt = Date.now();
            appendAudit(nextProject, {
              type: "workflow.link-health-updated",
              actor,
              reason,
              metadata: { workflowId, status },
            });
            return { ...nextProject };
          }),
        })),
      runWorkflowLinkHealthSweep: (projectId, actor = get().settings.currentUserRole) => {
        const result = { valid: 0, invalid: 0, authRequired: 0 };
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            Object.values(nextProject.workflowArtifacts).forEach((workflow) => {
              const link = evaluateLinkHealthFromUrl(workflow.clickupUrl);
              workflow.linkHealthStatus = link.status;
              workflow.linkHealthReason = link.reason;
              workflow.linkHealthCheckedAt = Date.now();
              if (link.status === "Valid") result.valid += 1;
              if (link.status === "Invalid") result.invalid += 1;
              if (link.status === "Auth Required") result.authRequired += 1;
            });
            appendAudit(nextProject, {
              type: "workflow.link-health-sweep",
              actor,
              metadata: result,
            });
            return { ...nextProject };
          }),
        }));
        return result;
      },

      initializeAnalysisRun: (projectId, actor = get().settings.currentUserRole) => {
        let output: { ok: boolean; blockers: GovernanceGateBlocker[] } = {
          ok: false,
          blockers: [],
        };
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              const gate = evaluateGovernanceGate(nextProject, "initialize-analysis");
              if (!gate.ready) {
                output = { ok: false, blockers: gate.blockers };
                nextNotice = gate.blockers[0]?.message ?? "Project is not ready to initialize analysis.";
                return nextProject;
              }
              const stakeholders = materializeStakeholderGroups(nextProject, state.employees, state.settings);
              const runNumber = nextProject.analysisState.runs.length + 1;
              const run = createAnalysisRun(
                nextProject,
                runNumber,
                actor,
                stakeholders,
                gate.requiredArtifacts.map((artifact) => artifact.id)
              );
              nextProject.analysisState.runs = [...nextProject.analysisState.runs, run];
              nextProject.analysisState.activeRunId = run.id;
              nextProject.analysisState.summaryArtifact.activeRunId = run.id;
              nextProject.analysisState.summaryArtifact.clickupResourceId = run.clickupResourceId;
              nextProject.analysisState.summaryArtifact.clickupUrl = run.clickupUrl;
              nextProject.analysisState.summaryArtifact.syncStatus = "ready-for-verification";
              nextProject.analysisState.summaryArtifact.runIds = [
                ...nextProject.analysisState.summaryArtifact.runIds,
                run.id,
              ];
              nextProject.lifecycle = "analysis-pending";
              appendAudit(nextProject, {
                type: "analysis.initialized",
                actor,
                metadata: { runId: run.id, runNumber },
                runId: run.id,
              });
              output = { ok: true, blockers: [] };
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        });
        return output;
      },
      updateAnalysisStepOneSection: (projectId, sectionId, value, actor = get().settings.currentUserRole) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const activeRun = getActiveAnalysisRun(nextProject);
            if (!activeRun) return nextProject;
            if (
              activeRun.lifecycleState !== "Initialized (Step 1 Active)" &&
              activeRun.lifecycleState !== "Revision Required"
            ) {
              return nextProject;
            }
            activeRun.stepOne.sections[sectionId] = value;
            activeRun.updatedAt = Date.now();
            appendAudit(nextProject, {
              type: "analysis.step1.section-updated",
              actor,
              metadata: { runId: activeRun.id, sectionId },
              runId: activeRun.id,
            });
            return { ...nextProject };
          }),
        })),
      setAnalysisUnresolvedPrompts: (projectId, count, actor = get().settings.currentUserRole) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const activeRun = getActiveAnalysisRun(nextProject);
            if (!activeRun) return nextProject;
            activeRun.stepOne.unresolvedRequiredPrompts = Math.max(0, count);
            activeRun.updatedAt = Date.now();
            appendAudit(nextProject, {
              type: "analysis.step1.required-prompts-updated",
              actor,
              metadata: { runId: activeRun.id, count: Math.max(0, count) },
              runId: activeRun.id,
            });
            return { ...nextProject };
          }),
        })),
      completeAnalysisStepOne: (projectId, actor = get().settings.currentUserRole) => {
        let completed = false;
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              const activeRun = getActiveAnalysisRun(nextProject);
              if (!activeRun) return nextProject;
              if (
                activeRun.lifecycleState !== "Initialized (Step 1 Active)" &&
                activeRun.lifecycleState !== "Revision Required"
              ) {
                return nextProject;
              }
              const incompleteSection = activeRun.stepOne.mandatorySectionIds.find(
                (sectionId) => (activeRun.stepOne.sections[sectionId] ?? "").trim().length === 0
              );
              if (incompleteSection || activeRun.stepOne.unresolvedRequiredPrompts > 0) {
                nextNotice =
                  "Step 1 cannot be completed until all mandatory sections and required prompts are resolved.";
                return nextProject;
              }
              const now = Date.now();
              activeRun.stepOne.completedAt = now;
              activeRun.stepOne.completedBy = actor;
              activeRun.lifecycleState = "Stakeholder Validation (Step 2 Active)";
              activeRun.stepTwo.startedAt = now;
              activeRun.stepTwo.deadlineAt =
                now + computeValidationWindowDays(nextProject, state.settings) * 24 * 60 * 60 * 1000;
              activeRun.updatedAt = now;
              appendAudit(nextProject, {
                type: "analysis.step1.completed",
                actor,
                metadata: { runId: activeRun.id },
                runId: activeRun.id,
              });
              completed = true;
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        });
        return completed;
      },
      recordStakeholderDecision: (projectId, payload) => {
        let success = false;
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const nextProject = normalizeProject(project);
              const activeRun = getActiveAnalysisRun(nextProject);
              if (!activeRun) return nextProject;
              if (activeRun.lifecycleState !== "Stakeholder Validation (Step 2 Active)") {
                return nextProject;
              }
              if (
                payload.decision !== "Approve" &&
                (!payload.comment || payload.comment.trim().length === 0)
              ) {
                nextNotice = "Reject and Needs Info decisions require a comment.";
                return nextProject;
              }
              const group = activeRun.stepTwo.groups.find((candidate) => candidate.id === payload.groupId);
              if (!group) return nextProject;
              const stakeholder = group.stakeholders.find(
                (candidate) => candidate.id === payload.stakeholderId
              );
              if (!stakeholder) return nextProject;
              stakeholder.decision = payload.decision;
              stakeholder.comment = payload.comment;
              stakeholder.updatedAt = Date.now();
              activeRun.updatedAt = Date.now();
              appendAudit(nextProject, {
                type: "analysis.step2.stakeholder-decision",
                actor: payload.actor ?? state.settings.currentUserRole,
                reason: payload.comment,
                metadata: {
                  runId: activeRun.id,
                  groupId: group.id,
                  stakeholderId: stakeholder.id,
                  decision: payload.decision,
                },
                runId: activeRun.id,
              });

              const revisionRequests = activeRun.stepTwo.groups
                .flatMap((candidateGroup) => candidateGroup.stakeholders)
                .filter(
                  (candidateStakeholder) =>
                    candidateStakeholder.decision === "Reject" ||
                    candidateStakeholder.decision === "Needs Info"
                )
                .map((candidateStakeholder) => candidateStakeholder.id);
              if (revisionRequests.length > 0) {
                activeRun.lifecycleState = "Revision Required";
                activeRun.revisionRequestedByStakeholderIds = revisionRequests;
                success = true;
                return { ...nextProject };
              }

              const requiredGroupsResolved = activeRun.stepTwo.groups
                .filter((candidateGroup) => candidateGroup.required)
                .every((candidateGroup) => {
                  const approvals = candidateGroup.stakeholders.filter(
                    (candidateStakeholder) => candidateStakeholder.decision === "Approve"
                  ).length;
                  const hasNeedsInfo = candidateGroup.stakeholders.some(
                    (candidateStakeholder) => candidateStakeholder.decision === "Needs Info"
                  );
                  if (hasNeedsInfo) return false;
                  return approvals >= candidateGroup.minimumApprovals;
                });
              if (requiredGroupsResolved) {
                activeRun.lifecycleState = "Admin Signoff (Step 3 Active)";
                activeRun.stepThree.startedAt = Date.now();
              }
              success = true;
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        });
        return success;
      },
      submitAnalysisRevision: (projectId, actor = get().settings.currentUserRole) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const activeRun = getActiveAnalysisRun(nextProject);
            if (!activeRun || activeRun.lifecycleState !== "Revision Required") return nextProject;
            const resetTargets = new Set(activeRun.revisionRequestedByStakeholderIds);
            activeRun.stepTwo.groups.forEach((group) => {
              group.stakeholders = group.stakeholders.map((stakeholder) =>
                resetTargets.has(stakeholder.id)
                  ? {
                      ...stakeholder,
                      decision: "Pending",
                      comment: undefined,
                      updatedAt: Date.now(),
                    }
                  : stakeholder
              );
            });
            activeRun.revisionRequestedByStakeholderIds = [];
            activeRun.lifecycleState = "Stakeholder Validation (Step 2 Active)";
            activeRun.stepTwo.startedAt = Date.now();
            activeRun.stepTwo.deadlineAt =
              Date.now() + computeValidationWindowDays(nextProject, state.settings) * 24 * 60 * 60 * 1000;
            activeRun.updatedAt = Date.now();
            appendAudit(nextProject, {
              type: "analysis.revision-submitted",
              actor,
              metadata: { runId: activeRun.id },
              runId: activeRun.id,
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },
      extendAnalysisValidationWindow: (projectId, days, actor = get().settings.currentUserRole) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const activeRun = getActiveAnalysisRun(nextProject);
            if (!activeRun || activeRun.lifecycleState !== "Stakeholder Validation (Step 2 Active)") {
              return nextProject;
            }
            if (days <= 0) return nextProject;
            const base = activeRun.stepTwo.deadlineAt ?? Date.now();
            activeRun.stepTwo.deadlineAt = base + days * 24 * 60 * 60 * 1000;
            activeRun.updatedAt = Date.now();
            appendAudit(nextProject, {
              type: "analysis.step2.window-extended",
              actor,
              metadata: { runId: activeRun.id, days },
              runId: activeRun.id,
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },
      refreshAnalysisMetrics: (projectId, actor = get().settings.currentUserRole) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            if (state.settings.currentUserRole !== "admin") return project;
            const nextProject = normalizeProject(project);
            const activeRun = getActiveAnalysisRun(nextProject);
            if (!activeRun) return nextProject;
            if (
              activeRun.lifecycleState !== "Initialized (Step 1 Active)" &&
              activeRun.lifecycleState !== "Revision Required"
            ) {
              return nextProject;
            }
            activeRun.metricsSnapshot = {
              capturedAt: Date.now(),
              capturedBy: actor,
              metrics: calculateProjectMetrics(nextProject),
            };
            activeRun.updatedAt = Date.now();
            appendAudit(nextProject, {
              type: "analysis.metrics-refreshed",
              actor,
              metadata: { runId: activeRun.id },
              runId: activeRun.id,
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },
      cancelAnalysisRun: (projectId, reason, actor = get().settings.currentUserRole) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            if (state.settings.currentUserRole !== "admin") return project;
            const nextProject = normalizeProject(project);
            const activeRun = getActiveAnalysisRun(nextProject);
            if (!activeRun || reason.trim().length === 0) return nextProject;
            activeRun.lifecycleState = "Canceled";
            activeRun.canceledReason = reason;
            activeRun.canceledAt = Date.now();
            activeRun.canceledBy = actor;
            activeRun.updatedAt = Date.now();
            nextProject.analysisState.activeRunId = null;
            nextProject.analysisState.summaryArtifact.activeRunId = null;
            nextProject.lifecycle = "analysis-pending";
            appendAudit(nextProject, {
              type: "analysis.canceled",
              actor,
              reason,
              metadata: { runId: activeRun.id },
              runId: activeRun.id,
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },
      reinitializeAnalysisRun: (projectId, mode, actor = get().settings.currentUserRole) => {
        let success = false;
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const nextProject = normalizeProject(project);
            const canceledRun = [...nextProject.analysisState.runs]
              .reverse()
              .find((run) => run.lifecycleState === "Canceled");
            if (!canceledRun) return nextProject;

            if (mode === "Resume Draft") {
              canceledRun.lifecycleState = "Initialized (Step 1 Active)";
              canceledRun.updatedAt = Date.now();
              nextProject.analysisState.activeRunId = canceledRun.id;
              nextProject.analysisState.summaryArtifact.activeRunId = canceledRun.id;
              nextProject.analysisState.summaryArtifact.clickupResourceId = canceledRun.clickupResourceId;
              nextProject.analysisState.summaryArtifact.clickupUrl = canceledRun.clickupUrl;
              nextProject.lifecycle = "analysis-pending";
              appendAudit(nextProject, {
                type: "analysis.reinitialized-resume",
                actor,
                metadata: { runId: canceledRun.id },
                runId: canceledRun.id,
              });
              success = true;
              return { ...nextProject };
            }

            canceledRun.archivedAt = Date.now();
            canceledRun.readOnly = true;
            const stakeholders = materializeStakeholderGroups(nextProject, state.employees, state.settings);
            const gate = evaluateGovernanceGate(nextProject, "initialize-analysis");
            const newRun = createAnalysisRun(
              nextProject,
              nextProject.analysisState.runs.length + 1,
              actor,
              stakeholders,
              gate.requiredArtifacts.map((artifact) => artifact.id)
            );
            nextProject.analysisState.runs = [...nextProject.analysisState.runs, newRun];
            nextProject.analysisState.activeRunId = newRun.id;
            nextProject.analysisState.summaryArtifact.activeRunId = newRun.id;
            nextProject.analysisState.summaryArtifact.clickupResourceId = newRun.clickupResourceId;
            nextProject.analysisState.summaryArtifact.clickupUrl = newRun.clickupUrl;
            nextProject.analysisState.summaryArtifact.runIds = [
              ...nextProject.analysisState.summaryArtifact.runIds,
              newRun.id,
            ];
            nextProject.lifecycle = "analysis-pending";
            appendAudit(nextProject, {
              type: "analysis.reinitialized-fresh",
              actor,
              metadata: { runId: newRun.id, archivedRunId: canceledRun.id },
              runId: newRun.id,
            });
            success = true;
            return { ...nextProject };
          }),
        }));
        return success;
      },
      finalizeAnalysisRun: (projectId, actor = get().settings.currentUserRole) => {
        let success = false;
        set((state) => {
          let nextNotice = state.lastWorkspaceNotice;
          return {
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              if (state.settings.currentUserRole !== "admin") return project;
              const nextProject = normalizeProject(project);
              const activeRun = getActiveAnalysisRun(nextProject);
              if (!activeRun || activeRun.lifecycleState !== "Admin Signoff (Step 3 Active)") {
                nextNotice = "Analysis must reach Admin Signoff before finalization.";
                return nextProject;
              }
              const gate = evaluateGovernanceGate(nextProject, "finalize-analysis");
              if (!gate.ready) {
                nextNotice = gate.blockers[0]?.message ?? "Analysis finalization gate failed.";
                return nextProject;
              }
              activeRun.lifecycleState = "Finalized";
              activeRun.readOnly = true;
              activeRun.stepThree.signedOffAt = Date.now();
              activeRun.stepThree.signedOffBy = actor;
              activeRun.updatedAt = Date.now();
              nextProject.analysisState.activeRunId = null;
              nextProject.analysisState.summaryArtifact.activeRunId = null;
              nextProject.analysisState.summaryArtifact.syncStatus = "synced";
              nextProject.lifecycle = "ready-to-close";
              appendAudit(nextProject, {
                type: "analysis.finalized",
                actor,
                metadata: { runId: activeRun.id },
                runId: activeRun.id,
              });
              success = true;
              return { ...nextProject };
            }),
            lastWorkspaceNotice: nextNotice,
          };
        });
        return success;
      },
      refreshAnalysisHubInsights: (source = "manual", actor = get().settings.currentUserRole) => {
        let output: { ok: boolean; reason?: string } = { ok: false };
        set((state) => {
          const refreshActor = actor ?? state.settings.currentUserRole;
          const capabilities = getCapabilitiesForRole(state.settings.currentUserRole, state.settings);
          if (source === "manual" && !capabilities.canRefreshAnalysisHub) {
            output = { ok: false, reason: "You do not have permission to refresh Analysis Hub." };
            return {};
          }
          try {
            const refreshedAt = Date.now();
            const nextRecommendations = generateAnalysisRecommendations(
              state.projects,
              state.analysisHubRecommendations,
              refreshedAt
            );
            output = { ok: true };
            return {
              analysisHubRecommendations: nextRecommendations,
              analysisHubRefreshMetadata: {
                status: "success",
                stale: false,
                lastRefreshedAt: refreshedAt,
                source,
                failureReason: undefined,
                refreshedBy: refreshActor,
              },
            };
          } catch (error) {
            output = {
              ok: false,
              reason: error instanceof Error ? error.message : "Unable to refresh analysis insights.",
            };
            return {
              analysisHubRefreshMetadata: {
                ...state.analysisHubRefreshMetadata,
                status: "failed",
                stale: true,
                source,
                failureReason: output.reason,
                refreshedBy: refreshActor,
              },
            };
          }
        });
        return output;
      },
      reviewAnalysisRecommendation: (recommendationId, input) => {
        let success = false;
        set((state) => {
          const capabilities = getCapabilitiesForRole(state.settings.currentUserRole, state.settings);
          if (!capabilities.canApproveRecommendations) return {};
          const recommendation = state.analysisHubRecommendations[recommendationId];
          if (!recommendation) return {};
          const rationale = input.rationale.trim();
          if (rationale.length === 0) return {};
          const actorLabel = input.actor ?? state.settings.currentUserRole;

          if (input.decision === "approve") {
            if (!isValidRecommendationTransition(recommendation.lifecycleState, "Approved")) return {};
            if (recommendation.citations.length === 0) return {};
            const snapshot = createRecommendationActionSnapshot(recommendation);
            success = true;
            return {
              analysisHubRecommendations: {
                ...state.analysisHubRecommendations,
                [recommendationId]: {
                  ...recommendation,
                  lifecycleState: "Approved",
                  reviewedBy: actorLabel,
                  reviewedAt: Date.now(),
                  reviewRationale: rationale,
                  updatedAt: Date.now(),
                  approvedSnapshot: snapshot,
                  actionLinkage: {
                    status: "queued",
                    payload: snapshot,
                    queuedAt: Date.now(),
                    deliveryAttempts: recommendation.actionLinkage?.deliveryAttempts ?? 0,
                    lastAttemptAt: recommendation.actionLinkage?.lastAttemptAt,
                    clickupActionId: recommendation.actionLinkage?.clickupActionId,
                    clickupUrl: recommendation.actionLinkage?.clickupUrl,
                    failureReason: undefined,
                  },
                },
              },
            };
          }

          if (!isValidRecommendationTransition(recommendation.lifecycleState, "Rejected")) return {};
          success = true;
          return {
            analysisHubRecommendations: {
              ...state.analysisHubRecommendations,
              [recommendationId]: {
                ...recommendation,
                lifecycleState: "Rejected",
                reviewedBy: actorLabel,
                reviewedAt: Date.now(),
                reviewRationale: rationale,
                updatedAt: Date.now(),
              },
            },
          };
        });
        return success;
      },
      updateRecommendationLifecycleState: (recommendationId, lifecycleState, actor = get().settings.currentUserRole) => {
        let success = false;
        set((state) => {
          const capabilities = getCapabilitiesForRole(state.settings.currentUserRole, state.settings);
          if (!capabilities.canApproveRecommendations) return {};
          const recommendation = state.analysisHubRecommendations[recommendationId];
          if (!recommendation) return {};
          if (!isValidRecommendationTransition(recommendation.lifecycleState, lifecycleState)) return {};
          success = true;
          return {
            analysisHubRecommendations: {
              ...state.analysisHubRecommendations,
              [recommendationId]: {
                ...recommendation,
                lifecycleState,
                reviewedBy: actor,
                reviewedAt: Date.now(),
                updatedAt: Date.now(),
              },
            },
          };
        });
        return success;
      },
      dispatchRecommendationAction: (recommendationId, input) => {
        let success = false;
        set((state) => {
          const capabilities = getCapabilitiesForRole(state.settings.currentUserRole, state.settings);
          if (!capabilities.canApproveRecommendations) return {};
          const recommendation = state.analysisHubRecommendations[recommendationId];
          if (!recommendation) return {};
          if (
            recommendation.lifecycleState !== "Approved" &&
            recommendation.lifecycleState !== "In Progress"
          ) {
            return {};
          }
          if (!recommendation.actionLinkage) return {};
          const attempts = recommendation.actionLinkage.deliveryAttempts;
          const shouldFail =
            input?.forceFailure ?? (attempts === 0 && recommendation.effortScore >= 4);
          const nextAttempts = attempts + 1;
          const actorLabel = input?.actor ?? state.settings.currentUserRole;

          if (shouldFail) {
            success = true;
            return {
              analysisHubRecommendations: {
                ...state.analysisHubRecommendations,
                [recommendationId]: {
                  ...recommendation,
                  reviewedBy: actorLabel,
                  reviewedAt: Date.now(),
                  updatedAt: Date.now(),
                  actionLinkage: {
                    ...recommendation.actionLinkage,
                    status: "failed",
                    deliveryAttempts: nextAttempts,
                    lastAttemptAt: Date.now(),
                    failureReason:
                      input?.failureReason ??
                      "Action handoff failed validation. Review citations and retry.",
                  },
                },
              },
            };
          }

          const clickupActionId = `action-${recommendation.projectId}-${nextAttempts}`;
          success = true;
          return {
            analysisHubRecommendations: {
              ...state.analysisHubRecommendations,
              [recommendationId]: {
                ...recommendation,
                lifecycleState: recommendation.lifecycleState === "Approved" ? "In Progress" : recommendation.lifecycleState,
                reviewedBy: actorLabel,
                reviewedAt: Date.now(),
                updatedAt: Date.now(),
                actionLinkage: {
                  ...recommendation.actionLinkage,
                  status: "created",
                  deliveryAttempts: nextAttempts,
                  lastAttemptAt: Date.now(),
                  clickupActionId,
                  clickupUrl: `https://app.clickup.com/t/${clickupActionId}`,
                  failureReason: undefined,
                },
              },
            },
          };
        });
        return success;
      },
      retryRecommendationActionDispatch: (recommendationId, actor = get().settings.currentUserRole) =>
        get().dispatchRecommendationAction(recommendationId, { actor }),

      seedBulkData: (projects, employees) =>
        set((state) => {
          const normalizedProjects = projects.map((p) => normalizeProject(p));
          let prefs = { ...state.projectUIPreferences };
          for (const p of normalizedProjects) {
            prefs = ensureProjectPreferences(prefs, p.id);
          }
          return {
            projects: [...state.projects, ...normalizedProjects],
            employees: [...state.employees, ...employees],
            projectUIPreferences: prefs,
          };
        }),

      estimateCleanupImpact: (nextPolicy) => {
        const threshold = Date.now() - nextPolicy.threadRetentionDays * 24 * 60 * 60 * 1000;
        const docsWithOldThreads = new Set<string>();
        let threadCount = 0;
        get().projects.forEach((project) => {
          Object.entries(project.docWorkspace ?? {}).forEach(([docId, workspace]) => {
            const oldThreads = workspace.threadHistory.filter(
              (thread) => (thread.closedAt ?? thread.createdAt) < threshold
            );
            if (oldThreads.length > 0) {
              docsWithOldThreads.add(`${project.id}:${docId}`);
              threadCount += oldThreads.length;
            }
          });
        });
        return { threadCount, docCount: docsWithOldThreads.size };
      },
    }),
    {
      name: "sopnow-storage",
      storage: createJSONStorage(() => ({
        getItem: (name: string) => localStorage.getItem(name),
        setItem: (name: string, value: string) => {
          try {
            localStorage.setItem(name, value);
          } catch {
            console.warn("[sopnow-storage] localStorage quota exceeded, pruning old data");
            try {
              // Remove and retry once – gives the browser a chance to reclaim space
              localStorage.removeItem(name);
              localStorage.setItem(name, value);
            } catch {
              console.error("[sopnow-storage] Unable to persist state – localStorage is full");
            }
          }
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      })),
      merge: (persistedState, currentState) => {
        const incoming = persistedState as Partial<AppState> | undefined;
        const incomingProjects = (incoming?.projects ?? []).map((project) =>
          normalizeProject(project as SOPProject)
        );
        return {
          ...currentState,
          ...incoming,
          projects: incomingProjects,
          settings: {
            ...DEFAULT_SETTINGS,
            ...(incoming?.settings ?? {}),
            workspacePolicy: {
              ...DEFAULT_SETTINGS.workspacePolicy,
              ...(incoming?.settings?.workspacePolicy ?? {}),
              defaultStakeholderGroups:
                incoming?.settings?.workspacePolicy?.defaultStakeholderGroups ??
                DEFAULT_SETTINGS.workspacePolicy.defaultStakeholderGroups,
              progressWeights: {
                ...DEFAULT_SETTINGS.workspacePolicy.progressWeights,
                ...(incoming?.settings?.workspacePolicy?.progressWeights ?? {}),
              },
              preCompleteProgressCap:
                incoming?.settings?.workspacePolicy?.preCompleteProgressCap ??
                DEFAULT_SETTINGS.workspacePolicy.preCompleteProgressCap,
            },
          },
          analysisHubRecommendations: incoming?.analysisHubRecommendations ?? {},
          analysisHubRefreshMetadata: {
            ...DEFAULT_ANALYSIS_HUB_REFRESH_METADATA,
            ...(incoming?.analysisHubRefreshMetadata ?? {}),
          },
          toolsRegistry:
            incoming?.toolsRegistry && incoming.toolsRegistry.length > 0
              ? incoming.toolsRegistry
              : DEFAULT_TOOLS_REGISTRY,
          projectUIPreferences: incoming?.projectUIPreferences ?? {},
          projectsDashboardState: {
            ...DEFAULT_DASHBOARD_STATE,
            ...(incoming?.projectsDashboardState ?? {}),
          },
        };
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Phase 4: Automatic derived-phase transition auditing
// ---------------------------------------------------------------------------
import { deriveProjectStatus } from "./deriveProjectStatus";

const _prevPhaseCache = new Map<string, { phase: string; overlays: string[] }>();

useStore.subscribe((state, prevState) => {
  if (state.projects === prevState.projects) return;

  const nextProjects = [...state.projects];
  let mutated = false;

  for (let i = 0; i < nextProjects.length; i++) {
    const project = nextProjects[i];
    const derived = deriveProjectStatus(project);
    const prev = _prevPhaseCache.get(project.id);

    if (!prev) {
      _prevPhaseCache.set(project.id, {
        phase: derived.primaryPhase,
        overlays: [...derived.overlays],
      });
      continue;
    }

    const phaseChanged = prev.phase !== derived.primaryPhase;
    const overlaysChanged =
      prev.overlays.length !== derived.overlays.length ||
      prev.overlays.some((o, idx) => derived.overlays[idx] !== o);

    if (!phaseChanged && !overlaysChanged) continue;

    const auditEvents: GovernanceAuditEvent[] = [];
    if (phaseChanged) {
      auditEvents.push({
        id: cryptoSafeId(),
        timestamp: Date.now(),
        type: "derived-phase.transition",
        actor: "system",
        reason: `Phase changed from "${prev.phase}" to "${derived.primaryPhase}"`,
        metadata: {
          fromPhase: prev.phase,
          toPhase: derived.primaryPhase,
          reasonCodes: derived.reasonCodes.join(","),
        },
      });
    }
    if (overlaysChanged) {
      auditEvents.push({
        id: cryptoSafeId(),
        timestamp: Date.now(),
        type: "derived-phase.overlay-change",
        actor: "system",
        reason: `Overlays changed from [${prev.overlays.join(", ")}] to [${derived.overlays.join(", ")}]`,
        metadata: {
          fromOverlays: prev.overlays.join(","),
          toOverlays: derived.overlays.join(","),
        },
      });
    }

    if (auditEvents.length > 0) {
      nextProjects[i] = {
        ...project,
        auditTrail: [...auditEvents, ...(project.auditTrail ?? [])],
      };
      mutated = true;
    }

    _prevPhaseCache.set(project.id, {
      phase: derived.primaryPhase,
      overlays: [...derived.overlays],
    });
  }

  // Sync cache for removed projects
  const currentIds = new Set(state.projects.map((p) => p.id));
  for (const cachedId of _prevPhaseCache.keys()) {
    if (!currentIds.has(cachedId)) _prevPhaseCache.delete(cachedId);
  }

  if (mutated) {
    useStore.setState({ projects: nextProjects });
  }
});
