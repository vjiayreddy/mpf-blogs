import { PostEditorForm } from "@/components/admin/post-editor-form";
import { listTaxonomies } from "@/app/actions/content";
import { auth } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import type { Role } from "@/lib/constants";

export default async function NewPostPage() {
  const session = await auth();
  const { categories, tags, series } = await listTaxonomies();

  return (
    <PostEditorForm
      mode="create"
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
