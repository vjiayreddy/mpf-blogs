import { PostEditorForm } from "@/components/admin/post-editor-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PostEditorForm mode="edit" postId={id} />;
}
