import { faker } from '@faker-js/faker';
import {
  AnalysisLifecycleState,
  AnalysisRun,
  AnalysisStakeholderGroup,
  DocumentWorkspaceState,
  Employee,
  LevelDoc,
  ProjectAnalysisState,
  SOPProject,
  WorkflowArtifact,
  WorkflowLevel,
  WorkflowVersion,
} from './store/useStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECTS_PER_PHASE = 3;
const TOTAL_PROJECTS = 21; // 7 phases × 3

const COMPANIES = ['MetaShift Corp', 'Nebula Solutions', 'Quantum Logistics', 'Solaris Energy'];
const DEPARTMENTS = [
  'Finance & Accounting',
  'Human Resources',
  'Engineering',
  'Customer Success',
  'Marketing',
];
const PROCESS_THEMES = [
  'Client Onboarding',
  'Invoice Reconciliation',
  'Release Management',
  'Customer Escalation',
  'Lead Qualification',
  'Vendor Intake',
  'Incident Triage',
  'Knowledge Base Governance',
  'Contract Review',
  'Procurement Approval',
  'Employee Offboarding',
  'Budget Approval',
  'Feature Rollout',
  'QA Certification',
  'Partner Integration',
  'Compliance Audit',
  'Data Migration',
  'Capacity Planning',
  'Change Management',
  'Risk Assessment',
  'Service Level Agreement',
];
const EMPLOYEE_ROLES = [
  'Process Owner',
  'SOP Reviewer',
  'Operations Analyst',
  'QA Specialist',
  'Implementation Lead',
];

const ANALYSIS_MANDATORY_SECTION_IDS = [
  'current-state',
  'bottlenecks',
  'future-state',
  'implementation-plan',
];

// ---------------------------------------------------------------------------
// Phase targeting
// ---------------------------------------------------------------------------

type TargetPhase =
  | 'not-started'
  | 'document-drafting'
  | 'waiting-on-workflows'
  | 'drafting-analysis'
  | 'analysis-validation'
  | 'ready-to-close'
  | 'complete';

const PHASE_SEQUENCE: TargetPhase[] = [
  'not-started',
  'document-drafting',
  'waiting-on-workflows',
  'drafting-analysis',
  'analysis-validation',
  'ready-to-close',
  'complete',
];

function resolvePhaseForIndex(index: number): TargetPhase {
  return PHASE_SEQUENCE[Math.floor(index / PROJECTS_PER_PHASE) % PHASE_SEQUENCE.length];
}

// ---------------------------------------------------------------------------
// Basic helpers
// ---------------------------------------------------------------------------

function createMockDoc(level: string, title?: string): LevelDoc {
  return {
    id: faker.string.uuid(),
    title: title || `${level}: ${faker.commerce.productName()} Procedure`,
    content: faker.lorem.paragraphs(3),
    scribeChecked: false,
    status: 'todo',
  };
}

function getAllDocs(project: Pick<SOPProject, 'levels'>): LevelDoc[] {
  return [project.levels.L1, project.levels.L2, ...project.levels.L3, ...project.levels.L4];
}

function getWorkflowArtifactId(level: WorkflowLevel, docId: string) {
  return `workflow:${level}:${docId}`;
}

// ---------------------------------------------------------------------------
// Workflow builders
// ---------------------------------------------------------------------------

function createFinalizedWorkflowVersion(
  workflowId: string,
  title: string,
  timestamp: number
): WorkflowVersion {
  const versionId = `workflow-version-${faker.string.uuid()}`;
  return {
    id: versionId,
    createdAt: timestamp - 20000,
    createdBy: 'admin',
    source: 'generate',
    baselineVersionId: null,
    content: `${title}\n\nFinalized governance baseline workflow.`,
    diffSummary: 'Initial finalized baseline.',
    lineage: {
      parentArtifactIds: [workflowId],
      reason: 'Seeded finalized baseline workflow',
    },
    syncedAt: timestamp - 15000,
    syncedBy: 'admin',
  };
}

