import { notFound } from "next/navigation";
import { PostEditorForm } from "@/components/admin/post-editor-form";
import { getPost, listTaxonomies } from "@/app/actions/content";
import { auth } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import type { Role, ContentStatus } from "@/lib/constants";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  let post;
  try {
    post = await getPost(id);
  } catch {
    notFound();
  }

  const { categories, tags, series } = await listTaxonomies();

  const categoryIds = (post.categoryIds || []).map(
    (c: { _id?: string } | string) => (typeof c === "string" ? c : c._id!)
  );
  const tagIds = (post.tagIds || []).map(
    (t: { _id?: string } | string) => (typeof t === "string" ? t : t._id!)
  );
  const seriesId =
    typeof post.seriesId === "object" && post.seriesId
      ? post.seriesId._id
      : post.seriesId || null;

  return (
    <PostEditorForm
      mode="edit"
      postId={post._id}
      initial={{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        lexicalJSON: post.lexicalJSON,
        html: post.html,
        status: post.status as ContentStatus,
        coverImage: post.coverImage,
        categoryIds,
        tagIds,
        seriesId,
        seriesOrder: post.seriesOrder,
        featured: post.featured,
        scheduledAt: post.scheduledAt,
        seo: post.seo,
      }}
      categories={categories.map((c: { _id: string; name: string }) => ({
        _id: c._id,
        name: c.name,
      }))}
      tags={tags.map((t: { _id: string; name: string }) => ({ _id: t._id, name: t.name }))}
      series={series.map((s: { _id: string; name: string }) => ({ _id: s._id, name: s.name }))}
      canPublish={canPublish(session!.user.role as Role)}
    />
  );
}
