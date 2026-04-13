import { ProjectResolverClient } from "@/components/projects/ProjectResolverClient";

interface ProjectResolverPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectResolverPage({ params }: ProjectResolverPageProps) {
  const { projectId } = await params;
  return <ProjectResolverClient projectId={projectId} />;
}