function buildSyncedWorkflowArtifacts(
  project: SOPProject,
  timestamp: number
): Record<string, WorkflowArtifact> {
  const records: Record<string, WorkflowArtifact> = {};
  const l1Id = getWorkflowArtifactId('L1', project.levels.L1.id);
  const l2Id = getWorkflowArtifactId('L2', project.levels.L2.id);

  const entries: Array<{ level: WorkflowLevel; doc: LevelDoc; parentArtifactId?: string }> = [
    { level: 'L1', doc: project.levels.L1 },
    { level: 'L2', doc: project.levels.L2, parentArtifactId: l1Id },
    ...project.levels.L3.map((doc) => ({
      level: 'L3' as const,
      doc,
      parentArtifactId: l2Id,
    })),
    ...project.levels.L4.map((doc) => ({
      level: 'L4' as const,
      doc,
      parentArtifactId: getWorkflowArtifactId(
        'L3',
        doc.parentStageId ?? project.levels.L3[0]?.id ?? project.levels.L2.id
      ),
    })),
  ];

  entries.forEach(({ level, doc, parentArtifactId }) => {
    const id = getWorkflowArtifactId(level, doc.id);
    const version = createFinalizedWorkflowVersion(id, `Workflow · ${doc.title}`, timestamp);
    const clickupResourceId = `${id.replace(/[:]/g, '-')}-clickup`;
    records[id] = {
      id,
      projectId: project.id,
      docId: doc.id,
      level,
      title: `Workflow · ${doc.title}`,
      parentArtifactId,
      childArtifactIds: [],
      lifecycleState: 'Synced',
      stale: false,
      blocked: false,
      versions: [version],
      currentVersionId: version.id,
      lastSyncedVersionId: version.id,
      diffBaselineVersionId: version.id,
      clickupResourceType: 'doc',
      clickupResourceId,
      clickupUrl: `https://app.clickup.com/t/${clickupResourceId}`,
      syncStatus: 'synced',
      lastSyncedAt: timestamp - 10000,
      lastSyncedBy: 'admin',
      linkHealthStatus: 'Valid',
      linkHealthCheckedAt: timestamp - 5000,
      linkHealthReason: 'Link verified',
      proof: {
        reviewedChanges: true,
        clickupUpdated: true,
        embedVerified: true,
        submittedAt: timestamp - 12000,
        submittedBy: 'admin',
        adminVerifiedAt: timestamp - 10000,
        adminVerifiedBy: 'admin',
        notes: 'Seeded finalized proof checklist.',
      },
    };
  });

  Object.values(records).forEach((artifact) => {
    if (!artifact.parentArtifactId) return;
    const parent = records[artifact.parentArtifactId];
    if (!parent) return;
    parent.childArtifactIds = [...parent.childArtifactIds, artifact.id];
  });

  return records;
}

// ---------------------------------------------------------------------------
// Doc workspace builder
// ---------------------------------------------------------------------------

function buildFinalizedDocWorkspace(
  project: SOPProject,
  timestamp: number
): Record<string, DocumentWorkspaceState> {
  const workspace: Record<string, DocumentWorkspaceState> = {};
  getAllDocs(project).forEach((doc) => {
    workspace[doc.id] = {
      activeThread: {
        id: faker.string.uuid(),
        status: 'active',
        messages: [
          {
            id: faker.string.uuid(),
            role: 'ai',
            roleTag: 'reviewer',
            content: 'Document finalized and aligned to governance baseline.',
            timestamp: timestamp - 3000,
          },
        ],
        createdAt: timestamp - 3000,
      },
      threadHistory: [],
      proposals: [],
      revisions: [
        {
          id: faker.string.uuid(),
          title: doc.title,
          content: doc.content,
          committedAt: timestamp - 5000,
          authorRole: 'user',
        },
      ],
      draftTitle: doc.title,
      draftContent: doc.content,
      dirty: false,
      finalized: true,
      finalizedAt: timestamp - 2000,
      lastUpdatedAt: timestamp - 1000,
    };
  });
  return workspace;
}

