"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  ClipboardText,
  FileText,
  FolderSimple,
  GearSix,
  ListChecks,
  Robot,
} from "@phosphor-icons/react";
import { Sidebar } from "@/components/Sidebar";
import { getProjectDocIds, useStore } from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";

const STEPS = [
  { id: 1, title: "Destination Mapping", icon: GearSix },
  { id: 2, title: "Interview", icon: Robot },
  { id: 3, title: "Structure Preview", icon: ClipboardText },
  { id: 4, title: "Setup Complete", icon: ListChecks },
];

export function ProjectSetupPage({ projectId }: { projectId: string }) {
  useSeedData();
  const router = useRouter();
  const {
    projects,
    setCurrentProject,
    updateProject,
    setUnderstanding,
    markProjectSetupComplete,
    setLastOpenedDoc,
  } = useStore();
  const project = projects.find((candidate) => candidate.id === projectId);

  const [step, setStep] = useState(1);
  const [workspace, setWorkspace] = useState(project?.clickupDestination.workspace ?? "Main Workspace");
  const [space, setSpace] = useState(project?.clickupDestination.space ?? project?.department ?? "");
  const [folder, setFolder] = useState(project?.clickupDestination.folder ?? `${project?.name ?? "SOP"} Folder`);
  const [interviewNotes, setInterviewNotes] = useState("");

  const firstDocId = useMemo(() => (project ? getProjectDocIds(project)[0] : null), [project]);

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-text-muted">Project not found.</p>
      </div>
    );
  }

  const openWorkspace = () => {
    if (!firstDocId) return;
    setCurrentProject(projectId);
    setLastOpenedDoc(projectId, firstDocId);
    router.push(`/projects/${projectId}/docs/${firstDocId}`);
  };

  const completeSetup = () => {
    updateProject(projectId, {
      clickupDestination: { workspace, space, folder },
    });
    setUnderstanding(projectId, 100);
    markProjectSetupComplete(projectId);
    openWorkspace();
  };

  return (
    <div className="flex h-full min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 pl-[var(--sidebar-width,16rem)] min-h-screen overflow-auto custom-scrollbar transition-[padding] duration-200">
        <header className="h-20 border-b border-subtle glass sticky top-0 z-40 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">{project.name} Setup</h1>
            <p className="text-xs text-text-muted mt-1">
              {project.setupCompleted
                ? "Setup already completed. You can reopen workspace any time."
                : "Complete the guided setup flow before opening the document workspace."}
            </p>
          </div>
          <button
            onClick={openWorkspace}
            disabled={!project.setupCompleted}
            className="px-4 py-2 rounded-lg text-sm font-bold border border-subtle bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Open Workspace
          </button>
        </header>

        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((currentStep) => (
              <div
                key={currentStep.id}
                className={`rounded-xl border p-3 ${step === currentStep.id ? "border-brand-primary bg-brand-primary/5" : "border-subtle bg-surface"}`}
              >
                <div className="flex items-center gap-2">
                  <currentStep.icon size={16} className={step >= currentStep.id ? "text-brand-primary" : "text-text-muted"} />
                  <p className="text-xs font-bold uppercase tracking-wider">{currentStep.title}</p>
                </div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <section className="bg-surface border border-subtle rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold">Destination mapping</h2>
              <p className="text-sm text-text-muted">
                Configure where this SOP should sync in the workspace hierarchy.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={workspace}
                  onChange={(event) => setWorkspace(event.target.value)}
                  className="px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm"
                  placeholder="Workspace"
                />
                <input
                  value={space}
                  onChange={(event) => setSpace(event.target.value)}
                  className="px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm"
                  placeholder="Space"
                />
                <input
                  value={folder}
                  onChange={(event) => setFolder(event.target.value)}
                  className="px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm"
                  placeholder="Folder"
                />
              </div>
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-bold">
                Continue
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="bg-surface border border-subtle rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold">Interview handoff</h2>
              <p className="text-sm text-text-muted">
                Capture enough intent for the workspace entry point to be deterministic.
              </p>
              <textarea
                value={interviewNotes}
                onChange={(event) => setInterviewNotes(event.target.value)}
                className="w-full min-h-40 px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm"
                placeholder="Summarize expected SOP outcomes, constraints, and quality bar..."
              />
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border border-subtle text-sm font-bold">
                  Back
                </button>
                <button
                  onClick={() => {
                    if (interviewNotes.trim().length > 0) {
                      setUnderstanding(projectId, 80);
                    }
                    setStep(3);
                  }}
                  className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-bold"
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="bg-surface border border-subtle rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold">Structure preview</h2>
              <p className="text-sm text-text-muted">Review stages and documents before opening the editor workspace.</p>
              <div className="rounded-xl border border-subtle bg-canvas overflow-hidden">
                {project.levels.L3.map((stage) => (
                  <div key={stage.id} className="border-b border-subtle last:border-b-0">
                    <div className="px-3 py-2 bg-surface flex items-center justify-between gap-2">
                      <p className="text-sm font-bold flex items-center gap-2 min-w-0">
                        <FolderSimple size={14} className="text-brand-primary shrink-0" />
                        <span className="truncate">{stage.title}</span>
                      </p>
                      <span className="text-[11px] text-text-muted shrink-0">
                        {project.levels.L4.filter((doc) => doc.parentStageId === stage.id).length} docs
                      </span>
                    </div>
                    <div className="divide-y divide-subtle">
                      {project.levels.L4
                        .filter((doc) => doc.parentStageId === stage.id)
                        .map((doc) => (
                          <p key={doc.id} className="px-3 py-1.5 text-xs text-text-muted flex items-center gap-2">
                            <FileText size={12} className="shrink-0" />
                            <span className="truncate">{doc.title}</span>
                          </p>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-subtle text-sm font-bold">
                  Back
                </button>
                <button onClick={() => setStep(4)} className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-bold">
                  Confirm Structure
                </button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="bg-surface border border-subtle rounded-2xl p-8 space-y-5 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-status-success/10 text-status-success flex items-center justify-center">
                <CheckCircle size={30} weight="fill" />
              </div>
              <h2 className="text-xl font-bold">Setup complete</h2>
              <p className="text-sm text-text-muted max-w-2xl mx-auto">
                Destination mapping, interview context, and document structure are ready. Continue to the routed workspace
                to begin editing and collaboration.
              </p>
              <button
                onClick={completeSetup}
                className="mx-auto px-5 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-bold flex items-center gap-2"
              >
                Open Workspace
                <ArrowRight size={16} />
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
