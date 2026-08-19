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

export type PageWriteInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  lexicalJSON?: string;
  html?: string;
  status?: string;
  coverImage?: string;
  scheduledAt?: string | null;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
};

export function toPageInput(data: PageWriteInput) {
  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    slug: data.slug || undefined,
    excerpt: data.excerpt || "",
    lexicalJSON: data.lexicalJSON || "",
    html: data.html || "",
    coverImage: data.coverImage || "",
    scheduledAt: data.scheduledAt || null,
    ...(data.status ? { status: data.status } : {}),
    seo: {
      title: data.seo?.title || "",
      description: data.seo?.description || "",
      ogImage: data.seo?.ogImage || data.coverImage || "",
    },
  };
}

export async function fetchPublicPageBySlug(slug: string) {
  try {
    const data = await apolloQuery<{ blogPortalPageBySlug: RawGraphqlPage | null }>({
      query: GET_PAGE_BY_SLUG_QUERY,
      variables: { slug },
    });
    const page = data.blogPortalPageBySlug;
    if (!page || page.status !== "published") return null;
    return page;
  } catch (err) {
    console.error("[graphql] GetPageBySlug failed:", err);
    return null;
  }
}

export async function fetchPublicPages() {
  try {
    const data = await apolloQuery<{ blogPortalPages: RawGraphqlPage[] }>({
      query: LIST_PAGES_QUERY,
    });
    return (data.blogPortalPages || []).filter((page) => page.status === "published");
  } catch (err) {
    console.error("[graphql] ListPages failed:", err);
    return [];
  }
}