// ---------------------------------------------------------------------------
// Analysis state builders
// ---------------------------------------------------------------------------

function buildFrozenArtifactIds(
  project: SOPProject,
  workflowArtifacts: Record<string, WorkflowArtifact>
): string[] {
  return [
    `doc:${project.levels.L2.id}`,
    ...project.levels.L3.map((doc) => `doc:${doc.id}`),
    ...project.levels.L4.map((doc) => `doc:${doc.id}`),
    ...Object.values(workflowArtifacts)
      .filter((w) => w.level !== 'L1')
      .map((w) => `workflow:${w.id}`),
  ];
}

function buildStakeholderGroups(
  department: string,
  allApproved: boolean,
  timestamp: number
): AnalysisStakeholderGroup[] {
  return [
    {
      id: 'process-owner-dept-lead',
      label: 'Process Owner Dept Lead',
      minimumApprovals: 1,
      required: true,
      stakeholders: [
        {
          id: faker.string.uuid(),
          displayName: `${department} Department Lead`,
          decision: allApproved ? 'Approve' : 'Pending',
          ...(allApproved
            ? { comment: 'Approved.', updatedAt: timestamp - 12000 }
            : {}),
        },
      ],
    },
    {
      id: 'executive-sponsor',
      label: 'Executive Sponsor',
      minimumApprovals: 1,
      required: true,
      stakeholders: [
        {
          id: faker.string.uuid(),
          displayName: 'Executive Sponsor',
          decision: allApproved ? 'Approve' : 'Pending',
          ...(allApproved
            ? { comment: 'Approved for rollout.', updatedAt: timestamp - 11000 }
            : {}),
        },
      ],
    },
    {
      id: 'operations-representatives',
      label: 'Operations Representatives',
      minimumApprovals: 1,
      required: false,
      stakeholders: [
        {
          id: faker.string.uuid(),
          displayName: 'Operations Manager',
          decision: allApproved ? 'Approve' : 'Pending',
          ...(allApproved
            ? { comment: 'Validated.', updatedAt: timestamp - 10000 }
            : {}),
        },
      ],
    },
  ];
}

