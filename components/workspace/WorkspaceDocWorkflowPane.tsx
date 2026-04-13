"use client";

import Link from "next/link";
import {
  CheckCircle,
  ClockCounterClockwise,
  Link as LinkIcon,
  Lock,
  SealCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { Capabilities, SOPProject, useStore } from "@/lib/store/useStore";
import { buildDocWorkflowFlowchart, resolveWorkflowVisualStatus } from "@/lib/workflowVisuals";
import { DocFlowchartView } from "@/components/workflow/DocFlowchartView";
import { cn } from "@/lib/utils";

interface WorkspaceDocWorkflowPaneProps {
  project: SOPProject;
  docId: string;
  capabilities: Capabilities;
}

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

export function WorkspaceDocWorkflowPane({
  project,
  docId,
  capabilities,
}: WorkspaceDocWorkflowPaneProps) {
  const {
    generateWorkflow,
    regenerateWorkflowFromChildren,
    submitWorkflowProof,
    verifyWorkflowSync,
    setWorkflowClickupResource,
    runWorkflowLinkHealthSweep,
  } = useStore();

  const workflows = Object.values(project.workflowArtifacts ?? {});
  const workflowByDocId = new Map(workflows.map((workflow) => [workflow.docId, workflow]));
  const workflow = workflowByDocId.get(docId);
  const visualStatus = resolveWorkflowVisualStatus(workflow);
  const docFlowchart = buildDocWorkflowFlowchart(project, docId, workflowByDocId);
  const workflowById = Object.fromEntries(workflows.map((w) => [w.id, w]));
  const proofDraft = {
    reviewedChanges: workflow?.proof?.reviewedChanges ?? false,
    clickupUpdated: workflow?.proof?.clickupUpdated ?? false,
    embedVerified: workflow?.proof?.embedVerified ?? false,
  };

  const updateProof = (
    key: keyof Pick<typeof proofDraft, "reviewedChanges" | "clickupUpdated" | "embedVerified">,
    value: boolean
  ) => {
    if (!workflow) return;
    submitWorkflowProof(project.id, workflow.id, {
      ...proofDraft,
      [key]: value,
    });
  };

  const handleProvisionLink = () => {
    if (!workflow) return;
    const clickupResourceId = `wf-${workflow.id.replace(/[:]/g, "-")}`;
    setWorkflowClickupResource(project.id, workflow.id, {
      clickupResourceType: "doc",
      clickupResourceId,
      clickupUrl: `https://app.clickup.com/t/${clickupResourceId}`,
    });
  };

  if (!workflow) {
    return (
      <div className="h-full p-4 lg:p-6 bg-canvas">
        <div className="rounded-xl border border-subtle bg-surface p-4 text-sm text-text-muted">
          No workflow artifact is currently registered for this document.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-canvas overflow-auto custom-scrollbar p-4 lg:p-6 space-y-4">
      <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Workflow mode</p>
            <h3 className="text-sm font-bold text-text-primary">{workflow.title}</h3>
          </div>
          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", STATUS_PILL_CLASSNAME[visualStatus.key])}>
            {visualStatus.badgeLabel}
          </span>
        </div>
        <div className="text-[11px] text-text-muted flex flex-wrap items-center gap-2">
          <span>{workflow.lifecycleState}</span>
          <span>•</span>
          <span>Link: {workflow.linkHealthStatus}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${project.id}/docs/${docId}/workflow`}
            className="px-2.5 py-1 rounded border border-subtle text-xs font-bold"
          >
            Open full workflow
          </Link>
          <button
            onClick={() => runWorkflowLinkHealthSweep(project.id)}
            className="px-2.5 py-1 rounded border border-subtle text-xs font-bold flex items-center gap-1.5"
          >
            <LinkIcon size={12} />
            Check links
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
        <h4 className="text-sm font-bold">Doc workflow flowchart</h4>
        <DocFlowchartView
          flowchart={docFlowchart}
          workflowById={workflowById}
          ariaLabel={`${workflow.title} flowchart`}
        />
      </section>

      <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
        <h4 className="text-sm font-bold">Quick actions</h4>
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
            const checked = proofDraft[item.key as keyof typeof proofDraft];
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
                    updateProof(item.key as keyof typeof proofDraft, event.target.checked)
                  }
                />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generateWorkflow(project.id, workflow.id)}
            className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
          >
            Generate
          </button>
          <button
            onClick={() => regenerateWorkflowFromChildren(project.id, workflow.id)}
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
              submitWorkflowProof(project.id, workflow.id, {
                ...proofDraft,
              })
            }
            className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit proof
          </button>
          <button
            disabled={!capabilities.canVerifyWorkflowSync}
            onClick={() =>
              verifyWorkflowSync(project.id, workflow.id, {
                approved: true,
              })
            }
            className="px-3 py-1.5 rounded-lg bg-status-success text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {capabilities.canVerifyWorkflowSync ? <SealCheck size={13} /> : <Lock size={13} />}
            Verify & Sync
          </button>
          {visualStatus.queueLabel === "Synced" ? (
            <span className="text-xs font-semibold text-status-success flex items-center gap-1 ml-auto">
              <CheckCircle size={13} />
              Synced
            </span>
          ) : (
            <span className="text-xs text-status-premium flex items-center gap-1 ml-auto">
              <WarningCircle size={13} />
              Pending
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
