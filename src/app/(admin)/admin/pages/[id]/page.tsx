import { PageEditorForm } from "@/components/admin/page-editor-form";
import { requireMinRole } from "@/lib/admin-guard";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("EDITOR");
  const { id } = await params;
  return <PageEditorForm mode="edit" pageId={id} />;
}
