import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  authorName,
  fetchPublicPostBySlug,
  fetchPublicPosts,
  postsInSeries,
} from "@/lib/graphql/posts";
import { blogPostingJsonLd, buildMetadata } from "@/lib/seo";
import { TrackPageView } from "@/components/public/track-page-view";
import { jsonLdScript, sanitizeRichHtml } from "@/lib/sanitize-html";
import { safeMediaUrl } from "@/lib/safe-url";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublicPostBySlug(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    path: `/blog/${post.slug}`,
    image: safeMediaUrl(post.seo?.ogImage) || safeMediaUrl(post.coverImage),
    type: "article",
    publishedAt: post.publishedAt,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPublicPostBySlug(slug);
  if (!post) notFound();

  const published = await fetchPublicPosts({ status: "published" });

  const seriesNav: { prev?: { slug: string; title: string }; next?: { slug: string; title: string } } =
    {};
  if (post.seriesId) {
    const seriesPosts = postsInSeries(published, post.seriesId.id);
    const idx = seriesPosts.findIndex((p) => p.id === post.id);
    if (idx > 0) seriesNav.prev = seriesPosts[idx - 1];
    if (idx >= 0 && idx < seriesPosts.length - 1) seriesNav.next = seriesPosts[idx + 1];
  }

  const tagIds = new Set(post.tagIds.map((t) => t.id));
  const related = tagIds.size
    ? published
        .filter((p) => p.id !== post.id && p.tagIds.some((t) => tagIds.has(t.id)))
        .slice(0, 3)
    : [];

  const name = authorName(post);
  const jsonLd = blogPostingJsonLd({
    title: post.title,
    description: post.excerpt || "",
    slug: post.slug,
    coverImage: safeMediaUrl(post.coverImage),
    publishedAt: post.publishedAt,
    authorName: name,
  });

  const coverImage = safeMediaUrl(post.coverImage);

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <TrackPageView path={`/blog/${post.slug}`} postId={post.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <p className="text-sm text-stone-500">
        {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : ""}
        {post.readingTime ? ` · ${post.readingTime} min read` : ""}
        {name ? ` · ${name}` : ""}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-source-serif)] text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
        {post.title}
      </h1>
      {post.excerpt ? <p className="mt-4 text-lg text-stone-600">{post.excerpt}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {post.categoryIds.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-700"
          >
            {c.name}
          </Link>
        ))}
        {post.tagIds.map((t) => (
          <Link
            key={t.id}
            href={`/tag/${t.slug}`}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600"
          >
            #{t.name}
          </Link>
        ))}
      </div>

      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImage} alt="" className="mt-8 aspect-[16/9] w-full object-cover" />
      ) : null}

      <div
        className="prose-blog mt-10"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.html) }}
      />

      {post.seriesId?.slug ? (
        <div className="mt-12 rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm font-medium text-stone-500">Series</p>
          <Link
            href={`/series/${post.seriesId.slug}`}
            className="text-lg font-semibold hover:underline"
          >
            {post.seriesId.name}
          </Link>
          <div className="mt-4 flex justify-between gap-4 text-sm">
            {seriesNav.prev ? (
              <Link href={`/blog/${seriesNav.prev.slug}`} className="text-teal-800 hover:underline">
                ← {seriesNav.prev.title}
              </Link>
            ) : (
              <span />
            )}
            {seriesNav.next ? (
              <Link href={`/blog/${seriesNav.next.slug}`} className="text-teal-800 hover:underline">
                {seriesNav.next.title} →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-14 border-t border-stone-200 pt-10">
          <h2 className="text-xl font-semibold">Related</h2>
          <ul className="mt-4 space-y-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/blog/${r.slug}`} className="font-medium hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
