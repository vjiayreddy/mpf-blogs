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

