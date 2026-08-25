import { safeMediaUrl } from "@/lib/safe-url";

export type GraphqlSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
};

export type GraphqlTaxonomyRef = {
  _id: string;
  id: string;
  name: string;
  slug: string;
};

export type GraphqlAuthorRef = {
  _id: string;
  id: string;
  name?: string;
  email?: string;
};

// Server response ref shape used by the admin editors for typing.
// Note: this must match `POST_FIELDS` from `src/graphql/operations/posts.ts` (e.g. no `_id` field).
export type RawGraphqlPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  lexicalJSON?: string | null;
  html?: string | null;
  plaintext?: string | null;
  status: string;
  featured?: boolean | null;
  coverImage?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  seriesOrder?: number | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    ogImage?: string | null;
  } | null;
  author?: { id: string; name?: string | null; email?: string | null } | null;
  editor?: { id: string; name?: string | null; email?: string | null } | null;
  categories?: Array<{ id: string; name?: string | null; slug?: string | null }> | null;
  tags?: Array<{ id: string; name?: string | null; slug?: string | null }> | null;
  series?: {
    id: string;
    name?: string | null;
    slug?: string | null;
    description?: string | null;
  } | null;
};

// Input payload used by the admin editor when writing posts.
export type PostWriteInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  lexicalJSON?: string;
  html?: string;
  status?: string;
  coverImage?: string;
  featured?: boolean;
  scheduledAt?: string | null;
  categoryIds?: string[];
  tagIds?: string[];
  seriesId?: string | null;
  seriesOrder?: number;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
};

export function toPostInput(data: PostWriteInput) {
  const coverImage = safeMediaUrl(data.coverImage) || "";
  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    slug: data.slug || undefined,
    excerpt: data.excerpt || "",
    lexicalJSON: data.lexicalJSON || "",
    html: data.html || "",
    coverImage,
    featured: data.featured || false,
    scheduledAt: data.scheduledAt || null,
    categoryIds: data.categoryIds || [],
    tagIds: data.tagIds || [],
    seriesId: data.seriesId || null,
    seriesOrder: data.seriesOrder || 0,
    ...(data.status ? { status: data.status } : {}),
    seo: {
      title: data.seo?.title || "",
      description: data.seo?.description || "",
      ogImage: safeMediaUrl(data.seo?.ogImage) || coverImage,
    },
  };
}

