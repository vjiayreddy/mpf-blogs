import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { requireMinRole } from "@/lib/admin-guard";

export default async function CategoriesPage() {
  await requireMinRole("EDITOR");
  return <TaxonomyManager kind="category" />;
}
