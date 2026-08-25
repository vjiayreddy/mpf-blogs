import { notFound } from "next/navigation";
import { fetchPublicPageBySlug } from "@/lib/graphql/pages";
import { buildMetadata } from "@/lib/seo";
import { TrackPageView } from "@/components/public/track-page-view";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import { safeMediaUrl } from "@/lib/safe-url";
import type { Metadata } from "next";

const RESERVED = new Set([
  "blog",
  "admin",
  "login",
  "search",
  "category",
  "tag",
  "series",
  "api",
  "rss.xml",
  "sitemap.xml",
  "robots.txt",
]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}): Promise<Metadata> {
  const { pageSlug } = await params;
  if (RESERVED.has(pageSlug)) return {};
  const page = await fetchPublicPageBySlug(pageSlug);
  if (!page) return {};
  return buildMetadata({
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.excerpt || "",
    path: `/${page.slug}`,
    image: safeMediaUrl(page.seo?.ogImage) || safeMediaUrl(page.coverImage),
  });
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}) {
  const { pageSlug } = await params;
  if (RESERVED.has(pageSlug)) notFound();

  const page = await fetchPublicPageBySlug(pageSlug);
  if (!page) notFound();

  const coverImage = safeMediaUrl(page.coverImage);

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <TrackPageView path={`/${page.slug}`} />
      <h1 className="font-[family-name:var(--font-source-serif)] text-4xl font-semibold tracking-tight text-stone-900">
        {page.title}
      </h1>
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImage} alt="" className="mt-8 aspect-[16/9] w-full object-cover" />
      ) : null}
      <div
        className="prose-blog mt-10"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.html) }}
      />
    </article>
  );
}
