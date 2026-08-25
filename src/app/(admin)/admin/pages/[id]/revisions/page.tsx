import { RevisionHistoryPage } from "@/components/admin/revision-history-page";
import { requireMinRole } from "@/lib/admin-guard";

export default async function PageRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("EDITOR");
  const { id } = await params;
  return <RevisionHistoryPage documentId={id} documentType="page" />;
}
