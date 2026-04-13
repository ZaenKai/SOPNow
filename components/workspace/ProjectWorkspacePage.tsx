"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChatCircleText,
  CheckCircle,
  FolderSimple,
  Lock,
  SealCheck,
  SidebarSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { Sidebar } from "@/components/Sidebar";
import { WorkspaceEditorPane } from "@/components/workspace/WorkspaceEditorPane";
import { WorkspaceRightPane } from "@/components/workspace/WorkspaceRightPane";
import { WorkspaceTreePane } from "@/components/workspace/WorkspaceTreePane";
import {
  Capabilities,
  CenterPaneMode,
  evaluateGovernanceGate,
  getCapabilitiesForRole,
  LevelDoc,
  useStore,
} from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";
import { cn } from "@/lib/utils";
type GuardMode = "switch-doc" | "exit-project" | "project-home";
type PaneWidths = { left: number; middle: number; right: number };

const DEFAULT_PANE_WIDTHS: PaneWidths = { left: 24, middle: 46, right: 30 };
const MIN_PANE_PIXELS: PaneWidths = { left: 250, middle: 420, right: 300 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const buildWorkspaceDocHref = (
  projectId: string,
  docId: string,
  options: { notice?: string; center?: CenterPaneMode | null } = {}
) => {
  const query = new URLSearchParams();
  if (options.notice) query.set("notice", options.notice);
  if (options.center) query.set("center", options.center);
  const queryString = query.toString();
  return queryString.length > 0
    ? `/projects/${projectId}/docs/${docId}?${queryString}`
    : `/projects/${projectId}/docs/${docId}`;
};

interface ProjectWorkspacePageProps {
  projectId: string;
  docId: string;
  notice?: string;
  center?: string;
}

interface PendingGuardState {
  mode: GuardMode;
  nextDocId?: string;
}

interface DragSessionState {
  divider: "left" | "right";
  startX: number;
  containerWidth: number;
  startWidths: PaneWidths;
}

export function ProjectWorkspacePage({ projectId, docId, notice, center }: ProjectWorkspacePageProps) {
  useSeedData();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    projects,
    settings,
    setCurrentProject,
    setLastOpenedDoc,
    appendDocHistory,
    projectUIPreferences,
    setPaneWidths,
    setLastMobilePane,
    setCenterPaneMode,
    discardDraft,
    deleteDoc,
    duplicateDoc,
    restoreDeletedDoc,
    finalizeProjectWithGovernance,
  } = useStore();
  const project = projects.find((candidate) => candidate.id === projectId);
  const capabilities: Capabilities = getCapabilitiesForRole(settings.currentUserRole, settings);

  const [viewportWidth, setViewportWidth] = useState(1440);
  const [leftOpenOnTablet, setLeftOpenOnTablet] = useState(false);
  const [guardState, setGuardState] = useState<PendingGuardState | null>(null);
  const [dismissedNoticeKeys, setDismissedNoticeKeys] = useState<Record<string, boolean>>({});
  const [undoDeletedDoc, setUndoDeletedDoc] = useState<LevelDoc | null>(null);
  const [paneWidthsState, setPaneWidthsState] = useState<PaneWidths>(
    projectUIPreferences[projectId]?.paneWidths ?? DEFAULT_PANE_WIDTHS
  );
  const paneWidthsRef = useRef<PaneWidths>(paneWidthsState);
  const dragSessionRef = useRef<DragSessionState | null>(null);
  const [isDraggingDivider, setIsDraggingDivider] = useState<"left" | "right" | null>(null);

  const isDesktop = viewportWidth >= 1200;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1200;
  const isMobile = viewportWidth < 768;
  const noticeKey = `${docId}:${notice ?? "none"}`;
  const activeNotice = notice && !dismissedNoticeKeys[noticeKey] ? notice : null;
  const centerOverrideMode: CenterPaneMode | null =
    center === "workflow" || center === "document" ? center : null;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    paneWidthsRef.current = paneWidthsState;
  }, [paneWidthsState]);


  useEffect(() => {
    if (!project) return;
    const docExists = [project.levels.L1, project.levels.L2, ...project.levels.L3, ...project.levels.L4].some(
      (doc) => doc.id === docId
    );
    if (!docExists) {
      const fallbackDocId = project.levels.L4[0]?.id ?? project.levels.L2.id;
      if (!project.setupCompleted) {
        router.replace(`/projects/${projectId}/setup`);
        return;
      }
      router.replace(
        buildWorkspaceDocHref(projectId, fallbackDocId, {
          notice: "invalid-doc",
          center: centerOverrideMode,
        })
      );
      return;
    }

    setCurrentProject(projectId);
    setLastOpenedDoc(projectId, docId);
    appendDocHistory(projectId, docId);
  }, [
    appendDocHistory,
    centerOverrideMode,
    docId,
    project,
    projectId,
    router,
    setCurrentProject,
    setLastOpenedDoc,
  ]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession) return;

      const minLeft = (MIN_PANE_PIXELS.left / dragSession.containerWidth) * 100;
      const minMiddle = (MIN_PANE_PIXELS.middle / dragSession.containerWidth) * 100;
      const minRight = (MIN_PANE_PIXELS.right / dragSession.containerWidth) * 100;
      const horizontalDeltaPercent = ((event.clientX - dragSession.startX) / dragSession.containerWidth) * 100;

      if (dragSession.divider === "left") {
        const maxLeft = 100 - minMiddle - minRight;
        const nextLeft = clamp(dragSession.startWidths.left + horizontalDeltaPercent, minLeft, maxLeft);
        const nextMiddle = 100 - dragSession.startWidths.right - nextLeft;
        const nextWidths: PaneWidths = {
          left: nextLeft,
          middle: nextMiddle,
          right: 100 - nextLeft - nextMiddle,
        };
        paneWidthsRef.current = nextWidths;
        setPaneWidthsState(nextWidths);
        return;
      }

      const maxRight = 100 - minMiddle - minLeft;
      const nextRight = clamp(dragSession.startWidths.right - horizontalDeltaPercent, minRight, maxRight);
      const nextMiddle = 100 - dragSession.startWidths.left - nextRight;
      const nextWidths: PaneWidths = {
        left: dragSession.startWidths.left,
        middle: nextMiddle,
        right: nextRight,
      };
      paneWidthsRef.current = nextWidths;
      setPaneWidthsState(nextWidths);
    };

    const handleUp = () => {
      if (!dragSessionRef.current) return;
      dragSessionRef.current = null;
      setIsDraggingDivider(null);
      setPaneWidths(projectId, paneWidthsRef.current);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, [projectId, setPaneWidths]);

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-text-muted">Project not found.</p>
      </div>
    );
  }

  const workspace = project.docWorkspace?.[docId];
  const pendingCount = workspace?.proposals.filter((proposal) => proposal.status === "pending").length ?? 0;
  const hasUnsavedWork = !!workspace?.dirty || pendingCount > 0;
  const finalizeProjectGate = evaluateGovernanceGate(project, "finalize-project");
  const activeDoc = [project.levels.L1, project.levels.L2, ...project.levels.L3, ...project.levels.L4].find(
    (doc) => doc.id === docId
  );

  const mobilePane = projectUIPreferences[projectId]?.lastMobilePane ?? "doc";
  const persistedCenterPaneMode =
    projectUIPreferences[projectId]?.centerPaneModeByDocId?.[docId] ?? "document";
  const centerPaneMode: CenterPaneMode = centerOverrideMode ?? persistedCenterPaneMode;

  const handleCenterPaneModeChange = (mode: CenterPaneMode) => {
    setCenterPaneMode(projectId, docId, mode);
    if (centerOverrideMode) {
      router.replace(buildWorkspaceDocHref(projectId, docId, { notice, center: mode }));
    }
  };

  const requestNavigation = (payload: PendingGuardState) => {
    if (hasUnsavedWork) {
      setGuardState(payload);
      return;
    }
    if (payload.mode === "exit-project") {
      router.push("/projects");
      return;
    }
    if (payload.mode === "project-home") {
      router.push(`/projects/${projectId}`);
      return;
    }
    if (payload.nextDocId) {
      router.push(
        buildWorkspaceDocHref(projectId, payload.nextDocId, {
          center: centerOverrideMode,
        })
      );
    }
  };

  const finalizeGuard = (option: "stay" | "leave-keep" | "leave-discard") => {
    if (!guardState) return;
    if (option === "stay") {
      setGuardState(null);
      return;
    }

    if (option === "leave-discard") {
      discardDraft(projectId, docId);
    }

    if (guardState.mode === "exit-project") {
      router.push("/projects");
    } else if (guardState.mode === "project-home") {
      router.push(`/projects/${projectId}`);
    } else if (guardState.nextDocId) {
      router.push(
        buildWorkspaceDocHref(projectId, guardState.nextDocId, {
          center: centerOverrideMode,
        })
      );
    }
    setGuardState(null);
  };

  const handleDeleteDoc = (targetDocId: string) => {
    const result = deleteDoc(projectId, targetDocId);
    if (!result.deletedDoc) return;
    setUndoDeletedDoc(result.deletedDoc);
    if (targetDocId === docId && result.nextDocId) {
      router.replace(
        buildWorkspaceDocHref(projectId, result.nextDocId, {
          notice: "doc-deleted",
          center: centerOverrideMode,
        })
      );
    }
  };

  const beginDividerDrag = (divider: "left" | "right", clientX: number) => {
    if (!containerRef.current) return;
    const { width } = containerRef.current.getBoundingClientRect();
    if (width <= 0) return;
    dragSessionRef.current = {
      divider,
      startX: clientX,
      containerWidth: width,
      startWidths: paneWidthsRef.current,
    };
    setIsDraggingDivider(divider);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const clearNoticeFromUrl = () => {
    if (!notice) return;
    router.replace(
      buildWorkspaceDocHref(projectId, docId, {
        center: centerOverrideMode,
      })
    );
  };

  return (
    <div className="flex h-full min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 pl-[var(--sidebar-width,16rem)] h-screen overflow-hidden transition-[padding] duration-200 flex flex-col">
        <header className="h-16 border-b border-subtle glass px-4 lg:px-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => requestNavigation({ mode: "exit-project" })}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
            >
              <ArrowLeft size={13} />
              Back to Projects
            </button>
            <nav aria-label="Breadcrumb" className="text-xs text-text-muted mt-0.5 flex items-center gap-1 min-w-0">
              <Link
                href="/projects"
                onClick={(event) => {
                  event.preventDefault();
                  requestNavigation({ mode: "exit-project" });
                }}
                className="hover:text-text-primary hover:underline underline-offset-2 shrink-0"
              >
                Projects
              </Link>
              <span className="shrink-0">/</span>
              <Link
                href={`/projects/${projectId}`}
                onClick={(event) => {
                  event.preventDefault();
                  requestNavigation({ mode: "project-home" });
                }}
                className="hover:text-text-primary hover:underline underline-offset-2 truncate"
              >
                {project.name}
              </Link>
              <span className="shrink-0">/</span>
              <Link
                href={buildWorkspaceDocHref(projectId, docId, { center: centerOverrideMode })}
                className="truncate text-text-primary hover:text-brand-primary"
                aria-current="page"
              >
                {activeDoc?.title ?? "Document"}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/workflows`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Project Workflows
            </Link>
            <Link
              href={`/projects/${projectId}/docs/${docId}/workflow`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Doc Workflow
            </Link>
            <Link
              href={`/projects/${projectId}/analysis`}
              className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold"
            >
              Analysis
            </Link>
            {project.lifecycle === "ready-to-close" && (
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-status-premium/10 text-status-premium">
                Ready to Close
              </span>
            )}
            <button
              disabled={
                project.lifecycle !== "ready-to-close" ||
                !capabilities.canFinalizeProject ||
                !finalizeProjectGate.ready
              }
              onClick={() => finalizeProjectWithGovernance(projectId)}
              className="px-3 py-1.5 rounded-lg bg-status-success text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              title={finalizeProjectGate.ready ? undefined : finalizeProjectGate.blockers[0]?.message}
            >
              {capabilities.canFinalizeProject ? <SealCheck size={13} weight="fill" /> : <Lock size={13} />}
              Finalize Project
            </button>
          </div>
        </header>

        {activeNotice && (
          <div className="px-4 lg:px-6 py-2 border-b border-status-premium/20 bg-status-premium/10 text-xs flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-status-premium font-semibold">
              <WarningCircle size={14} weight="fill" />
              {activeNotice === "doc-deleted"
                ? "Active document was deleted. Switched to the next available document."
                : "Requested document was invalid. Redirected to the nearest valid route."}
            </span>
            <button
              onClick={() => {
                setDismissedNoticeKeys((current) => ({ ...current, [noticeKey]: true }));
                clearNoticeFromUrl();
              }}
              className="text-[10px] uppercase font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {undoDeletedDoc && (
          <div className="px-4 lg:px-6 py-2 border-b border-brand-primary/20 bg-brand-primary/10 text-xs flex items-center justify-between gap-3">
            <span>
              <strong>{undoDeletedDoc.title}</strong> deleted.
            </span>
            <button
              onClick={() => {
                restoreDeletedDoc(projectId, undoDeletedDoc);
                setUndoDeletedDoc(null);
                setDismissedNoticeKeys((current) => ({ ...current, [noticeKey]: true }));
                clearNoticeFromUrl();
              }}
              className="px-2 py-1 rounded border border-brand-primary/40 text-brand-primary font-bold"
            >
              Undo
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0">
          {isDesktop && (
            <div ref={containerRef} className="h-full flex">
              <section style={{ width: `${paneWidthsState.left}%` }} className="h-full min-w-0">
                <WorkspaceTreePane
                  project={project}
                  activeDocId={docId}
                  capabilities={capabilities}
                  onSelectDoc={(nextDocId) =>
                    requestNavigation({
                      mode: "switch-doc",
                      nextDocId,
                    })
                  }
                  onDeleteDoc={handleDeleteDoc}
                  onDuplicateDoc={(targetDocId) => {
                    const next = duplicateDoc(projectId, targetDocId);
                    if (next) {
                      requestNavigation({ mode: "switch-doc", nextDocId: next });
                    }
                    return next;
                  }}
                />
              </section>

              <button
                onMouseDown={(event) => {
                  event.preventDefault();
                  beginDividerDrag("left", event.clientX);
                }}
                className={cn(
                  "w-1.5 bg-border-subtle hover:bg-brand-primary/40 cursor-col-resize",
                  isDraggingDivider === "left" && "bg-brand-primary/50"
                )}
                aria-label="Resize left pane"
              />

              <section style={{ width: `${paneWidthsState.middle}%` }} className="h-full min-w-0">
                <WorkspaceEditorPane
                  project={project}
                  docId={docId}
                  capabilities={capabilities}
                  centerPaneMode={centerPaneMode}
                  onCenterPaneModeChange={handleCenterPaneModeChange}
                />
              </section>
              <button
                onMouseDown={(event) => {
                  event.preventDefault();
                  beginDividerDrag("right", event.clientX);
                }}
                className={cn(
                  "w-1.5 bg-border-subtle hover:bg-brand-primary/40 cursor-col-resize",
                  isDraggingDivider === "right" && "bg-brand-primary/50"
                )}
                aria-label="Resize right pane"
              />

              <section style={{ width: `${paneWidthsState.right}%` }} className="h-full min-w-0">
                <WorkspaceRightPane project={project} docId={docId} capabilities={capabilities} />
              </section>
            </div>
          )}

          {isTablet && (
            <div className="h-full flex">
              <div className="w-12 border-r border-subtle bg-surface flex flex-col items-center gap-2 py-3">
                <button
                  onClick={() => setLeftOpenOnTablet((current) => !current)}
                  className="w-8 h-8 rounded-lg border border-subtle bg-canvas flex items-center justify-center"
                >
                  <SidebarSimple size={14} />
                </button>
                <button
                  onClick={() => setLastMobilePane(projectId, "doc")}
                  className={cn(
                    "w-8 h-8 rounded-lg border border-subtle bg-canvas flex items-center justify-center",
                    mobilePane === "doc" && "border-brand-primary text-brand-primary"
                  )}
                >
                  <FolderSimple size={14} />
                </button>
                <button
                  onClick={() => setLastMobilePane(projectId, "chat")}
                  className={cn(
                    "w-8 h-8 rounded-lg border border-subtle bg-canvas flex items-center justify-center",
                    mobilePane === "chat" && "border-brand-primary text-brand-primary"
                  )}
                >
                  <ChatCircleText size={14} />
                </button>
              </div>

              {leftOpenOnTablet && (
                <section className="w-72 border-r border-subtle">
                  <WorkspaceTreePane
                    project={project}
                    activeDocId={docId}
                    capabilities={capabilities}
                    onSelectDoc={(nextDocId) => requestNavigation({ mode: "switch-doc", nextDocId })}
                    onDeleteDoc={handleDeleteDoc}
                    onDuplicateDoc={(targetDocId) => {
                      const next = duplicateDoc(projectId, targetDocId);
                      if (next) {
                        requestNavigation({ mode: "switch-doc", nextDocId: next });
                      }
                      return next;
                    }}
                  />
                </section>
              )}

              <section className="flex-1 min-w-0">
                <WorkspaceEditorPane
                  project={project}
                  docId={docId}
                  capabilities={capabilities}
                  centerPaneMode={centerPaneMode}
                  onCenterPaneModeChange={handleCenterPaneModeChange}
                />
              </section>
              <section className="w-[36%] min-w-[300px]">
                <WorkspaceRightPane project={project} docId={docId} capabilities={capabilities} />
              </section>
            </div>
          )}

          {isMobile && (
            <div className="h-full flex flex-col">
              <div className="h-12 border-b border-subtle bg-surface px-3 flex items-center gap-2">
                {[
                  { key: "tree", label: "Tree", icon: SidebarSimple },
                  { key: "doc", label: "Doc", icon: FolderSimple },
                  { key: "chat", label: "Chat", icon: ChatCircleText },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setLastMobilePane(projectId, tab.key as "tree" | "doc" | "chat")}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold border border-subtle flex items-center justify-center gap-1.5",
                      mobilePane === tab.key
                        ? "border-brand-primary text-brand-primary bg-brand-primary/5"
                        : "bg-canvas"
                    )}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0">
                {mobilePane === "tree" && (
                  <WorkspaceTreePane
                    project={project}
                    activeDocId={docId}
                    capabilities={capabilities}
                    onSelectDoc={(nextDocId) => requestNavigation({ mode: "switch-doc", nextDocId })}
                    onDeleteDoc={handleDeleteDoc}
                    onDuplicateDoc={(targetDocId) => {
                      const next = duplicateDoc(projectId, targetDocId);
                      if (next) {
                        requestNavigation({ mode: "switch-doc", nextDocId: next });
                      }
                      return next;
                    }}
                  />
                )}
                {mobilePane === "doc" && (
                  <WorkspaceEditorPane
                    project={project}
                    docId={docId}
                    capabilities={capabilities}
                    centerPaneMode={centerPaneMode}
                    onCenterPaneModeChange={handleCenterPaneModeChange}
                  />
                )}
                {mobilePane === "chat" && (
                  <WorkspaceRightPane project={project} docId={docId} capabilities={capabilities} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {guardState && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-subtle bg-surface p-5 space-y-4">
            <div className="flex items-center gap-2 text-status-premium">
              <WarningCircle size={18} weight="fill" />
              <h3 className="font-bold text-base text-text-primary">Unsaved draft or unresolved proposals</h3>
            </div>
            <p className="text-sm text-text-muted">
              Leaving now can keep or discard the current draft. Pending proposals remain traceable and are not silently deleted.
            </p>
            <div className="grid gap-2">
              <button
                onClick={() => finalizeGuard("stay")}
                className="w-full px-3 py-2 rounded-lg border border-subtle text-sm font-bold"
              >
                Stay
              </button>
              <button
                onClick={() => finalizeGuard("leave-keep")}
                className="w-full px-3 py-2 rounded-lg bg-brand-primary text-white text-sm font-bold"
              >
                Leave & Keep Draft
              </button>
              <button
                onClick={() => finalizeGuard("leave-discard")}
                className="w-full px-3 py-2 rounded-lg bg-status-error text-white text-sm font-bold"
              >
                Leave & Discard Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {project.lifecycle === "finalized" && (
        <div className="fixed bottom-4 right-4 z-[70] rounded-xl border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs text-status-success font-semibold flex items-center gap-1.5">
          <CheckCircle size={14} weight="fill" />
          Project finalized
        </div>
      )}
    </div>
  );
}
