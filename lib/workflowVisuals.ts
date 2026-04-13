import { LevelDoc, SOPProject, WorkflowArtifact, WorkflowLevel } from "@/lib/store/useStore";

// ---------------------------------------------------------------------------
// Official flowchart standards metadata (FR-WFR-5)
// ---------------------------------------------------------------------------

/** Reference to the official flowchart standards documentation. */
export const STANDARDS_REF = "docs/information/6. Flowcharting Standards-20260402091844.md";

/** Official connector style for all flowchart surfaces. */
export const CONNECTOR_STYLE = {
  stroke: "#64748b",
  strokeWidth: 1.5,
} as const;

/** SVG arrow marker definition attributes used on all flowchart surfaces. */
export const ARROW_MARKER = {
  id: "flow-arrow",
  markerWidth: 8,
  markerHeight: 8,
  refX: 7,
  refY: 4,
  orient: "auto" as const,
  markerUnits: "strokeWidth" as const,
  path: "M 0 0 L 8 4 L 0 8 z",
  fill: "#64748b",
} as const;

/** Maps SOP document level to its canonical flowchart shape per official legend. */
export const LEVEL_TO_SHAPE: Record<WorkflowLevel, FlowShape> = {
  L1: "system",
  L2: "process",
  L3: "process",
  L4: "document",
};

export type FlowShape =
  | "startEnd"
  | "process"
  | "review"
  | "decision"
  | "system"
  | "document"
  | "handoff";

export interface FlowRow {
  id: string;
  label: string;
  stageDoc: LevelDoc | null;
  procedures: LevelDoc[];
}

export interface FlowNode {
  id: string;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  shape: FlowShape;
  workflowId?: string;
  docId?: string;
  isFocused?: boolean;
}

export interface FlowEdge {
  id: string;
  path: string;
}

export interface WorkflowVisualStatus {
  key:
    | "not-generated"
    | "needs-review"
    | "needs-clickup"
    | "synced"
    | "stale"
    | "blocked";
  badgeLabel: string;
  badgeFill: string;
  stroke: string;
  dash?: string;
  queueLabel: "Synced" | "Pending";
}

export interface WorkflowCoverageSummary {
  requiredCount: number;
  requiredSyncedCount: number;
  optionalCount: number;
  optionalSyncedCount: number;
}

export interface DocWorkflowPathStep {
  id: string;
  docId: string;
  level: WorkflowLevel;
  label: string;
  subtitle: string;
  workflow?: WorkflowArtifact;
  isFocused: boolean;
}

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 62;

const VALID_SHAPES = new Set<FlowShape>([
  "startEnd",
  "process",
  "review",
  "decision",
  "system",
  "document",
  "handoff",
]);

/**
 * Validate that a shape is part of the official standards vocabulary.
 * Throws in development if an unsupported shape is encountered.
 */
export function assertValidShape(shape: string): asserts shape is FlowShape {
  if (!VALID_SHAPES.has(shape as FlowShape)) {
    throw new Error(
      `[workflowVisuals] Unsupported shape "${shape}". ` +
        `Valid shapes: ${[...VALID_SHAPES].join(", ")}. See ${STANDARDS_REF}`
    );
  }
}

export const SHAPE_STYLES: Record<FlowShape, { fill: string; label: string; palette: string }> = {
  startEnd: {
    fill: "#bbf7d0",
    label: "Start / End",
    palette: "Space Green",
  },
  process: {
    fill: "#bfdbfe",
    label: "Process Step",
    palette: "Space Blue",
  },
  review: {
    fill: "#fde68a",
    label: "Review / Verification",
    palette: "Space Yellow",
  },
  decision: {
    fill: "#fdba74",
    label: "Decision Point",
    palette: "Space Orange",
  },
  system: {
    fill: "#d1d5db",
    label: "Core Application",
    palette: "Space Grey",
  },
  document: {
    fill: "#86efac",
    label: "Digital Document",
    palette: "Space Green",
  },
  handoff: {
    fill: "#fecaca",
    label: "Handoff",
    palette: "Space Red",
  },
};

