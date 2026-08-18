import { createTag, listTags, updateTag } from "@/app/actions/content";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export default async function TagsPage() {
  const items = await listTags();
  return (
    <TaxonomyManager
      title="Tags"
      items={items}
      onCreate={createTag}
      onUpdate={updateTag}
    />
  );
}
