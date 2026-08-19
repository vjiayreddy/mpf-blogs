import { notFound } from "next/navigation";
import { PostCard } from "@/components/public/post-card";
import { buildMetadata } from "@/lib/seo";
import { fetchPublicPosts, postsInSeries } from "@/lib/graphql/posts";
import { fetchPublicTaxonomies, findBySlug } from "@/lib/graphql/taxonomies";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { series } = await fetchPublicTaxonomies();
  const item = findBySlug(series, slug);
  if (!item) return {};
  return buildMetadata({
    title: item.name,
    description: item.description || `Posts in series ${item.name}`,
    path: `/series/${item.slug}`,
    image: item.coverImage,
  });
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { series } = await fetchPublicTaxonomies();
  const item = findBySlug(series, slug);
  if (!item) notFound();

  const posts = postsInSeries(await fetchPublicPosts({ status: "published" }), item.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">{item.name}</h1>
      {item.description ? <p className="mt-2 text-stone-600">{item.description}</p> : null}
      <div className="mt-10 grid gap-10 md:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt || undefined}
            coverImage={post.coverImage || undefined}
            publishedAt={post.publishedAt}
            readingTime={post.readingTime}
          />
        ))}
      </div>
    </div>
  );
}
