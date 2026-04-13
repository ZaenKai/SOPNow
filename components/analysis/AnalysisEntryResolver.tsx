"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAnalysisLandingPath, useStore } from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";

export function AnalysisEntryResolver() {
  useSeedData();
  const router = useRouter();
  const { projects, settings } = useStore();

  useEffect(() => {
    router.replace(getAnalysisLandingPath(settings, projects));
  }, [projects, router, settings]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <p className="text-sm text-text-muted">Resolving analysis scope…</p>
    </div>
  );
}
