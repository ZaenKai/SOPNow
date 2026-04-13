import { ProjectWorkspacePage } from "@/components/workspace/ProjectWorkspacePage";

interface ProjectWorkspaceRouteProps {
  params: Promise<{ projectId: string; docId: string }>;
  searchParams: Promise<{ notice?: string; center?: string }>;
}

export default async function ProjectWorkspaceRoutePage({
  params,
  searchParams,
}: ProjectWorkspaceRouteProps) {
  const { projectId, docId } = await params;
  const { notice, center } = await searchParams;
  return <ProjectWorkspacePage projectId={projectId} docId={docId} notice={notice} center={center} />;
}
