"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProjectDocIds, useStore } from "@/lib/store/useStore";
import { useSeedData } from "@/lib/store/useSeedData";

export function ProjectResolverClient({ projectId }: { projectId: string }) {
  useSeedData();
  const router = useRouter();
  const { projects, setCurrentProject, projectUIPreferences } = useStore();

  useEffect(() => {
    if (projects.length === 0) return;
    const project = projects.find((candidate) => candidate.id === projectId);
    if (!project) {
      router.replace("/projects");
      return;
    }

    setCurrentProject(projectId);

    if (!project.setupCompleted) {
      router.replace(`/projects/${projectId}/setup`);
      return;
    }

    const preferredDocId = projectUIPreferences[projectId]?.lastOpenedDocId;
    const allDocIds = getProjectDocIds(project);
    const nextDocId =
      preferredDocId && allDocIds.includes(preferredDocId) ? preferredDocId : allDocIds[0];

    if (!nextDocId) {
      router.replace(`/projects/${projectId}/setup`);
      return;
    }

    router.replace(`/projects/${projectId}/docs/${nextDocId}`);
  }, [projectId, projects, projectUIPreferences, router, setCurrentProject]);

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex items-center justify-center">
      <p className="text-sm text-text-muted">Resolving project route…</p>
    </div>
  );
}
