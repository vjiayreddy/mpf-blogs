import { authorName, fetchPublicPosts } from "@/lib/graphql/posts";
import { PostCard } from "@/components/public/post-card";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description: "All published posts",
  path: "/blog",
});

export default async function BlogIndexPage() {
  const posts = await fetchPublicPosts({ status: "published" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-stone-900">Blog</h1>
      <p className="mt-2 text-stone-600">All published articles</p>
      <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt || undefined}
            coverImage={post.coverImage || undefined}
            publishedAt={post.publishedAt}
            readingTime={post.readingTime}
            authorName={authorName(post)}
          />
        ))}
      </div>
    </div>
  );
}
