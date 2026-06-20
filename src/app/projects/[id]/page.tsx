import { ProjectDetailView } from "@/components/project-detail-view";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailView projectId={id} />;
}
