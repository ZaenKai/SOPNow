import { AnalysisDepartmentPage } from "@/components/analysis/AnalysisDepartmentPage";

interface AnalysisDepartmentRoutePageProps {
  params: Promise<{ departmentId: string }>;
}

export default async function AnalysisDepartmentRoutePage({
  params,
}: AnalysisDepartmentRoutePageProps) {
  const { departmentId } = await params;
  return <AnalysisDepartmentPage departmentSlug={departmentId} />;
}
