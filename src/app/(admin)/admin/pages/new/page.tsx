import { PageEditorForm } from "@/components/admin/page-editor-form";
import { requireMinRole } from "@/lib/admin-guard";

export default async function NewPagePage() {
  await requireMinRole("EDITOR");
  return <PageEditorForm mode="create" />;
}
