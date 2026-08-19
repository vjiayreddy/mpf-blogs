import { notFound } from "next/navigation";
import { PostCard } from "@/components/public/post-card";
import { buildMetadata } from "@/lib/seo";
import { fetchPublicPosts, postsInCategory } from "@/lib/graphql/posts";
import { fetchPublicTaxonomies, findBySlug } from "@/lib/graphql/taxonomies";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await fetchPublicTaxonomies();
  const category = findBySlug(categories, slug);
  if (!category) return {};
  return buildMetadata({
    title: category.name,
    description: category.description || `Posts in ${category.name}`,
    path: `/category/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { categories } = await fetchPublicTaxonomies();
  const category = findBySlug(categories, slug);
  if (!category) notFound();

  const posts = postsInCategory(
    await fetchPublicPosts({ status: "published" }),
    category.id
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">{category.name}</h1>
      {category.description ? (
        <p className="mt-2 text-stone-600">{category.description}</p>
      ) : null}
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
