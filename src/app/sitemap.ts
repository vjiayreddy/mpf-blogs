import { fetchPublicPages } from "@/lib/graphql/pages";
import { fetchPublicPosts } from "@/lib/graphql/posts";
import { siteUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages] = await Promise.all([
    fetchPublicPosts({ status: "published" }),
    fetchPublicPages(),
  ]);

  return [
    { url: siteUrl("/"), lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/blog"), lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/search"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    ...posts.map((post) => ({
      url: siteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...pages.map((page) => ({
      url: siteUrl(`/${page.slug}`),
      lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
