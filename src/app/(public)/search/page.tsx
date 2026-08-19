import { fetchPublicPosts } from "@/lib/graphql/posts";
import { PostCard } from "@/components/public/post-card";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search published posts",
  path: "/search",
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const posts = q?.trim()
    ? await fetchPublicPosts({ status: "published", q: q.trim() })
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">Search</h1>
      <form className="mt-6">
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Search posts…"
          className="w-full max-w-xl rounded-full border border-stone-300 bg-white px-5 py-3 text-sm outline-none focus:border-stone-900"
        />
      </form>
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
      {q && posts.length === 0 ? (
        <p className="mt-6 text-stone-500">No results for “{q}”.</p>
      ) : null}
    </div>
  );
}