export const splitLabelIntoLines = (label: string, maxChars = 20) => {
  const words = label.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= maxChars) {
      current = candidate;
      return;
    }
    if (current.length > 0) {
      lines.push(current);
      current = word;
      return;
    }
    lines.push(word.slice(0, maxChars));
    current = word.slice(maxChars);
  });
  if (current.length > 0) lines.push(current);
  return lines.slice(0, 3);
};

export const resolveWorkflowVisualStatus = (workflow?: WorkflowArtifact): WorkflowVisualStatus => {
  if (!workflow) {
    return {
      key: "not-generated",
      stroke: "#3b82f6",
      badgeLabel: "Not Generated",
      badgeFill: "#3b82f6",
      queueLabel: "Pending",
    };
  }

  if (
    workflow.blocked ||
    workflow.linkHealthStatus === "Invalid" ||
    workflow.linkHealthStatus === "Auth Required"
  ) {
    return {
      key: "blocked",
      stroke: "#ef4444",
      badgeLabel: workflow.blocked ? "Blocked" : workflow.linkHealthStatus,
      badgeFill: "#ef4444",
      queueLabel: "Pending",
    };
  }

  if (workflow.stale) {
    return {
      key: "stale",
      stroke: "#f59e0b",
      dash: "6 4",
      badgeLabel: "Stale",
      badgeFill: "#f59e0b",
      queueLabel: "Pending",
    };
  }

  if (workflow.lifecycleState === "Synced" && workflow.linkHealthStatus === "Valid") {
    return {
      key: "synced",
      stroke: "#22c55e",
      badgeLabel: "Synced",
      badgeFill: "#22c55e",
      queueLabel: "Synced",
    };
  }

  if (workflow.lifecycleState === "Needs ClickUp Update") {
    return {
      key: "needs-clickup",
      stroke: "#f59e0b",
      badgeLabel: "Needs ClickUp",
      badgeFill: "#f59e0b",
      queueLabel: "Pending",
    };
  }

  if (workflow.lifecycleState === "Generated (Needs Review)") {
    return {
      key: "needs-review",
      stroke: "#eab308",
      badgeLabel: "Needs Review",
      badgeFill: "#eab308",
      queueLabel: "Pending",
    };
  }

  return {
    key: "not-generated",
    stroke: "#3b82f6",
    badgeLabel: "Not Generated",
    badgeFill: "#3b82f6",
    queueLabel: "Pending",
  };
};

export const buildFlowRows = (project: SOPProject): FlowRow[] => {
  if (project.pathComplexity !== "complex" || project.levels.L3.length === 0) {
    return [
      {
        id: "simple-path",
        label: "Simple Path Procedures",
        stageDoc: null,
        procedures: project.levels.L4,
      },
    ];
  }

  const stageIdSet = new Set(project.levels.L3.map((stage) => stage.id));
  const fallbackStageId = project.levels.L3[0].id;
  const proceduresByStage = new Map<string, LevelDoc[]>();
  project.levels.L3.forEach((stage) => {
    proceduresByStage.set(stage.id, []);
  });

  project.levels.L4.forEach((procedure) => {
    const stageId =
      procedure.parentStageId && stageIdSet.has(procedure.parentStageId)
        ? procedure.parentStageId
        : fallbackStageId;
    const current = proceduresByStage.get(stageId) ?? [];
    proceduresByStage.set(stageId, [...current, procedure]);
  });

  return project.levels.L3.map((stage) => ({
    id: stage.id,
    label: stage.title,
    stageDoc: stage,
    procedures: proceduresByStage.get(stage.id) ?? [],
  }));
};