function buildAnalysisStateAtStage(
  project: SOPProject,
  workflowArtifacts: Record<string, WorkflowArtifact>,
  timestamp: number,
  stage: AnalysisLifecycleState
): ProjectAnalysisState {
  const runId = `analysis-run-${faker.string.uuid()}`;
  const summaryResourceId = `analysis-${project.id}-1`;
  const allDocs = getAllDocs(project);
  const isFinalized = stage === 'Finalized';
  const isStep2 = stage === 'Stakeholder Validation (Step 2 Active)';
  const isStep3 = stage === 'Admin Signoff (Step 3 Active)';
  const step1Done = isStep2 || isStep3 || isFinalized;
  const step2Done = isStep3 || isFinalized;

  const run: AnalysisRun = {
    id: runId,
    runNumber: 1,
    lifecycleState: stage,
    createdAt: timestamp - 60000,
    createdBy: 'admin',
    updatedAt: timestamp - 5000,
    frozenArtifactIds: buildFrozenArtifactIds(project, workflowArtifacts),
    clickupResourceId: summaryResourceId,
    clickupUrl: `https://app.clickup.com/t/${summaryResourceId}`,
    metricsSnapshot: {
      capturedAt: timestamp - 10000,
      capturedBy: 'admin',
      metrics: {
        totalDocs: allDocs.length,
        finalizedDocs: allDocs.length,
        syncedWorkflows: Object.keys(workflowArtifacts).length,
        staleWorkflows: 0,
        blockedWorkflows: 0,
        completionPercent: 100,
      },
    },
    stepOne: {
      sections: ANALYSIS_MANDATORY_SECTION_IDS.reduce<Record<string, string>>((acc, sid) => {
        acc[sid] = step1Done
          ? `${sid.replace(/-/g, ' ')} is fully documented and validated.`
          : sid === 'current-state'
            ? 'Current state documented.'
            : '';
        return acc;
      }, {}),
      mandatorySectionIds: [...ANALYSIS_MANDATORY_SECTION_IDS],
      unresolvedRequiredPrompts: 0,
      ...(step1Done ? { completedAt: timestamp - 30000, completedBy: 'admin' } : {}),
    },
    stepTwo: {
      groups: step1Done
        ? buildStakeholderGroups(project.department, step2Done, timestamp)
        : [],
      ...(step1Done
        ? {
            startedAt: timestamp - 25000,
            deadlineAt: timestamp + 7 * 24 * 60 * 60 * 1000,
          }
        : {}),
      remindersSentAt: [],
    },
    stepThree: {
      ...(isStep3
        ? { startedAt: timestamp - 12000 }
        : isFinalized
          ? { startedAt: timestamp - 12000, signedOffAt: timestamp - 5000, signedOffBy: 'admin' }
          : {}),
    },
    revisionRequestedByStakeholderIds: [],
    readOnly: isFinalized,
    auditMirror: [`[${new Date(timestamp - 60000).toISOString()}] Run initialized by admin`],
  };

  return {
    summaryArtifact: {
      id: `analysis-summary:${project.id}`,
      clickupResourceId: summaryResourceId,
      clickupUrl: run.clickupUrl,
      syncStatus: isFinalized ? 'synced' : 'ready-for-verification',
      activeRunId: isFinalized ? null : runId,
      runIds: [runId],
    },
    runs: [run],
    activeRunId: isFinalized ? null : runId,
  };
}

// ---------------------------------------------------------------------------
// Doc creation helpers per phase
// ---------------------------------------------------------------------------

/** All docs in todo state, no scribe. */
function makeTodoDocs(name: string, index: number) {
  const l3Count = 2 + (index % 3);
  const l4Count = 4 + (index % 6);
  const L1 = createMockDoc('L1 Overview', `${name} Overview`);
  const L2 = createMockDoc('L2 Process Map', `${name} Master Process`);
  const L3: LevelDoc[] = Array.from({ length: l3Count }, (_, i) =>
    createMockDoc('L3 Stage', `${name} Stage ${i + 1}`)
  );
  const L4: LevelDoc[] = Array.from({ length: l4Count }, (_, i) => ({
    ...createMockDoc('L4 Procedure', `${name} Procedure ${i + 1}`),
    parentStageId:
      L3[Math.min(L3.length - 1, Math.floor(i / Math.max(1, Math.ceil(l4Count / l3Count))))]?.id,
  }));
  return { L1, L2, L3, L4 };
}

/** Partially completed docs — some completed+scribed, some in-progress/todo. */
function makePartialDocs(name: string, index: number) {
  const { L1, L2, L3, L4 } = makeTodoDocs(name, index);
  const allDocs = [L1, L2, ...L3, ...L4];
  const completedCount = Math.max(1, Math.round(allDocs.length * [0.3, 0.5, 0.65][index % 3]));
  allDocs.forEach((doc, i) => {
    if (i < completedCount) {
      doc.status = 'completed';
      doc.scribeChecked = i % 2 === 0; // not all scribed → prevents allFinalizedAndScribed
    } else {
      doc.status = i % 2 === 0 ? 'in-progress' : 'todo';
    }
  });
  return { L1, L2, L3, L4 };
}

/** All docs completed + scribe-checked. */
function makeCompleteDocs(name: string, index: number) {
  const { L1, L2, L3, L4 } = makeTodoDocs(name, index);
  [L1, L2, ...L3, ...L4].forEach((doc) => {
    doc.status = 'completed';
    doc.scribeChecked = true;
  });
  return { L1, L2, L3, L4 };
}

// ---------------------------------------------------------------------------
// Phase project generators
// ---------------------------------------------------------------------------

