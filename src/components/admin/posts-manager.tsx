"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery } from "@apollo/client/react";
import { LIST_POSTS_QUERY } from "@/graphql/operations/posts";
import { DeletePostButton } from "@/components/admin/delete-post-button";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt?: string | null;
};

type ListPostsData = {
  blogPortalPosts: PostRow[];
};

export function PostsManager() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [applied, setApplied] = useState({ q: "", status: "" });

  const variables = useMemo(() => {
    if (!applied.status && !applied.q) return {};
    return {
      filter: {
        ...(applied.status ? { status: applied.status } : {}),
        ...(applied.q ? { q: applied.q } : {}),
      },
    };
  }, [applied]);

  const { data, loading, error, refetch } = useQuery<ListPostsData>(LIST_POSTS_QUERY, {
    variables,
  });
  const posts = data?.blogPortalPosts || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Posts</h1>
          <p className="text-sm text-stone-500">
            {loading ? "Loading…" : `${posts.length} posts`}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          New post
        </Link>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ q, status });
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
        <button type="submit" className="rounded-full bg-stone-200 px-4 py-2 text-sm font-medium">
          Filter
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error.message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-stone-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${post.id}`} className="font-medium hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-xs text-stone-400">/{post.slug}</p>
                </td>
                <td className="px-4 py-3 capitalize">{post.status}</td>
                <td className="px-4 py-3 text-stone-500">
                  {post.updatedAt ? format(new Date(post.updatedAt), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <DeletePostButton id={post.id} onDeleted={() => void refetch()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && posts.length === 0 ? (
          <p className="px-4 py-8 text-sm text-stone-500">No posts found.</p>
        ) : null}
      </div>
    </div>
  );
}
