"use client";

import { useState } from "react";
import { Check, ChatCircleText, ClockCounterClockwise, Sparkle, X } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Capabilities, RoleTag, SOPProject, useStore } from "@/lib/store/useStore";

interface WorkspaceRightPaneProps {
  project: SOPProject;
  docId: string;
  capabilities: Capabilities;
}

const ROLE_ORDER: RoleTag[] = ["planner", "writer", "reviewer"];

function parseAgentOverride(input: string): { cleaned: string; agentOverride?: RoleTag } {
  const trimmed = input.trim();
  if (!trimmed.startsWith("@")) return { cleaned: trimmed };
  const [token, ...rest] = trimmed.split(" ");
  const candidate = token.replace("@", "").toLowerCase() as RoleTag;
  if (candidate === "planner" || candidate === "writer" || candidate === "reviewer") {
    return { cleaned: rest.join(" ").trim(), agentOverride: candidate };
  }
  return { cleaned: trimmed };
}

export function WorkspaceRightPane({ project, docId, capabilities }: WorkspaceRightPaneProps) {
  const {
    addDocMessage,
    addProposal,
    applyAllNonConflictingProposals,
    applyProposal,
    rejectAllProposals,
    rejectProposal,
  } = useStore();
  const workspace = project.docWorkspace?.[docId];
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");

  if (!workspace) {
    return (
      <div className="h-full flex items-center justify-center bg-surface border-l border-subtle">
        <p className="text-sm text-text-muted">No right-pane data available.</p>
      </div>
    );
  }

  const pendingProposals = workspace.proposals.filter((proposal) => proposal.status === "pending");
  const unresolvedCount = pendingProposals.length;
  const roleTag = ROLE_ORDER[workspace.activeThread.messages.length % ROLE_ORDER.length];

  const proposalSummary = {
    pending: workspace.proposals.filter((proposal) => proposal.status === "pending").length,
    applied: workspace.proposals.filter((proposal) => proposal.status === "applied").length,
    rejected: workspace.proposals.filter((proposal) => proposal.status === "rejected").length,
    invalidated: workspace.proposals.filter((proposal) => proposal.status === "invalidated").length,
  };

  const sendMessage = () => {
    const parsed = parseAgentOverride(chatInput);
    if (parsed.cleaned.length === 0) return;

    addDocMessage(project.id, docId, {
      role: "user",
      roleTag,
      content: parsed.cleaned,
      agentOverride: parsed.agentOverride,
    });

    addDocMessage(project.id, docId, {
      role: "ai",
      roleTag: parsed.agentOverride ?? roleTag,
      content: `Generated a proposal candidate for "${parsed.cleaned.slice(0, 60)}". Review in the Proposals tab before applying.`,
    });

    addProposal(project.id, docId, {
      title: "Suggested rewrite",
      summary: parsed.cleaned.slice(0, 120),
      targetField: "content",
      contentPatch: `${workspace.draftContent}\n\n[Proposal] ${parsed.cleaned}`,
      conflictKey: "content",
      status: "pending",
    });
    setChatInput("");
  };

  return (
    <div className="h-full border-l border-subtle bg-surface flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-subtle">
          <TabsList className="bg-canvas rounded-lg p-1">
            <TabsTrigger value="chat" className="text-xs">
              Active Chat
            </TabsTrigger>
            <TabsTrigger value="proposals" className="text-xs">
              Proposals
              {unresolvedCount > 0 && (
                <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] bg-status-premium/20 text-status-premium">
                  {unresolvedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 min-h-0 p-3 flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-2">
            {workspace.activeThread.messages.length === 0 && (
              <p className="text-xs text-text-muted">
                Start a document-scoped conversation. Use <code>@planner</code>, <code>@writer</code>, or <code>@reviewer</code> to target an agent role.
              </p>
            )}
            {workspace.activeThread.messages.map((message) => (
              <div key={message.id} className="rounded-lg border border-subtle bg-canvas p-2">
                <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                  <span className="uppercase tracking-widest font-bold">
                    {message.role === "ai" ? "AI" : "User"} · {message.roleTag}
                  </span>
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-subtle mt-3 space-y-2">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              className="w-full min-h-24 px-2.5 py-2 rounded-lg border border-subtle bg-canvas text-xs"
              placeholder="Message agents... (optional: @planner / @writer / @reviewer)"
            />
            <button
              onClick={sendMessage}
              disabled={chatInput.trim().length === 0 || !capabilities.canEditDocs}
              className="w-full px-3 py-2 rounded-lg bg-brand-primary text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="flex-1 min-h-0 p-3 overflow-auto custom-scrollbar">
          <div className="mb-3 rounded-lg border border-subtle bg-canvas p-2 text-[11px] text-text-muted">
            <p>Pending: {proposalSummary.pending}</p>
            <p>Applied: {proposalSummary.applied}</p>
            <p>Rejected: {proposalSummary.rejected}</p>
            <p>Invalidated: {proposalSummary.invalidated}</p>
          </div>
          <div className="flex gap-2 mb-3">
            <button
              disabled={!capabilities.canApplyProposals || pendingProposals.length === 0}
              onClick={() => applyAllNonConflictingProposals(project.id, docId)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-status-success text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply all non-conflicting
            </button>
            <button
              disabled={!capabilities.canApplyProposals || pendingProposals.length === 0}
              onClick={() => rejectAllProposals(project.id, docId)}
              className="flex-1 px-2 py-1.5 rounded-lg border border-subtle text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reject all
            </button>
          </div>
          <div className="space-y-2">
            {workspace.proposals.length === 0 && <p className="text-xs text-text-muted">No proposals yet.</p>}
            {workspace.proposals.map((proposal) => (
              <div key={proposal.id} className="rounded-lg border border-subtle bg-canvas p-2.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold">{proposal.title}</p>
                    <p className="text-[11px] text-text-muted">{proposal.summary}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-text-muted">{proposal.status}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!capabilities.canApplyProposals || proposal.status !== "pending"}
                    onClick={() => applyProposal(project.id, docId, proposal.id)}
                    className="flex-1 px-2 py-1 rounded-lg bg-status-success text-white text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Check size={12} />
                    Apply
                  </button>
                  <button
                    disabled={!capabilities.canApplyProposals || proposal.status !== "pending"}
                    onClick={() => rejectProposal(project.id, docId, proposal.id)}
                    className="flex-1 px-2 py-1 rounded-lg border border-subtle text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <X size={12} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 min-h-0 p-3 overflow-auto custom-scrollbar space-y-3">
          <section className="rounded-lg border border-subtle bg-canvas p-2.5">
            <p className="text-xs uppercase tracking-widest font-bold text-text-muted mb-2">Thread history</p>
            {workspace.threadHistory.length === 0 && <p className="text-xs text-text-muted">No archived threads.</p>}
            {workspace.threadHistory.map((thread) => (
              <div key={thread.id} className="border-t border-subtle pt-2 mt-2">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <ChatCircleText size={13} />
                  Thread {thread.id.slice(0, 8)}
                </p>
                <p className="text-[11px] text-text-muted">
                  {thread.messages.length} messages · closed{" "}
                  {thread.closedAt ? new Date(thread.closedAt).toLocaleString() : "n/a"}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-subtle bg-canvas p-2.5">
            <p className="text-xs uppercase tracking-widest font-bold text-text-muted mb-2">Revision history</p>
            {workspace.revisions.length === 0 && <p className="text-xs text-text-muted">No revisions committed.</p>}
            {workspace.revisions.map((revision) => (
              <div key={revision.id} className="border-t border-subtle pt-2 mt-2">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <ClockCounterClockwise size={13} />
                  {revision.title}
                </p>
                <p className="text-[11px] text-text-muted">{new Date(revision.committedAt).toLocaleString()}</p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-subtle bg-canvas p-2.5 text-[11px] text-text-muted">
            <p className="font-semibold text-xs flex items-center gap-1.5 mb-1">
              <Sparkle size={12} className="text-brand-primary" />
              Proposal conflict policy
            </p>
            <p>Manual edits invalidate only conflicting pending proposals for the touched field.</p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
