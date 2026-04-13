"use client";

import { useEffect, useState } from "react";

/**
 * Defers rendering children until after the first client-side mount.
 * This prevents React hydration mismatches caused by zustand/persist
 * restoring localStorage state that differs from the server-rendered
 * default state.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- intentional mount-detection for SSR hydration gate
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-text-muted animate-pulse">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
