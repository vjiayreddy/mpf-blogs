import { graphqlRequest, GraphqlError } from "@/lib/graphql/client";
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

export async function fetchTaxonomies(accessToken?: string | null) {
  const data = await graphqlRequest<ListTaxonomiesData>({
    query: LIST_TAXONOMIES_QUERY,
    accessToken,
  });
  return {
    categories: (data.blogPortalCategories || []).map(toItem),
    tags: (data.blogPortalTags || []).map(toItem),
    series: (data.blogPortalSeriesList || []).map(toItem),
  };
}

export async function fetchPublicTaxonomies() {
  try {
    return await fetchTaxonomies();
  } catch (err) {
    if (err instanceof GraphqlError) {
      console.error("[graphql] ListTaxonomies failed:", err.message);
      return { categories: [], tags: [], series: [] };
    }
    throw err;
  }
}

export function findBySlug(items: TaxonomyItem[], slug: string) {
  return items.find((item) => item.slug === slug) || null;
}
