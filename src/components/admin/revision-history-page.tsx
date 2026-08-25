"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { LIST_REVISIONS_QUERY } from "@/graphql/operations/revisions";
import { GET_POST_QUERY } from "@/graphql/operations/posts";
import { GET_PAGE_QUERY } from "@/graphql/operations/pages";
import { storeRevisionRestore } from "@/lib/revision-restore";

export type RevisionRecord = {
  id: string;
  title?: string | null;
  html?: string | null;
  lexicalJSON: string;
  createdAt?: string | null;
  author?: { id: string; name?: string | null } | null;
};

type RevisionsData = { blogPortalRevisions: RevisionRecord[] };

const REVISION_LIST_LIMIT = 50;

export function RevisionHistoryPage({
  documentId,
  documentType,
}: {
  documentId: string;
  documentType: "post" | "page";
}) {
  const router = useRouter();
  const editorHref =
    documentType === "post" ? `/admin/posts/${documentId}` : `/admin/pages/${documentId}`;
  const label = documentType === "post" ? "Post" : "Page";

  const titleQuery = useQuery<{ blogPortalPost?: { title: string } | null }>(
    GET_POST_QUERY,
    { variables: { id: documentId }, skip: documentType !== "post" }
  );
  const pageTitleQuery = useQuery<{ blogPortalPage?: { title: string } | null }>(
    GET_PAGE_QUERY,
    { variables: { id: documentId }, skip: documentType !== "page" }
  );

  const documentTitle =
    documentType === "post"
      ? titleQuery.data?.blogPortalPost?.title
      : pageTitleQuery.data?.blogPortalPage?.title;

  const { data, loading, error, refetch } = useQuery<RevisionsData>(LIST_REVISIONS_QUERY, {
    variables: { documentId, documentType },
  });

  const revisions = [...(data?.blogPortalRevisions || [])].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  const visibleRevisions = revisions.slice(0, REVISION_LIST_LIMIT);
  const hiddenCount = Math.max(0, revisions.length - visibleRevisions.length);

  const restore = (revision: RevisionRecord) => {
    if (
      !window.confirm(
        "Restore this revision into the editor? Unsaved changes in the current draft will be replaced."
      )
    ) {
      return;
    }
    storeRevisionRestore(documentType, documentId, revision);
    router.push(editorHref);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={editorHref}
            className="text-sm font-medium text-teal-800 hover:underline"
          >
            ← Back to {label.toLowerCase()} editor
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-stone-900">Revision history</h1>
          <p className="mt-1 text-sm text-stone-500">
            {documentTitle ? (
              <>
                <span className="font-medium text-stone-700">{documentTitle}</span>
                {" · "}
              </>
            ) : null}
            Snapshots are created when you save or publish — not on autosave.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-sm text-stone-500">Loading revisions…</p> : null}
      {error ? <p className="text-sm text-red-700">{error.message}</p> : null}

      {!loading && !error && revisions.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-stone-600">No revisions yet.</p>
          <p className="mt-1 text-sm text-stone-500">
            Use Save draft or Publish in the editor to create a snapshot.
          </p>
          <Link
            href={editorHref}
            className="mt-4 inline-block text-sm font-medium text-teal-800 hover:underline"
          >
            Go to editor
          </Link>
        </div>
      ) : null}

      {visibleRevisions.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <ul className="divide-y divide-stone-200">
            {visibleRevisions.map((revision) => (
              <li
                key={revision.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {revision.title || "Untitled snapshot"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {revision.createdAt
                      ? format(new Date(revision.createdAt), "MMM d, yyyy HH:mm")
                      : "Unknown date"}
                    {revision.author?.name ? ` · ${revision.author.name}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-800"
                  onClick={() => restore(revision)}
                >
                  Restore in editor
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hiddenCount > 0 ? (
        <p className="text-xs text-stone-500">
          Showing the {REVISION_LIST_LIMIT} most recent revisions ({hiddenCount} older hidden).
        </p>
      ) : null}
    </div>
  );
}
