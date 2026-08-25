import { apolloQuery } from "@/lib/apollo/rsc";
import { GET_PAGE_BY_SLUG_QUERY, LIST_PAGES_QUERY } from "@/graphql/operations/pages";

export type RawGraphqlPage = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  lexicalJSON?: string | null;
  html?: string | null;
  status: string;
  coverImage?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    ogImage?: string | null;
  } | null;
};

export async function fetchPublicPageBySlug(slug: string) {
  try {
    const data = await apolloQuery<{ blogPortalPageBySlug: RawGraphqlPage | null }>({
      query: GET_PAGE_BY_SLUG_QUERY,
      variables: { slug },
      auth: "public",
    });
    const page = data.blogPortalPageBySlug;
    if (!page || page.status !== "published") return null;
    return page;
  } catch (err) {
    console.error("[graphql] GetPageBySlug (public) failed:", err);
    return null;
  }
}

export async function fetchPublicPages() {
  try {
    const data = await apolloQuery<{ blogPortalPages: RawGraphqlPage[] }>({
      query: LIST_PAGES_QUERY,
      auth: "public",
    });
    return (data.blogPortalPages || []).filter((page) => page.status === "published");
  } catch (err) {
    console.error("[graphql] ListPages (public) failed:", err);
    return [];
  }
}
