"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChartBar, Gear, Lock, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { Sidebar } from "@/components/Sidebar";
import { getCapabilitiesForRole, SettingsTab, useStore, WorkspacePolicy } from "@/lib/store/useStore";

const SETTING_TABS: SettingsTab[] = ["general", "workspace", "security"];

function nextTabUrl(pathname: string, tab: SettingsTab) {
  return `${pathname}?tab=${tab}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    settings,
    updateSettings,
    estimateCleanupImpact,
    setSettingsTab,
  } = useStore();
  const [pendingPolicy, setPendingPolicy] = useState<WorkspacePolicy | null>(null);
  const [tabFromUrl, setTabFromUrl] = useState<SettingsTab | null>(null);

  useEffect(() => {
    const syncTab = () => {
      const raw = new URLSearchParams(window.location.search).get("tab") as SettingsTab | null;
      setTabFromUrl(raw);
    };
    syncTab();
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);

  const requestedTab = tabFromUrl ?? settings.activeSettingsTab;
  const activeTab: SettingsTab = SETTING_TABS.includes(requestedTab) ? requestedTab : "general";
  const capabilities = getCapabilitiesForRole(settings.currentUserRole, settings);

  const cleanupImpact = useMemo(
    () => (pendingPolicy ? estimateCleanupImpact(pendingPolicy) : null),
    [estimateCleanupImpact, pendingPolicy]
  );

  const switchTab = (tab: SettingsTab) => {
    setSettingsTab(tab);
    setTabFromUrl(tab);
    router.replace(nextTabUrl(pathname, tab));
  };

  const applyWorkspacePolicy = (nextPolicy: WorkspacePolicy) => {
    const destructive =
      nextPolicy.threadRetentionDays < settings.workspacePolicy.threadRetentionDays ||
      nextPolicy.proposalRetentionDays < settings.workspacePolicy.proposalRetentionDays;

    if (destructive) {
      setPendingPolicy(nextPolicy);
      return;
    }

    updateSettings({ workspacePolicy: nextPolicy });
  };

  return (
    <div className="flex h-full min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 pl-[var(--sidebar-width,16rem)] min-h-screen overflow-auto custom-scrollbar transition-[padding] duration-200">
        <header className="h-20 border-b border-subtle glass sticky top-0 z-40 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
            <p className="text-xs text-text-muted mt-1">
              Configure workspace defaults, policy governance, and security controls.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-canvas border border-subtle text-xs font-bold uppercase tracking-wider">
            Role: {settings.currentUserRole}
          </div>
        </header>

        <div className="p-8 space-y-6 max-w-5xl">
          <div className="bg-surface border border-subtle rounded-xl p-1 inline-flex gap-1">
            {SETTING_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  activeTab === tab
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "general" && (
            <section className="bg-surface border border-subtle rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Gear size={18} className="text-brand-primary" />
                <h2 className="text-base font-bold">General</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 text-xs">
                  <span className="uppercase tracking-wider text-text-muted font-bold">Default workspace</span>
                  <input
                    value={settings.defaultWorkspace}
                    onChange={(event) => updateSettings({ defaultWorkspace: event.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="uppercase tracking-wider text-text-muted font-bold">Sync interval (minutes)</span>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={settings.syncIntervalMinutes}
                    onChange={(event) => updateSettings({ syncIntervalMinutes: Number(event.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm"
                  />
                </label>
              </div>
              <label className="flex items-center justify-between rounded-lg border border-subtle bg-canvas px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <Bell size={14} />
                  Notify when SOPs are review-ready
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnReviewReady}
                  onChange={(event) => updateSettings({ notifyOnReviewReady: event.target.checked })}
                />
              </label>
            </section>
          )}

          {activeTab === "workspace" && (
            <section className="bg-surface border border-subtle rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gear size={18} className="text-brand-primary" />
                  <h2 className="text-base font-bold">Workspace policy</h2>
                </div>
                {!capabilities.canManagePolicies && (
                  <span className="px-2 py-1 rounded-full bg-canvas border border-subtle text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Lock size={11} />
                    Read only
                  </span>
                )}
              </div>

              <p className="text-sm text-text-muted">
                Policy changes autosave. Retention reductions require confirmation with projected cleanup impact.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 text-xs">
                  <span className="uppercase tracking-wider text-text-muted font-bold">Thread retention (days)</span>
                  <input
                    type="number"
                    min={1}
                    value={settings.workspacePolicy.threadRetentionDays}
                    disabled={!capabilities.canManagePolicies}
                    onChange={(event) =>
                      applyWorkspacePolicy({
                        ...settings.workspacePolicy,
                        threadRetentionDays: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm disabled:opacity-60"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="uppercase tracking-wider text-text-muted font-bold">Proposal retention (days)</span>
                  <input
                    type="number"
                    min={1}
                    value={settings.workspacePolicy.proposalRetentionDays}
                    disabled={!capabilities.canManagePolicies}
                    onChange={(event) =>
                      applyWorkspacePolicy({
                        ...settings.workspacePolicy,
                        proposalRetentionDays: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm disabled:opacity-60"
                  />
                </label>
              </div>

              {[
                {
                  key: "autoArchiveThreadsOnFinalize",
                  label: "Auto-archive active thread when finalizing a document",
                },
                {
                  key: "allowNonAdminFinalizeProject",
                  label: "Allow non-admin editors to finalize ready-to-close projects",
                },
              ].map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex items-center justify-between rounded-lg border border-subtle bg-canvas px-3 py-2.5 text-sm"
                >
                  <span>{toggle.label}</span>
                  <input
                    type="checkbox"
                    disabled={!capabilities.canManagePolicies}
                    checked={settings.workspacePolicy[toggle.key as keyof WorkspacePolicy] as boolean}
                    onChange={(event) =>
                      applyWorkspacePolicy({
                        ...settings.workspacePolicy,
                        [toggle.key]: event.target.checked,
                      } as WorkspacePolicy)
                    }
                  />
                </label>
              ))}

              <div className="border-t border-subtle pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ChartBar size={16} className="text-brand-primary" />
                  <h3 className="text-sm font-bold">Progress formula weights</h3>
                </div>
                <p className="text-xs text-text-muted">
                  Weights must sum to 100. Progress is capped below 100% until a project is fully finalized (Complete).
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {(["docs", "workflows", "analysis"] as const).map((key) => (
                    <label key={key} className="space-y-1 text-xs">
                      <span className="uppercase tracking-wider text-text-muted font-bold">{key} weight</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={settings.workspacePolicy.progressWeights[key]}
                        disabled={!capabilities.canManagePolicies}
                        onChange={(event) => {
                          const val = Math.max(0, Math.min(100, Number(event.target.value) || 0));
                          const next = { ...settings.workspacePolicy.progressWeights, [key]: val };
                          if (next.docs + next.workflows + next.analysis === 100) {
                            applyWorkspacePolicy({ ...settings.workspacePolicy, progressWeights: next });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm disabled:opacity-60"
                      />
                    </label>
                  ))}
                </div>
                {settings.workspacePolicy.progressWeights.docs +
                  settings.workspacePolicy.progressWeights.workflows +
                  settings.workspacePolicy.progressWeights.analysis !== 100 && (
                  <p className="text-xs text-status-error font-bold">Weights must sum to 100.</p>
                )}
                <label className="space-y-1 text-xs block">
                  <span className="uppercase tracking-wider text-text-muted font-bold">Pre-complete progress cap</span>
                  <input
                    type="number"
                    min={90}
                    max={99}
                    value={settings.workspacePolicy.preCompleteProgressCap}
                    disabled={!capabilities.canManagePolicies}
                    onChange={(event) => {
                      const val = Math.max(90, Math.min(99, Number(event.target.value) || 99));
                      applyWorkspacePolicy({ ...settings.workspacePolicy, preCompleteProgressCap: val });
                    }}
                    className="w-full md:w-48 px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm disabled:opacity-60"
                  />
                </label>
              </div>
            </section>
          )}

          {activeTab === "security" && (
            <section className="bg-surface border border-subtle rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-primary" />
                <h2 className="text-base font-bold">Security</h2>
              </div>
              <label className="flex items-center justify-between rounded-lg border border-subtle bg-canvas px-3 py-2.5 text-sm">
                <span>Require MFA for admin actions</span>
                <input
                  type="checkbox"
                  checked={settings.requireMfa}
                  onChange={(event) => updateSettings({ requireMfa: event.target.checked })}
                />
              </label>
              <label className="space-y-1 text-xs block">
                <span className="uppercase tracking-wider text-text-muted font-bold">Session timeout (minutes)</span>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={settings.sessionTimeoutMinutes}
                  onChange={(event) =>
                    updateSettings({
                      sessionTimeoutMinutes: Math.min(
                        480,
                        Math.max(15, Number(event.target.value) || 15)
                      ),
                    })
                  }
                  className="w-full md:w-64 px-3 py-2 rounded-lg border border-subtle bg-canvas text-sm"
                />
              </label>
            </section>
          )}
        </div>
      </main>

      {pendingPolicy && cleanupImpact && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-subtle bg-surface p-5 space-y-4">
            <div className="flex items-center gap-2 text-status-error">
              <WarningCircle size={18} weight="fill" />
              <h3 className="font-bold text-base text-text-primary">Confirm destructive policy change</h3>
            </div>
            <p className="text-sm text-text-muted">
              This tighter retention policy may purge <strong>{cleanupImpact.threadCount}</strong> historical threads
              across <strong>{cleanupImpact.docCount}</strong> documents.
            </p>
            <div className="grid gap-2">
              <button
                onClick={() => setPendingPolicy(null)}
                className="w-full px-3 py-2 rounded-lg border border-subtle text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateSettings({ workspacePolicy: pendingPolicy });
                  setPendingPolicy(null);
                }}
                className="w-full px-3 py-2 rounded-lg bg-status-error text-white text-sm font-bold"
              >
                Confirm and apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