export const buildCombinedWorkflowFlowchart = (
  project: SOPProject,
  workflowByDocId: Map<string, WorkflowArtifact>
) => {
  const flowRows = buildFlowRows(project);
  const rowGap = 170;
  const rowStartY = 110;
  const rowCount = Math.max(flowRows.length, 1);
  const rowYs = Array.from({ length: rowCount }).map((_, index) => rowStartY + index * rowGap);
  const decisionCenterY = rowYs[0] + ((rowCount - 1) * rowGap) / 2;

  const startX = 40;
  const l1X = 260;
  const l2X = 480;
  const decisionX = 700;
  const stageX = 940;
  const firstProcedureX = 1170;
  const procedureGap = 212;

  const maxProcedureCount = Math.max(...flowRows.map((row) => Math.max(row.procedures.length, 1)));
  const maxReviewX = firstProcedureX + (maxProcedureCount - 1) * procedureGap + 220;
  const endX = maxReviewX + 220;
  const chartWidth = endX + NODE_WIDTH + 80;
  const chartHeight = rowYs[rowYs.length - 1] + 160;

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const startNode: FlowNode = {
    id: "start",
    label: "Start",
    subtitle: "Process Intake",
    shape: "startEnd",
    x: startX,
    y: decisionCenterY - NODE_HEIGHT / 2,
  };
  const l1Node: FlowNode = {
    id: "l1",
    label: project.levels.L1.title,
    subtitle: "L1 Process Overview",
    shape: "system",
    x: l1X,
    y: decisionCenterY - NODE_HEIGHT / 2,
    docId: project.levels.L1.id,
    workflowId: workflowByDocId.get(project.levels.L1.id)?.id,
  };
  const l2Node: FlowNode = {
    id: "l2",
    label: project.levels.L2.title,
    subtitle: "L2 Master Process",
    shape: "process",
    x: l2X,
    y: decisionCenterY - NODE_HEIGHT / 2,
    docId: project.levels.L2.id,
    workflowId: workflowByDocId.get(project.levels.L2.id)?.id,
  };
  const decisionNode: FlowNode = {
    id: "decision",
    label: project.pathComplexity === "complex" ? "Complex Path?" : "Simple Path?",
    subtitle: "Litmus Test",
    shape: "decision",
    x: decisionX,
    y: decisionCenterY - NODE_HEIGHT / 2,
  };
  const endNode: FlowNode = {
    id: "end",
    label: "End",
    subtitle: "Synced Workflow Set",
    shape: "startEnd",
    x: endX,
    y: decisionCenterY - NODE_HEIGHT / 2,
  };

  nodes.push(startNode, l1Node, l2Node, decisionNode, endNode);

  const makeRight = (node: FlowNode) => ({
    x: node.x + NODE_WIDTH,
    y: node.y + NODE_HEIGHT / 2,
  });
  const makeLeft = (node: FlowNode) => ({
    x: node.x,
    y: node.y + NODE_HEIGHT / 2,
  });
  const direct = (from: FlowNode, to: FlowNode) =>
    `M ${makeRight(from).x} ${makeRight(from).y} L ${makeLeft(to).x} ${makeLeft(to).y}`;
  const elbow = (from: FlowNode, to: FlowNode, midX: number) =>
    `M ${makeRight(from).x} ${makeRight(from).y} L ${midX} ${makeRight(from).y} L ${midX} ${
      makeLeft(to).y
    } L ${makeLeft(to).x} ${makeLeft(to).y}`;

  edges.push(
    { id: "edge-start-l1", path: direct(startNode, l1Node) },
    { id: "edge-l1-l2", path: direct(l1Node, l2Node) },
    { id: "edge-l2-decision", path: direct(l2Node, decisionNode) }
  );

  flowRows.forEach((row, rowIndex) => {
    const rowY = rowYs[rowIndex];
    const stageDoc = row.stageDoc;
    const stageWorkflow = stageDoc ? workflowByDocId.get(stageDoc.id) : undefined;
    const stageNode: FlowNode = {
      id: `row:${row.id}:stage`,
      label: stageDoc ? stageDoc.title : "L4 Procedure Group",
      subtitle: stageDoc ? "L3 Process Stage" : "Simple Path",
      shape: "process",
      x: stageX,
      y: rowY - NODE_HEIGHT / 2,
      workflowId: stageWorkflow?.id,
      docId: stageDoc?.id,
    };
    nodes.push(stageNode);
    edges.push({
      id: `edge-decision-stage-${row.id}`,
      path: elbow(decisionNode, stageNode, decisionNode.x + NODE_WIDTH + 44),
    });

    let previousNode = stageNode;
    if (row.procedures.length > 0) {
      row.procedures.forEach((procedure, procedureIndex) => {
        const procedureWorkflow = workflowByDocId.get(procedure.id);
        const procedureNode: FlowNode = {
          id: `row:${row.id}:procedure:${procedure.id}`,
          label: procedure.title,
          subtitle: "L4 Procedure",
          shape: "document",
          x: firstProcedureX + procedureIndex * procedureGap,
          y: rowY - NODE_HEIGHT / 2,
          workflowId: procedureWorkflow?.id,
          docId: procedure.id,
        };
        nodes.push(procedureNode);
        edges.push({
          id: `edge-${previousNode.id}-${procedureNode.id}`,
          path: direct(previousNode, procedureNode),
        });
        previousNode = procedureNode;
      });
    }

    const reviewX =
      row.procedures.length > 0
        ? firstProcedureX + (row.procedures.length - 1) * procedureGap + 220
        : firstProcedureX + 40;
    const reviewNode: FlowNode = {
      id: `row:${row.id}:review`,
      label: "Review / Verification",
      subtitle: "Governance Check",
      shape: "review",
      x: reviewX,
      y: rowY - NODE_HEIGHT / 2,
    };
    nodes.push(reviewNode);
    edges.push({
      id: `edge-${previousNode.id}-${reviewNode.id}`,
      path: direct(previousNode, reviewNode),
    });
    edges.push({
      id: `edge-review-end-${row.id}`,
      path: elbow(reviewNode, endNode, reviewNode.x + NODE_WIDTH + 44),
    });
  });

  return {
    width: chartWidth,
    height: chartHeight,
    nodes,
    edges,
  };
};

