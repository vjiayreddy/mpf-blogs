import { createSeries, listSeries, updateSeries } from "@/app/actions/content";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export default async function SeriesPage() {
  const items = await listSeries();
  return (
    <TaxonomyManager
      title="Series"
      items={items}
      withDescription
      onCreate={createSeries}
      onUpdate={updateSeries}
    />
  );
}
