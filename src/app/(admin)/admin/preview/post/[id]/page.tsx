import { auth } from "@/lib/auth";
import { fetchPostById } from "@/lib/graphql/posts";
import { notFound, redirect } from "next/navigation";
import { canEditAnyContent } from "@/lib/rbac";
import type { Role } from "@/lib/constants";

export default async function PreviewPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const post = await fetchPostById(id);
  if (!post) notFound();

  if (
    !canEditAnyContent(session.user.role as Role) &&
    post.authorId?.id !== session.user.id
  ) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
        Preview mode · status: {post.status}
      </div>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">{post.title}</h1>
        {post.excerpt ? <p className="mt-4 text-lg text-stone-600">{post.excerpt}</p> : null}
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt="" className="mt-8 aspect-[16/9] w-full object-cover" />
        ) : null}
        <div
          className="prose-blog mt-10"
          dangerouslySetInnerHTML={{ __html: post.html || "<p>No content yet.</p>" }}
        />
      </article>
    </div>
  );
}
