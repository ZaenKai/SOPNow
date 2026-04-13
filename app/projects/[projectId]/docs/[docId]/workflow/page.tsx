import { DocWorkflowPage } from "@/components/workflow/DocWorkflowPage";

interface DocWorkflowRoutePageProps {
  params: Promise<{ projectId: string; docId: string }>;
}

export default async function DocWorkflowRoutePage({ params }: DocWorkflowRoutePageProps) {
  const { projectId, docId } = await params;
  return <DocWorkflowPage projectId={projectId} docId={docId} />;
}
