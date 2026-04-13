"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowSquareOut, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { AnalysisHubShell } from "@/components/analysis/AnalysisHubShell";
import {
  buildPortfolioAnalysisDashboard,
  canAccessPortfolioAnalysis,
  getAccessibleDepartments,
  getCapabilitiesForRole,
  toDepartmentSlug,
  useStore,
} from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";

const NIGHTLY_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

const trendClass: Record<"improved" | "flat" | "degraded", string> = {
  improved: "text-status-success",
  flat: "text-text-muted",
  degraded: "text-status-error",
};

export function AnalysisPortfolioPage() {
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
  const fallbackDepartmentPath = `/analysis/departments/${toDepartmentSlug(
    accessibleDepartments[0] ?? settings.currentUserDepartment
  )}`;
  const canViewPortfolio = canAccessPortfolioAnalysis(settings);

  useEffect(() => {
    if (!canViewPortfolio) {
      router.replace(fallbackDepartmentPath);
    }
  }, [canViewPortfolio, fallbackDepartmentPath, router]);

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
    () => buildPortfolioAnalysisDashboard(projects, analysisHubRecommendations),
    [analysisHubRecommendations, projects]
  );

  const tabs = [
    ...(capabilities.canViewPortfolioAnalysis
      ? [{ key: "portfolio" as const, href: "/analysis/portfolio", label: "Portfolio" }]
      : []),
    { key: "department" as const, href: fallbackDepartmentPath, label: "Department" },
    { key: "tools" as const, href: "/analysis/tools", label: "Tools" },
  ];

  if (!canViewPortfolio) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-text-muted">Redirecting to your department scope…</p>
      </div>
    );
  }

  return (
    <AnalysisHubShell
      title="Portfolio"
      subtitle="Organization-level Process Intelligence with deterministic ranking and evidence-backed recommendations."
      activeTab="portfolio"
      tabs={tabs}
      refreshMetadata={analysisHubRefreshMetadata}
      canRefresh={capabilities.canRefreshAnalysisHub}
      onRefresh={() => refreshAnalysisHubInsights("manual")}
    >
      <div className="space-y-4">
        <section className="grid md:grid-cols-5 gap-2">
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Projects</p>
            <p className="text-xl font-bold">{dashboard.portfolioScorecard.projectCount}</p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Departments</p>
            <p className="text-xl font-bold">{dashboard.portfolioScorecard.departmentCount}</p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Avg health</p>
            <p className="text-xl font-bold">{dashboard.portfolioScorecard.avgHealthScore}</p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Improved depts</p>
            <p className="text-xl font-bold text-status-success">
              {dashboard.portfolioScorecard.improvedDepartmentCount}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Needs revalidation</p>
            <p className="text-xl font-bold text-status-premium">
              {dashboard.portfolioScorecard.revalidationCount}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
          <h2 className="text-sm font-bold">Department health</h2>
          <div className="grid md:grid-cols-2 gap-2">
            {dashboard.departmentScorecards.map((scorecard) => (
              <Link
                key={scorecard.departmentId}
                href={`/analysis/departments/${scorecard.departmentId}`}
                className="rounded-lg border border-subtle bg-canvas p-3 text-xs flex items-start justify-between gap-2"
              >
                <div>
                  <p className="font-semibold">{scorecard.departmentName}</p>
                  <p className="text-text-muted mt-0.5">
                    Health {scorecard.healthScore} · Projects {scorecard.projectCount}
                  </p>
                  <p className="text-text-muted">
                    Stale {scorecard.staleProjectCount} · Blocked workflows {scorecard.blockedWorkflowCount}
                  </p>
                </div>
                <span className={`font-semibold ${trendClass[scorecard.trend]}`}>{scorecard.trend}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
            <h2 className="text-sm font-bold">Top bottlenecks</h2>
            <div className="space-y-2">
              {dashboard.bottlenecks.slice(0, 6).map((bottleneck) => (
                <div key={bottleneck.id} className="rounded-lg border border-subtle bg-canvas p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
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
                    Owner: {bottleneck.primaryOwnerDepartment}
                    {bottleneck.participatingDepartments.length > 1 &&
                      ` · Shared across ${bottleneck.participatingDepartments.join(", ")}`}
                  </p>
                  <p className="text-text-muted">
                    Blocked {bottleneck.scoreInputs.blockedWorkflows} · Stale {bottleneck.scoreInputs.staleWorkflows} · Unsynced required {bottleneck.scoreInputs.unsyncedRequiredArtifacts}
                  </p>
                  <Link
                    href={`/projects/${bottleneck.projectId}/analysis`}
                    className="inline-flex items-center gap-1 text-brand-primary font-semibold"
                  >
                    Open project drilldown
                    <ArrowSquareOut size={13} />
                  </Link>
                </div>
              ))}
              {dashboard.bottlenecks.length === 0 && (
                <p className="text-xs text-text-muted">No bottlenecks detected.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
            <h2 className="text-sm font-bold">Needs revalidation</h2>
            <div className="space-y-2">
              {dashboard.revalidationQueue.map((item) => (
                <div key={item.id} className="rounded-lg border border-subtle bg-canvas p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{item.projectName}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.urgency === "high"
                          ? "bg-status-error/10 text-status-error"
                          : item.urgency === "medium"
                            ? "bg-status-premium/10 text-status-premium"
                            : "bg-status-success/10 text-status-success"
                      }`}
                    >
                      {item.urgency}
                    </span>
                  </div>
                  <p className="text-text-muted mt-0.5">{item.reason}</p>
                  <Link
                    href={`/projects/${item.projectId}/analysis`}
                    className="inline-flex items-center gap-1 text-brand-primary font-semibold mt-2"
                  >
                    Review analysis
                    <ArrowSquareOut size={13} />
                  </Link>
                </div>
              ))}
              {dashboard.revalidationQueue.length === 0 && (
                <p className="text-xs text-text-muted">All tracked processes are currently within validation tolerance.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
          <h2 className="text-sm font-bold">Opportunity queue</h2>
          <div className="space-y-2">
            {dashboard.opportunityQueue.map((recommendation) => (
              <div key={recommendation.id} className="rounded-lg border border-subtle bg-canvas p-3 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{recommendation.title}</p>
                    <p className="text-text-muted">
                      {recommendation.departmentName} · Priority {recommendation.priorityRank}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-canvas border border-subtle text-[10px] font-bold">
                      {recommendation.lifecycleState}
                    </span>
                    {recommendation.actionLinkage?.status === "created" ? (
                      <CheckCircle size={14} className="text-status-success" />
                    ) : recommendation.actionLinkage?.status === "failed" ? (
                      <WarningCircle size={14} className="text-status-error" />
                    ) : null}
                  </div>
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
                  {recommendation.actionLinkage?.clickupUrl && (
                    <a
                      href={recommendation.actionLinkage.clickupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-primary font-semibold"
                    >
                      Open action
                      <ArrowSquareOut size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {dashboard.opportunityQueue.length === 0 && (
              <p className="text-xs text-text-muted">No recommendations available yet.</p>
            )}
          </div>
        </section>
      </div>
    </AnalysisHubShell>
  );
}
