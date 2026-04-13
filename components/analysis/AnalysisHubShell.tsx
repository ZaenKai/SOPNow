"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { Sidebar } from "@/components/Sidebar";
import { AnalysisHubRefreshMetadata } from "@/lib/store/useStore";

interface AnalysisHubTab {
  key: "portfolio" | "department" | "tools";
  href: string;
  label: string;
}

interface AnalysisHubShellProps {
  title: string;
  subtitle: string;
  activeTab: AnalysisHubTab["key"];
  tabs: AnalysisHubTab[];
  refreshMetadata: AnalysisHubRefreshMetadata;
  canRefresh: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}

const getRefreshLabel = (metadata: AnalysisHubRefreshMetadata) => {
  if (!metadata.lastRefreshedAt) return "Not refreshed yet";
  const timestamp = new Date(metadata.lastRefreshedAt).toLocaleString();
  if (metadata.status === "failed") return `Refresh failed · ${timestamp}`;
  return `Last refresh · ${timestamp}`;
};

export function AnalysisHubShell({
  title,
  subtitle,
  activeTab,
  tabs,
  refreshMetadata,
  canRefresh,
  onRefresh,
  children,
}: AnalysisHubShellProps) {
  return (
    <div className="flex h-full min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 pl-[var(--sidebar-width,16rem)] min-h-screen overflow-auto custom-scrollbar transition-[padding] duration-200">
        <header className="border-b border-subtle glass px-4 lg:px-6 py-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="text-xs text-text-muted flex items-center gap-1 min-w-0">
                <Link href="/projects" className="hover:text-text-primary hover:underline underline-offset-2">
                  Projects
                </Link>
                <span>/</span>
                <Link href="/analysis" className="hover:text-text-primary hover:underline underline-offset-2">
                  Analysis Hub
                </Link>
                <span>/</span>
                <span className="text-text-primary">{title}</span>
              </nav>
              <h1 className="text-lg font-bold text-text-primary mt-1">{title}</h1>
              <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-2 py-1 rounded-full border ${
                  refreshMetadata.status === "failed"
                    ? "border-status-error/40 text-status-error bg-status-error/10"
                    : refreshMetadata.stale
                      ? "border-status-premium/40 text-status-premium bg-status-premium/10"
                      : "border-status-success/40 text-status-success bg-status-success/10"
                }`}
              >
                {getRefreshLabel(refreshMetadata)}
              </span>
              <button
                onClick={onRefresh}
                disabled={!canRefresh || !onRefresh}
                className="px-3 py-1.5 rounded-lg border border-subtle text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowsClockwise size={13} />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  activeTab === tab.key
                    ? "border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
                    : "border-subtle text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </header>

        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
