import { createCategory, listCategories, updateCategory } from "@/app/actions/content";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export default async function CategoriesPage() {
  const items = await listCategories();
  return (
    <TaxonomyManager
      title="Categories"
      items={items}
      withDescription
      onCreate={createCategory}
      onUpdate={updateCategory}
    />
  );
}
