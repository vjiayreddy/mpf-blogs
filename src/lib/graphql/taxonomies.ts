import { apolloQuery } from "@/lib/apollo/rsc";
import { LIST_TAXONOMIES_QUERY } from "@/graphql/operations/taxonomies";

export type TaxonomyItem = {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
};

function toItem(raw: {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
}): TaxonomyItem {
  return {
    _id: raw.id,
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description || undefined,
    coverImage: raw.coverImage || undefined,
  };
}

type ListTaxonomiesData = {
  blogPortalCategories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  }>;
  blogPortalTags: Array<{ id: string; name: string; slug: string }>;
  blogPortalSeriesList: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    coverImage?: string | null;
  }>;
};

export async function fetchPublicTaxonomies() {
  try {
    const data = await apolloQuery<ListTaxonomiesData>({ query: LIST_TAXONOMIES_QUERY });
    return {
      categories: (data.blogPortalCategories || []).map(toItem),
      tags: (data.blogPortalTags || []).map(toItem),
      series: (data.blogPortalSeriesList || []).map(toItem),
    };
  } catch (err) {
    console.error("[graphql] ListTaxonomies failed:", err);
    return { categories: [], tags: [], series: [] };
  }
}

export function findBySlug(items: TaxonomyItem[], slug: string) {
  return items.find((item) => item.slug === slug) || null;
}