function buildBaseProject(
  index: number,
  phase: TargetPhase,
  levels: { L1: LevelDoc; L2: LevelDoc; L3: LevelDoc[]; L4: LevelDoc[] }
): SOPProject {
  const company = COMPANIES[index % COMPANIES.length];
  const department = DEPARTMENTS[index % DEPARTMENTS.length];
  const theme = PROCESS_THEMES[index % PROCESS_THEMES.length];
  const name = `${theme} SOP ${String(index + 1).padStart(2, '0')}`;

  const lifecycleMap: Record<TargetPhase, NonNullable<SOPProject['lifecycle']>> = {
    'not-started': 'active',
    'document-drafting': 'active',
    'waiting-on-workflows': 'active',
    'drafting-analysis': 'analysis-pending',
    'analysis-validation': 'analysis-pending',
    'ready-to-close': 'ready-to-close',
    complete: 'finalized',
  };
  const statusMap: Record<TargetPhase, SOPProject['status']> = {
    'not-started': 'drafting',
    'document-drafting': 'drafting',
    'waiting-on-workflows': 'review',
    'drafting-analysis': 'review',
    'analysis-validation': 'review',
    'ready-to-close': 'review',
    complete: 'done',
  };

  return {
    id: faker.string.uuid(),
    name,
    company,
    department,
    clickupDestination: { workspace: 'Main Workspace', space: department, folder: `${theme} SOPs` },
    status: statusMap[phase],
    progress: 0,
    levels,
    interviewHistory: [
      {
        id: faker.string.uuid(),
        role: 'ai',
        content: `I mapped the ${name} workflow. Which step causes the most friction for ${department}?`,
        timestamp: Date.now() - (index + 2) * 120000,
      },
      {
        id: faker.string.uuid(),
        role: 'user',
        content: `The team wants to standardize the ${faker.hacker.verb()} handoff sequence.`,
        timestamp: Date.now() - (index + 1) * 60000,
      },
    ],
    understanding: phase === 'not-started' ? [50, 65, 75][index % 3] : 100,
    setupCompleted: phase !== 'not-started',
    lifecycle: lifecycleMap[phase],
  };
}