const isSyncedWorkflow = (workflow?: WorkflowArtifact) =>
  !!workflow && workflow.lifecycleState === "Synced" && workflow.linkHealthStatus === "Valid";

export const buildWorkflowCoverageSummary = (
  project: SOPProject,
  workflowByDocId: Map<string, WorkflowArtifact>
): WorkflowCoverageSummary => {
  const requiredDocIds =
    project.pathComplexity === "complex"
      ? [project.levels.L2.id, ...project.levels.L3.map((doc) => doc.id), ...project.levels.L4.map((doc) => doc.id)]
      : [...project.levels.L4.map((doc) => doc.id)];

  const optionalDocIds =
    project.pathComplexity === "complex"
      ? [project.levels.L1.id]
      : [project.levels.L1.id, project.levels.L2.id];

  const requiredSyncedCount = requiredDocIds.filter((docId) =>
    isSyncedWorkflow(workflowByDocId.get(docId))
  ).length;
  const optionalSyncedCount = optionalDocIds.filter((docId) =>
    isSyncedWorkflow(workflowByDocId.get(docId))
  ).length;

  return {
    requiredCount: requiredDocIds.length,
    requiredSyncedCount,
    optionalCount: optionalDocIds.length,
    optionalSyncedCount,
  };
};

// ---------------------------------------------------------------------------
// Doc-specific flowchart engine (FR-WFR-3 / FR-WFR-4)
// ---------------------------------------------------------------------------

