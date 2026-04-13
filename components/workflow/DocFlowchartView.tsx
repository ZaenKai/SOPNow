"use client";

import {
  ARROW_MARKER,
  CONNECTOR_STYLE,
  type DocFlowchart,
  type FlowNode,
  type FlowShape,
  NODE_HEIGHT,
  NODE_WIDTH,
  SHAPE_STYLES,
  STANDARDS_REF,
  resolveWorkflowVisualStatus,
  splitLabelIntoLines,
} from "@/lib/workflowVisuals";
import type { WorkflowArtifact } from "@/lib/store/useStore";

interface DocFlowchartViewProps {
  flowchart: DocFlowchart;
  workflowById: Record<string, WorkflowArtifact | undefined>;
  /** Show the compact official legend below the chart. */
  showLegend?: boolean;
  ariaLabel?: string;
}

function renderShape(
  shape: FlowShape,
  stroke: string,
  strokeWidth: number,
  dash?: string
) {
  const shapeStyle = SHAPE_STYLES[shape];
  const props = {
    fill: shapeStyle.fill,
    stroke,
    strokeWidth,
    strokeDasharray: dash,
  };

  switch (shape) {
    case "startEnd":
      return <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEIGHT} rx={30} {...props} />;
    case "process":
      return <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEIGHT} rx={12} {...props} />;
    case "system":
      return <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEIGHT} rx={20} {...props} />;
    case "review":
      return (
        <path
          d={`M 12 0 L ${NODE_WIDTH} 0 L ${NODE_WIDTH - 12} ${NODE_HEIGHT} L 0 ${NODE_HEIGHT} Z`}
          {...props}
        />
      );
    case "decision":
      return (
        <path
          d={`M ${NODE_WIDTH / 2} 0 L ${NODE_WIDTH} ${NODE_HEIGHT / 2} L ${NODE_WIDTH / 2} ${NODE_HEIGHT} L 0 ${NODE_HEIGHT / 2} Z`}
          {...props}
        />
      );
    default:
      // document / handoff — document shape with folded corner
      return (
        <g>
          <path
            d={`M 0 0 H ${NODE_WIDTH - 20} L ${NODE_WIDTH} 20 V ${NODE_HEIGHT} H 0 Z`}
            {...props}
          />
          <path
            d={`M ${NODE_WIDTH - 20} 0 V 20 H ${NODE_WIDTH}`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </g>
      );
  }
}

function NodeGroup({ node, workflow }: { node: FlowNode; workflow?: WorkflowArtifact }) {
  const visualStatus = resolveWorkflowVisualStatus(workflow);
  const isFocused = !!node.isFocused;
  const strokeWidth = isFocused ? 3 : 2;
  const lines = splitLabelIntoLines(node.label, 18);

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      {renderShape(node.shape, visualStatus.stroke, strokeWidth, visualStatus.dash)}
      {lines.map((line, lineIndex) => (
        <text
          key={lineIndex}
          x={NODE_WIDTH / 2}
          y={NODE_HEIGHT / 2 - ((lines.length - 1) * 6) + lineIndex * 13}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight={600}
          fill="#1e293b"
        >
          {line}
        </text>
      ))}
      {node.subtitle && (
        <text
          x={NODE_WIDTH / 2}
          y={NODE_HEIGHT + 14}
          textAnchor="middle"
          fontSize={9}
          fill="#64748b"
        >
          {node.subtitle}
        </text>
      )}
      {/* Status badge */}
      {node.workflowId && (
        <g transform={`translate(${NODE_WIDTH - 6}, -6)`}>
          <rect x={-40} y={-5} width={46} height={16} rx={8} fill={visualStatus.badgeFill} />
          <text x={-17} y={6} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">
            {visualStatus.key === "synced" ? "✓" : visualStatus.key === "blocked" ? "✕" : "…"}
          </text>
        </g>
      )}
      {/* Focus ring */}
      {isFocused && (
        <rect
          x={-4}
          y={-4}
          width={NODE_WIDTH + 8}
          height={NODE_HEIGHT + 8}
          rx={16}
          fill="none"
          stroke="var(--color-brand-primary, #6366f1)"
          strokeWidth={2}
          strokeDasharray="6 3"
          opacity={0.5}
        />
      )}
    </g>
  );
}

const LEGEND_SHAPES: FlowShape[] = ["startEnd", "process", "system", "document", "review"];

export function DocFlowchartView({
  flowchart,
  workflowById,
  showLegend = false,
  ariaLabel = "Doc workflow flowchart",
}: DocFlowchartViewProps) {
  if (flowchart.nodes.length === 0) {
    return (
      <p className="text-sm text-text-muted py-4">No dependency data available for this document.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-subtle bg-canvas overflow-auto">
        <svg
          width={flowchart.width}
          height={flowchart.height}
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <marker
              id={ARROW_MARKER.id}
              markerWidth={ARROW_MARKER.markerWidth}
              markerHeight={ARROW_MARKER.markerHeight}
              refX={ARROW_MARKER.refX}
              refY={ARROW_MARKER.refY}
              orient={ARROW_MARKER.orient}
              markerUnits={ARROW_MARKER.markerUnits}
            >
              <path d={ARROW_MARKER.path} fill={ARROW_MARKER.fill} />
            </marker>
          </defs>

          {flowchart.edges.map((edge) => (
            <path
              key={edge.id}
              d={edge.path}
              fill="none"
              stroke={CONNECTOR_STYLE.stroke}
              strokeWidth={CONNECTOR_STYLE.strokeWidth}
              markerEnd={`url(#${ARROW_MARKER.id})`}
            />
          ))}

          {flowchart.nodes.map((node) => {
            const workflow = node.workflowId ? workflowById[node.workflowId] : undefined;
            return <NodeGroup key={node.id} node={node} workflow={workflow} />;
          })}
        </svg>
      </div>

      {showLegend && (
        <div className="rounded-lg border border-subtle bg-canvas p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
              Legend
            </span>
            <span className="text-[10px] text-text-muted">
              {STANDARDS_REF.split("/").pop()?.replace(/-\d+\.md$/, "")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {LEGEND_SHAPES.map((shape) => (
              <div
                key={shape}
                className="flex items-center gap-1.5 rounded border border-subtle bg-surface px-2 py-1"
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm border border-slate-400"
                  style={{ backgroundColor: SHAPE_STYLES[shape].fill }}
                />
                <span className="text-[10px] font-semibold">{SHAPE_STYLES[shape].label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
