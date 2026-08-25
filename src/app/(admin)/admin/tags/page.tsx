import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { requireMinRole } from "@/lib/admin-guard";

export default async function TagsPage() {
  await requireMinRole("EDITOR");
  return <TaxonomyManager kind="tag" />;
}
