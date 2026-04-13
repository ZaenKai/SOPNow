import { ProjectWorkflowsPage } from "@/components/workflow/ProjectWorkflowsPage";

interface ProjectWorkflowsRoutePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectWorkflowsRoutePage({
  params,
}: ProjectWorkflowsRoutePageProps) {
  const { projectId } = await params;
  return <ProjectWorkflowsPage projectId={projectId} />;
}
