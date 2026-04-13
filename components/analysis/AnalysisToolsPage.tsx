"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalysisHubShell } from "@/components/analysis/AnalysisHubShell";
import {
  filterToolsRegistry,
  getAccessibleDepartments,
  getCapabilitiesForRole,
  toDepartmentSlug,
  ToolRegistryStatus,
  useStore,
} from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";

const NIGHTLY_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const TOOL_STATUSES: Array<ToolRegistryStatus> = [
  "Active",
  "Under Review",
  "Planned",
  "Deprecated",
];

export function AnalysisToolsPage() {
  useSeedData();
  const {
    projects,
    settings,
    toolsRegistry,
    analysisHubRecommendations,
    analysisHubRefreshMetadata,
    refreshAnalysisHubInsights,
  } = useStore();
  const capabilities = getCapabilitiesForRole(settings.currentUserRole, settings);
  const accessibleDepartments = useMemo(
    () => getAccessibleDepartments(settings, projects),
    [projects, settings]
  );
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ToolRegistryStatus | "all">("all");
  const effectiveDepartmentFilter = useMemo(() => {
    if (departmentFilter === "all") return "all";
    const allowed = accessibleDepartments.some(
      (department) => toDepartmentSlug(department) === toDepartmentSlug(departmentFilter)
    );
    return allowed ? departmentFilter : "all";
  }, [accessibleDepartments, departmentFilter]);

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

  const tabs = [
    ...(capabilities.canViewPortfolioAnalysis
      ? [{ key: "portfolio" as const, href: "/analysis/portfolio", label: "Portfolio" }]
      : []),
    {
      key: "department" as const,
      href: `/analysis/departments/${toDepartmentSlug(
        accessibleDepartments[0] ?? settings.currentUserDepartment
      )}`,
      label: "Department",
    },
    { key: "tools" as const, href: "/analysis/tools", label: "Tools" },
  ];

  const visibleTools = useMemo(
    () =>
      filterToolsRegistry(toolsRegistry, {
        department: effectiveDepartmentFilter,
        status: statusFilter,
      }).filter((tool) => {
        if (capabilities.canViewPortfolioAnalysis) return true;
        return accessibleDepartments
          .map((department) => toDepartmentSlug(department))
          .includes(toDepartmentSlug(tool.ownerDepartment ?? "unassigned"));
      }),
    [
      accessibleDepartments,
      capabilities.canViewPortfolioAnalysis,
      effectiveDepartmentFilter,
      statusFilter,
      toolsRegistry,
    ]
  );

  return (
    <AnalysisHubShell
      title="Tools Registry"
      subtitle="Coming soon: tool-aware intelligence. Current release supports inventory, ownership placeholders, and status governance."
      activeTab="tools"
      tabs={tabs}
      refreshMetadata={analysisHubRefreshMetadata}
      canRefresh={capabilities.canRefreshAnalysisHub}
      onRefresh={() => refreshAnalysisHubInsights("manual")}
    >
      <div className="space-y-4">
        <section className="rounded-xl border border-status-premium/30 bg-status-premium/10 p-4">
          <p className="text-sm font-semibold text-status-premium">Coming soon fields (v1 placeholders)</p>
          <p className="text-xs text-status-premium/80 mt-1">
            Version tracking, usage limits, and cost intelligence are visible as placeholders only. Editing and automation are not yet enabled.
          </p>
          <div className="grid sm:grid-cols-3 gap-2 mt-3 text-xs">
            {["Version", "Limits", "Costs"].map((field) => (
              <div key={field} className="rounded-lg border border-status-premium/30 bg-canvas p-2.5">
                <p className="font-semibold">{field}</p>
                <p className="text-text-muted mt-0.5">Placeholder only in v1</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={effectiveDepartmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="px-3 py-1.5 rounded-lg border border-subtle bg-canvas text-xs"
            >
              <option value="all">All departments</option>
              {[
                ...new Set(
                  (capabilities.canViewPortfolioAnalysis
                    ? toolsRegistry.map((tool) => tool.ownerDepartment ?? "Unassigned")
                    : accessibleDepartments
                  ).filter(Boolean)
                ),
              ]
                .sort((a, b) => a.localeCompare(b))
                .map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ToolRegistryStatus | "all")}
              className="px-3 py-1.5 rounded-lg border border-subtle bg-canvas text-xs"
            >
              <option value="all">All statuses</option>
              {TOOL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <span className="text-xs text-text-muted">{visibleTools.length} tools</span>
          </div>

          <div className="space-y-2">
            {visibleTools.map((tool) => (
              <article key={tool.id} className="rounded-lg border border-subtle bg-canvas p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{tool.toolName}</p>
                    <p className="text-text-muted mt-0.5">
                      Owner department: {tool.ownerDepartment ?? "Unassigned"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tool.status === "Active"
                        ? "bg-status-success/10 text-status-success"
                        : tool.status === "Under Review"
                          ? "bg-status-premium/10 text-status-premium"
                          : tool.status === "Planned"
                            ? "bg-brand-primary/10 text-brand-primary"
                            : "bg-status-error/10 text-status-error"
                    }`}
                  >
                    {tool.status}
                  </span>
                </div>
                <p className="text-text-muted mt-2">{tool.notes ?? "No notes available."}</p>
                <div className="grid sm:grid-cols-3 gap-2 mt-3">
                  <div className="rounded border border-subtle bg-surface p-2">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Version</p>
                    <p className="mt-1">{tool.version ?? "Coming soon"}</p>
                  </div>
                  <div className="rounded border border-subtle bg-surface p-2">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Limits</p>
                    <p className="mt-1">{tool.usageLimits ?? "Coming soon"}</p>
                  </div>
                  <div className="rounded border border-subtle bg-surface p-2">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Costs</p>
                    <p className="mt-1">{tool.estimatedMonthlyCost ?? "Coming soon"}</p>
                  </div>
                </div>
              </article>
            ))}
            {visibleTools.length === 0 && (
              <p className="text-xs text-text-muted">No tools match the current filters.</p>
            )}
          </div>
        </section>
      </div>
    </AnalysisHubShell>
  );
}