export interface DocFlowchart {
  width: number;
  height: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/**
 * Build a vertical, doc-focused flowchart showing the dependency path for a
 * specific document plus Start/Review/End bookends. Uses the official
 * shape/color grammar from LEVEL_TO_SHAPE and SHAPE_STYLES.
 *
 * `buildDocWorkflowPath` is retained as supplemental breadcrumb metadata;
 * this function produces the primary visual artifact.
 */
export const buildDocWorkflowFlowchart = (
  project: SOPProject,
  docId: string,
  workflowByDocId: Map<string, WorkflowArtifact>
): DocFlowchart => {
  const pathSteps = buildDocWorkflowPath(project, docId, workflowByDocId);
  if (pathSteps.length === 0) return { width: 0, height: 0, nodes: [], edges: [] };

  const VERTICAL_GAP = 72;
  const PADDING_X = 40;
  const PADDING_Y = 28;
  const centerX = PADDING_X;

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let currentY = PADDING_Y;

  // Start node
  nodes.push({
    id: "doc-start",
    label: "Start",
    subtitle: "Process Entry",
    shape: "startEnd",
    x: centerX,
    y: currentY,
    isFocused: false,
  });
  currentY += NODE_HEIGHT + VERTICAL_GAP;

  // Dependency-path nodes
  pathSteps.forEach((step) => {
    assertValidShape(LEVEL_TO_SHAPE[step.level]);
    nodes.push({
      id: `doc-path:${step.docId}`,
      label: step.label,
      subtitle: `${step.level} · ${step.subtitle}`,
      shape: LEVEL_TO_SHAPE[step.level],
      x: centerX,
      y: currentY,
      workflowId: step.workflow?.id,
      docId: step.docId,
      isFocused: step.isFocused,
    });
    currentY += NODE_HEIGHT + VERTICAL_GAP;
  });

  // Review node
  nodes.push({
    id: "doc-review",
    label: "Review / Verification",
    subtitle: "Governance Check",
    shape: "review",
    x: centerX,
    y: currentY,
    isFocused: false,
  });
  currentY += NODE_HEIGHT + VERTICAL_GAP;

  // End node
  nodes.push({
    id: "doc-end",
    label: "End",
    subtitle: "Synced Workflow",
    shape: "startEnd",
    x: centerX,
    y: currentY,
    isFocused: false,
  });

  // Vertical connector edges
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i];
    const to = nodes[i + 1];
    edges.push({
      id: `doc-edge-${i}`,
      path: `M ${from.x + NODE_WIDTH / 2} ${from.y + NODE_HEIGHT} L ${to.x + NODE_WIDTH / 2} ${to.y}`,
    });
  }

  return {
    width: NODE_WIDTH + PADDING_X * 2,
    height: currentY + NODE_HEIGHT + PADDING_Y,
    nodes,
    edges,
  };
};

const findDocById = (project: SOPProject, docId: string): LevelDoc | null =>
  [project.levels.L1, project.levels.L2, ...project.levels.L3, ...project.levels.L4].find(
    (candidate) => candidate.id === docId
  ) ?? null;

const getDocLevel = (project: SOPProject, docId: string): WorkflowLevel => {
  if (project.levels.L1.id === docId) return "L1";
  if (project.levels.L2.id === docId) return "L2";
  if (project.levels.L3.some((candidate) => candidate.id === docId)) return "L3";
  return "L4";
};

export const buildDocWorkflowPath = (
  project: SOPProject,
  docId: string,
  workflowByDocId: Map<string, WorkflowArtifact>
): DocWorkflowPathStep[] => {
  const focusedDoc = findDocById(project, docId);
  if (!focusedDoc) return [];

  const focusedLevel = getDocLevel(project, docId);
  const pathDocs: { doc: LevelDoc; level: WorkflowLevel; subtitle: string }[] = [];

  const pushStep = (doc: LevelDoc, level: WorkflowLevel, subtitle: string) => {
    if (pathDocs.some((candidate) => candidate.doc.id === doc.id)) return;
    pathDocs.push({ doc, level, subtitle });
  };

  if (focusedLevel === "L1") {
    pushStep(project.levels.L1, "L1", "Process Overview");
  } else if (focusedLevel === "L2") {
    pushStep(project.levels.L1, "L1", "Process Overview");
    pushStep(project.levels.L2, "L2", "Master Process");
  } else if (focusedLevel === "L3") {
    pushStep(project.levels.L1, "L1", "Process Overview");
    pushStep(project.levels.L2, "L2", "Master Process");
    pushStep(focusedDoc, "L3", "Process Stage");
  } else {
    pushStep(project.levels.L1, "L1", "Process Overview");
    pushStep(project.levels.L2, "L2", "Master Process");
    if (project.pathComplexity === "complex") {
      const parentStage =
        project.levels.L3.find((candidate) => candidate.id === focusedDoc.parentStageId) ??
        project.levels.L3[0];
      if (parentStage) {
        pushStep(parentStage, "L3", "Parent Stage");
      }
    }
    pushStep(focusedDoc, "L4", "Procedure");
  }

  return pathDocs.map((entry) => ({
    id: `path:${entry.doc.id}`,
    docId: entry.doc.id,
    level: entry.level,
    label: entry.doc.title,
    subtitle: entry.subtitle,
    workflow: workflowByDocId.get(entry.doc.id),
    isFocused: entry.doc.id === docId,
  }));
};