function generatePhaseProject(index: number): SOPProject {
  const phase = resolvePhaseForIndex(index);
  const theme = PROCESS_THEMES[index % PROCESS_THEMES.length];
  const name = `${theme} SOP ${String(index + 1).padStart(2, '0')}`;
  const timestamp = Date.now() - (index + 1) * 60 * 60 * 1000;

  switch (phase) {
    // ── Not Started: no setup, no finalized docs ──────────────────────
    case 'not-started': {
      const levels = makeTodoDocs(name, index);
      return buildBaseProject(index, phase, levels);
    }

    // ── Document Drafting: setup done, docs partially complete ────────
    case 'document-drafting': {
      const levels = makePartialDocs(name, index);
      return buildBaseProject(index, phase, levels);
    }

    // ── Waiting on Workflows: all docs finalized+scribed, workflows unsynced
    case 'waiting-on-workflows': {
      const levels = makeCompleteDocs(name, index);
      const project = buildBaseProject(index, phase, levels);
      project.docWorkspace = buildFinalizedDocWorkspace(project, timestamp);
      return project;
    }

    // ── Drafting Analysis: docs+workflows done, analysis at Step 1 ───
    case 'drafting-analysis': {
      const levels = makeCompleteDocs(name, index);
      const project = buildBaseProject(index, phase, levels);
      const workflows = buildSyncedWorkflowArtifacts(project, timestamp);
      project.docWorkspace = buildFinalizedDocWorkspace(project, timestamp);
      project.workflowArtifacts = workflows;
      project.analysisState = buildAnalysisStateAtStage(
        project,
        workflows,
        timestamp,
        'Initialized (Step 1 Active)'
      );
      return project;
    }

    // ── Analysis Validation: analysis at Step 2 or Step 3 ────────────
    case 'analysis-validation': {
      const levels = makeCompleteDocs(name, index);
      const project = buildBaseProject(index, phase, levels);
      const workflows = buildSyncedWorkflowArtifacts(project, timestamp);
      project.docWorkspace = buildFinalizedDocWorkspace(project, timestamp);
      project.workflowArtifacts = workflows;
      // 2 projects at Step 2, 1 at Step 3
      const stage: AnalysisLifecycleState =
        index % PROJECTS_PER_PHASE < 2
          ? 'Stakeholder Validation (Step 2 Active)'
          : 'Admin Signoff (Step 3 Active)';
      project.analysisState = buildAnalysisStateAtStage(project, workflows, timestamp, stage);
      return project;
    }

    // ── Ready to Close: analysis finalized, lifecycle ready-to-close ──
    case 'ready-to-close': {
      const levels = makeCompleteDocs(name, index);
      const project = buildBaseProject(index, phase, levels);
      const workflows = buildSyncedWorkflowArtifacts(project, timestamp);
      project.docWorkspace = buildFinalizedDocWorkspace(project, timestamp);
      project.workflowArtifacts = workflows;
      project.analysisState = buildAnalysisStateAtStage(
        project,
        workflows,
        timestamp,
        'Finalized'
      );
      project.auditTrail = [
        {
          id: faker.string.uuid(),
          timestamp: timestamp - 7000,
          type: 'analysis.finalized',
          actor: 'admin',
          reason: 'Seeded finalized analysis run',
          metadata: { projectId: project.id },
        },
      ];
      return project;
    }

    // ── Complete: everything finalized ────────────────────────────────
    case 'complete': {
      const levels = makeCompleteDocs(name, index);
      const project = buildBaseProject(index, phase, levels);
      const workflows = buildSyncedWorkflowArtifacts(project, timestamp);
      project.docWorkspace = buildFinalizedDocWorkspace(project, timestamp);
      project.workflowArtifacts = workflows;
      project.analysisState = buildAnalysisStateAtStage(
        project,
        workflows,
        timestamp,
        'Finalized'
      );
      project.auditTrail = [
        {
          id: faker.string.uuid(),
          timestamp: timestamp - 12000,
          type: 'workflow.synced',
          actor: 'admin',
          reason: 'Seeded fully synced workflow tree',
          metadata: { projectId: project.id },
        },
        {
          id: faker.string.uuid(),
          timestamp: timestamp - 7000,
          type: 'analysis.finalized',
          actor: 'admin',
          reason: 'Seeded finalized analysis run',
          metadata: { projectId: project.id },
        },
        {
          id: faker.string.uuid(),
          timestamp: timestamp - 3000,
          type: 'project.finalized',
          actor: 'admin',
          reason: 'Seeded finalized project state',
          metadata: { projectId: project.id },
        },
      ];
      return project;
    }
  }
}

// ---------------------------------------------------------------------------
// Public generators
// ---------------------------------------------------------------------------

export function generateInitialProjects(count: number = TOTAL_PROJECTS): SOPProject[] {
  const bounded = Math.max(0, Math.min(TOTAL_PROJECTS, count));
  return Array.from({ length: bounded }, (_, index) => generatePhaseProject(index));
}

export function generateMockEmployee(): Employee {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const status = faker.helpers.arrayElement<Employee['status']>([
    'active',
    'active',
    'active',
    'invited',
    'inactive',
  ]);

  return {
    id: faker.string.uuid(),
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    department: faker.helpers.arrayElement(DEPARTMENTS),
    role: faker.helpers.arrayElement(EMPLOYEE_ROLES),
    status,
    assignedProjects: faker.number.int({ min: status === 'invited' ? 0 : 1, max: 6 }),
    lastActiveAt: faker.date.recent({ days: 14 }).getTime(),
  };
}

export function generateInitialEmployees(count: number = 12): Employee[] {
  return Array.from({ length: count }, () => generateMockEmployee());
}
