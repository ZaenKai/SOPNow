import { ProjectSetupPage } from "@/components/projects/ProjectSetupPage";

interface ProjectSetupRouteProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectSetupRoutePage({ params }: ProjectSetupRouteProps) {
  const { projectId } = await params;
  return <ProjectSetupPage projectId={projectId} />;
}
