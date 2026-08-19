import { apolloQuery } from "@/lib/apollo/rsc";
import {
  GET_POST_BY_SLUG_QUERY,
  GET_POST_QUERY,
  LIST_POSTS_QUERY,
} from "@/graphql/operations/posts";

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

export type GraphqlPost = {
  _id: string;
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  lexicalJSON?: string;
  html?: string;
  plaintext?: string;
  status: string;
  featured: boolean;
  coverImage?: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  readingTime?: number;
  seriesOrder?: number;
  updatedAt: string;
  createdAt?: string;
  seo?: GraphqlSeo;
  authorId: GraphqlAuthorRef | null;
  editorId: GraphqlAuthorRef | null;
  categoryIds: GraphqlTaxonomyRef[];
  tagIds: GraphqlTaxonomyRef[];
  seriesId: GraphqlTaxonomyRef | null;
};

type RawPerson = { id: string; name?: string | null; email?: string | null } | null;
type RawTaxonomy = { id: string; name?: string | null; slug?: string | null };

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
  author?: RawPerson;
  editor?: RawPerson;
  categories?: RawTaxonomy[] | null;
  tags?: RawTaxonomy[] | null;
  series?: (RawTaxonomy & { description?: string | null }) | null;
};

function toPerson(raw?: RawPerson): GraphqlAuthorRef | null {
  if (!raw?.id) return null;
  return {
    _id: raw.id,
    id: raw.id,
    name: raw.name || undefined,
    email: raw.email || undefined,
  };
}

function toTaxonomy(raw: RawTaxonomy): GraphqlTaxonomyRef {
  return {
    _id: raw.id,
    id: raw.id,
    name: raw.name || "",
    slug: raw.slug || "",
  };
}

export function normalizePost(raw: RawGraphqlPost): GraphqlPost {
  return {
    _id: raw.id,
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt || "",
    lexicalJSON: raw.lexicalJSON || "",
    html: raw.html || "",
    plaintext: raw.plaintext || "",
    status: raw.status,
    featured: Boolean(raw.featured),
    coverImage: raw.coverImage || "",
    scheduledAt: raw.scheduledAt || null,
    publishedAt: raw.publishedAt || null,
    readingTime: raw.readingTime || 1,
    seriesOrder: raw.seriesOrder || 0,
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    createdAt: raw.createdAt || undefined,
    seo: {
      title: raw.seo?.title || "",
      description: raw.seo?.description || "",
      ogImage: raw.seo?.ogImage || "",
    },
    authorId: toPerson(raw.author),
    editorId: toPerson(raw.editor),
    categoryIds: (raw.categories || []).map(toTaxonomy),
    tagIds: (raw.tags || []).map(toTaxonomy),
    seriesId: raw.series ? toTaxonomy(raw.series) : null,
  };
}

export function authorName(post: GraphqlPost) {
  return post.authorId?.name || undefined;
}

export async function fetchPosts(filter?: { status?: string; q?: string }) {
  const data = await apolloQuery<{ blogPortalPosts: RawGraphqlPost[] }>({
    query: LIST_POSTS_QUERY,
    variables: filter?.status || filter?.q ? { filter } : {},
  });
  return (data.blogPortalPosts || [])
    .map(normalizePost)
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.publishedAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.publishedAt || 0).getTime();
      return bTime - aTime;
    });
}

export async function fetchPublicPosts(filter?: { status?: string; q?: string }) {
  try {
    const posts = await fetchPosts(filter);
    return posts.sort((a, b) => {
      const aTime = new Date(a.publishedAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.publishedAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  } catch (err) {
    console.error("[graphql] ListPosts failed:", err);
    return [];
  }
}

export async function fetchPostById(id: string) {
  const data = await apolloQuery<{ blogPortalPost: RawGraphqlPost | null }>({
    query: GET_POST_QUERY,
    variables: { id },
  });
  return data.blogPortalPost ? normalizePost(data.blogPortalPost) : null;
}

export async function fetchPostBySlug(slug: string) {
  const data = await apolloQuery<{ blogPortalPostBySlug: RawGraphqlPost | null }>({
    query: GET_POST_BY_SLUG_QUERY,
    variables: { slug },
  });
  return data.blogPortalPostBySlug ? normalizePost(data.blogPortalPostBySlug) : null;
}

export async function fetchPublicPostBySlug(slug: string) {
  try {
    const post = await fetchPostBySlug(slug);
    if (!post || post.status !== "published") return null;
    return post;
  } catch (err) {
    console.error("[graphql] GetPostBySlug failed:", err);
    return null;
  }
}

export function postsInCategory(posts: GraphqlPost[], categoryId: string) {
  return posts.filter((post) => post.categoryIds.some((c) => c.id === categoryId));
}

export function postsWithTag(posts: GraphqlPost[], tagId: string) {
  return posts.filter((post) => post.tagIds.some((t) => t.id === tagId));
}

export function postsInSeries(posts: GraphqlPost[], seriesId: string) {
  return posts
    .filter((post) => post.seriesId?.id === seriesId)
    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
}
