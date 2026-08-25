import Link from "next/link";
import { fetchPublicSettings } from "@/lib/graphql/settings";
import { authorName, fetchPublicPosts } from "@/lib/graphql/posts";
import { PostCard } from "@/components/public/post-card";
import { buildMetadata, websiteJsonLd } from "@/lib/seo";
import { jsonLdScript } from "@/lib/sanitize-html";
import { safeMediaUrl } from "@/lib/safe-url";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchPublicSettings();
  return buildMetadata({
    title: settings.defaultSeo?.title || settings.siteTitle,
    description: settings.defaultSeo?.description || settings.siteDescription,
    path: "/",
    image: safeMediaUrl(settings.defaultSeo?.ogImage) || safeMediaUrl(settings.logo),
  });
}

export default async function HomePage() {
  const settings = await fetchPublicSettings();
  const published = await fetchPublicPosts({ status: "published" });
  const featured = published.filter((post) => post.featured).slice(0, 3);
  const latest = published.slice(0, 9);

  const jsonLd = websiteJsonLd(settings.siteTitle, settings.siteDescription || "");

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <section className="border-b border-stone-200 bg-gradient-to-b from-[#f3efe8] to-[#faf8f5]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <p className="font-[family-name:var(--font-dm-sans)] text-sm font-medium uppercase tracking-[0.2em] text-teal-800">
            {settings.siteTitle}
          </p>
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-source-serif)] text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-6xl">
            Stories worth reading
          </h1>
          <p className="mt-5 max-w-xl text-lg text-stone-600">
            {settings.siteDescription}
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/blog"
              className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Browse posts
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800"
            >
              Search
            </Link>
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Featured</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {featured.map((post) => (
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
        </section>
      ) : null}

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Latest</h2>
          <Link href="/blog" className="text-sm font-medium text-teal-800 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {latest.map((post) => (
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
        {latest.length === 0 ? (
          <p className="mt-6 text-stone-500">No published posts yet.</p>
        ) : null}
      </section>
    </div>
  );
}
