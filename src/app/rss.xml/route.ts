import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { fetchPublicSettings } from "@/lib/graphql/settings";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await fetchPublicSettings();
  await connectDB();
  const posts = await Post.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(50)
    .lean();

  const items = posts
    .map((post) => {
      const link = siteUrl(`/blog/${post.slug}`);
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ""}</pubDate>
      <description><![CDATA[${post.excerpt || ""}]]></description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${settings.siteTitle}]]></title>
    <link>${siteUrl()}</link>
    <description><![CDATA[${settings.siteDescription || ""}]]></description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=600, stale-while-revalidate",
    },
  });
}
