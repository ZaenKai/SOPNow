import { ProjectAnalysisPage } from "@/components/analysis/ProjectAnalysisPage";

interface ProjectAnalysisRoutePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectAnalysisRoutePage({ params }: ProjectAnalysisRoutePageProps) {
  const { projectId } = await params;
  return <ProjectAnalysisPage projectId={projectId} />;
}
