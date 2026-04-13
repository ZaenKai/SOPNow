"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { AnalysisHubShell } from "@/components/analysis/AnalysisHubShell";
import {
  buildDepartmentAnalysisDashboard,
  canAccessDepartmentAnalysis,
  getAccessibleDepartments,
  getCapabilitiesForRole,
  getDepartmentFromSlug,
  toDepartmentSlug,
  useStore,
} from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";

const NIGHTLY_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function AnalysisDepartmentPage({ departmentSlug }: { departmentSlug: string }) {
  useSeedData();
  const router = useRouter();
  const {
    projects,
    settings,
    analysisHubRecommendations,
    analysisHubRefreshMetadata,
    refreshAnalysisHubInsights,
    reviewAnalysisRecommendation,
    dispatchRecommendationAction,
    retryRecommendationActionDispatch,
    updateRecommendationLifecycleState,
  } = useStore();
  const capabilities = getCapabilitiesForRole(settings.currentUserRole, settings);
  const accessibleDepartments = useMemo(
    () => getAccessibleDepartments(settings, projects),
    [projects, settings]
  );
  const fallbackDepartment = accessibleDepartments[0] ?? settings.currentUserDepartment;
  const fallbackDepartmentPath = `/analysis/departments/${toDepartmentSlug(fallbackDepartment)}`;
  const resolvedDepartment = useMemo(
    () => getDepartmentFromSlug(projects, departmentSlug),
    [departmentSlug, projects]
  );
  const isAuthorizedDepartment =
    resolvedDepartment !== null &&
    canAccessDepartmentAnalysis(settings, projects, resolvedDepartment);

  useEffect(() => {
    if (!resolvedDepartment || !isAuthorizedDepartment) {
      router.replace(fallbackDepartmentPath);
    }
  }, [fallbackDepartmentPath, isAuthorizedDepartment, resolvedDepartment, router]);

  useEffect(() => {
    const isStaleRefresh =
      analysisHubRefreshMetadata.stale ||
      !analysisHubRefreshMetadata.lastRefreshedAt ||
      Date.now() - analysisHubRefreshMetadata.lastRefreshedAt >= NIGHTLY_REFRESH_INTERVAL_MS ||
      Object.keys(analysisHubRecommendations).length === 0;
    if (isStaleRefresh) {
      refreshAnalysisHubInsights("nightly");
    }
  }, [
    analysisHubRecommendations,
    analysisHubRefreshMetadata.lastRefreshedAt,
    analysisHubRefreshMetadata.stale,
    refreshAnalysisHubInsights,
  ]);

  const dashboard = useMemo(
    () =>
      buildDepartmentAnalysisDashboard(
        projects,
        analysisHubRecommendations,
        resolvedDepartment ?? fallbackDepartment
      ),
    [analysisHubRecommendations, fallbackDepartment, projects, resolvedDepartment]
  );

  const tabs = [
    ...(capabilities.canViewPortfolioAnalysis
      ? [{ key: "portfolio" as const, href: "/analysis/portfolio", label: "Portfolio" }]
      : []),
    {
      key: "department" as const,
      href: `/analysis/departments/${toDepartmentSlug(resolvedDepartment ?? fallbackDepartment)}`,
      label: "Department",
    },
    { key: "tools" as const, href: "/analysis/tools", label: "Tools" },
  ];

  if (!resolvedDepartment || !isAuthorizedDepartment) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-text-muted">Redirecting to an authorized department…</p>
      </div>
    );
  }

  return (
    <AnalysisHubShell
      title={resolvedDepartment}
      subtitle="Department-scoped process intelligence with shared-process ownership markers and recommendation governance."
      activeTab="department"
      tabs={tabs}
      refreshMetadata={analysisHubRefreshMetadata}
      canRefresh={capabilities.canRefreshAnalysisHub}
      onRefresh={() => refreshAnalysisHubInsights("manual")}
    >
      <div className="space-y-4">
        <section className="grid md:grid-cols-5 gap-2">
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Projects</p>
            <p className="text-xl font-bold">{dashboard.scorecard.projectCount}</p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Health score</p>
            <p className="text-xl font-bold">{dashboard.scorecard.healthScore}</p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Trend</p>
            <p
              className={`text-xl font-bold ${
                dashboard.scorecard.trend === "improved"
                  ? "text-status-success"
                  : dashboard.scorecard.trend === "degraded"
                    ? "text-status-error"
                    : "text-text-muted"
              }`}
            >
              {dashboard.scorecard.trend}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Stale projects</p>
            <p className="text-xl font-bold text-status-premium">{dashboard.scorecard.staleProjectCount}</p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Open recommendations</p>
            <p className="text-xl font-bold">{dashboard.scorecard.unresolvedRecommendations}</p>
          </div>
        </section>

        <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
          <h2 className="text-sm font-bold">Bottlenecks and shared-process ownership</h2>
          <div className="space-y-2">
            {dashboard.bottlenecks.map((bottleneck) => (
              <div key={bottleneck.id} className="rounded-lg border border-subtle bg-canvas p-3 text-xs space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {bottleneck.projectName} · {bottleneck.processName}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      bottleneck.severity === "high"
                        ? "bg-status-error/10 text-status-error"
                        : bottleneck.severity === "medium"
                          ? "bg-status-premium/10 text-status-premium"
                          : "bg-status-success/10 text-status-success"
                    }`}
                  >
                    Score {bottleneck.score}
                  </span>
                </div>
                <p className="text-text-muted">
                  Primary owner: <span className="font-semibold">{bottleneck.primaryOwnerDepartment}</span>
                  {bottleneck.participatingDepartments.length > 1 &&
                    ` · Participants: ${bottleneck.participatingDepartments.join(", ")}`}
                </p>
                <p className="text-text-muted">
                  Blocked {bottleneck.scoreInputs.blockedWorkflows} · Stale {bottleneck.scoreInputs.staleWorkflows} · Unsynced required {bottleneck.scoreInputs.unsyncedRequiredArtifacts}
                </p>
                <Link
                  href={`/projects/${bottleneck.projectId}/analysis`}
                  className="inline-flex items-center gap-1 text-brand-primary font-semibold"
                >
                  Project drilldown
                  <ArrowSquareOut size={13} />
                </Link>
              </div>
            ))}
            {dashboard.bottlenecks.length === 0 && (
              <p className="text-xs text-text-muted">No bottlenecks currently detected for this department.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
          <h2 className="text-sm font-bold">Department recommendation queue</h2>
          <div className="space-y-2">
            {dashboard.recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-lg border border-subtle bg-canvas p-3 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{recommendation.title}</p>
                    <p className="text-text-muted">
                      Priority {recommendation.priorityRank} · {recommendation.lifecycleState}
                    </p>
                  </div>
                  {recommendation.actionLinkage?.status && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        recommendation.actionLinkage.status === "created"
                          ? "bg-status-success/10 text-status-success"
                          : recommendation.actionLinkage.status === "failed"
                            ? "bg-status-error/10 text-status-error"
                            : "bg-status-premium/10 text-status-premium"
                      }`}
                    >
                      Action {recommendation.actionLinkage.status}
                    </span>
                  )}
                </div>
                <p className="text-text-muted">{recommendation.summary}</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {recommendation.citations.map((citation) => (
                    <Link
                      key={citation.id}
                      href={citation.href}
                      className="px-2 py-0.5 rounded border border-subtle hover:text-brand-primary"
                    >
                      {citation.label}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/projects/${recommendation.projectId}/analysis`}
                    className="inline-flex items-center gap-1 text-brand-primary font-semibold"
                  >
                    Project drilldown
                    <ArrowSquareOut size={13} />
                  </Link>
                  {capabilities.canApproveRecommendations &&
                    recommendation.lifecycleState !== "Rejected" &&
                    recommendation.lifecycleState !== "Realized" && (
                      <>
                        <button
                          onClick={() => {
                            const rationale = window.prompt("Approval rationale");
                            if (!rationale) return;
                            reviewAnalysisRecommendation(recommendation.id, {
                              decision: "approve",
                              rationale,
                            });
                          }}
                          className="px-2.5 py-1 rounded border border-status-success/40 text-status-success font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const rationale = window.prompt("Rejection rationale");
                            if (!rationale) return;
                            reviewAnalysisRecommendation(recommendation.id, {
                              decision: "reject",
                              rationale,
                            });
                          }}
                          className="px-2.5 py-1 rounded border border-status-error/40 text-status-error font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  {capabilities.canApproveRecommendations &&
                    recommendation.actionLinkage?.status === "queued" && (
                      <button
                        onClick={() => dispatchRecommendationAction(recommendation.id)}
                        className="px-2.5 py-1 rounded border border-brand-primary/40 text-brand-primary font-semibold"
                      >
                        Create ClickUp Action
                      </button>
                    )}
                  {capabilities.canApproveRecommendations &&
                    recommendation.actionLinkage?.status === "failed" && (
                      <button
                        onClick={() => retryRecommendationActionDispatch(recommendation.id)}
                        className="px-2.5 py-1 rounded border border-status-premium/40 text-status-premium font-semibold"
                      >
                        Retry Action
                      </button>
                    )}
                  {capabilities.canApproveRecommendations &&
                    recommendation.lifecycleState === "In Progress" && (
                      <button
                        onClick={() =>
                          updateRecommendationLifecycleState(recommendation.id, "Realized")
                        }
                        className="px-2.5 py-1 rounded border border-status-success/40 text-status-success font-semibold"
                      >
                        Mark Realized
                      </button>
                    )}
                </div>
              </div>
            ))}
            {dashboard.recommendations.length === 0 && (
              <p className="text-xs text-text-muted">No recommendations queued for this department.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-subtle bg-surface p-4 space-y-2">
          <h2 className="text-sm font-bold">Department revalidation queue</h2>
          {dashboard.revalidationQueue.length === 0 ? (
            <p className="text-xs text-text-muted">No revalidation items pending.</p>
          ) : (
            <div className="space-y-2">
              {dashboard.revalidationQueue.map((item) => (
                <div key={item.id} className="rounded-lg border border-subtle bg-canvas p-3 text-xs">
                  <p className="font-semibold">{item.projectName}</p>
                  <p className="text-text-muted mt-0.5">{item.reason}</p>
                  <Link
                    href={`/projects/${item.projectId}/analysis`}
                    className="inline-flex items-center gap-1 text-brand-primary font-semibold mt-2"
                  >
                    Open analysis
                    <ArrowSquareOut size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AnalysisHubShell>
  );
}
