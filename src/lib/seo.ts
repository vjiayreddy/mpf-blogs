import type { Metadata } from "next";
import { siteUrl } from "@/lib/utils";
import { safeMediaUrl } from "@/lib/safe-url";

type SeoInput = {
  title?: string | null;
  description?: string | null;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  publishedAt?: string | Date | null;
  authors?: string[];
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
  publishedAt,
  authors,
  noIndex,
}: SeoInput): Metadata {
  const siteTitle = title || "Blog Portal";
  const desc = description || "A Ghost-like publishing platform";
  const url = siteUrl(path);
  const ogImage = safeMediaUrl(image);

  return {
    title: siteTitle,
    description: desc,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: siteTitle,
      description: desc,
      url,
      type,
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      authors,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export function blogPostingJsonLd(post: {
  title: string;
  description: string;
  slug: string;
  coverImage?: string;
  publishedAt?: Date | string | null;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : undefined,
    mainEntityOfPage: siteUrl(`/blog/${post.slug}`),
  };
}

export function websiteJsonLd(siteTitle: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteTitle,
    description,
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
