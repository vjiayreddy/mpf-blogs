import { PageEditorForm } from "@/components/admin/page-editor-form";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PageEditorForm mode="edit" pageId={id} />;
}
