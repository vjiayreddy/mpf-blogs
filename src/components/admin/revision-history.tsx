"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { useQuery } from "@apollo/client/react";
import { LIST_REVISIONS_QUERY } from "@/graphql/operations/revisions";

export type RevisionRecord = {
  id: string;
  title?: string | null;
  html?: string | null;
  lexicalJSON: string;
  createdAt?: string | null;
  author?: { id: string; name?: string | null } | null;
};

type RevisionsData = { blogPortalRevisions: RevisionRecord[] };

export function RevisionHistory({
  documentId,
  documentType,
  refreshKey,
  onRestore,
}: {
  documentId: string;
  documentType: "post" | "page";
  refreshKey?: string | number | null;
  onRestore: (revision: RevisionRecord) => void;
}) {
  const { data, loading, error, refetch } = useQuery<RevisionsData>(LIST_REVISIONS_QUERY, {
    variables: { documentId, documentType },
    skip: !documentId,
  });

  useEffect(() => {
    if (!documentId || refreshKey == null || refreshKey === "") return;
    void refetch();
  }, [documentId, refreshKey, refetch]);

  const revisions = [...(data?.blogPortalRevisions || [])].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <section className="border-t border-stone-200 pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Revision history</h2>
          <p className="text-sm text-stone-500">Restore a previous snapshot into the editor, then save.</p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm font-medium text-teal-800 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm text-stone-500">Loading revisions…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error.message}</p> : null}

      {!loading && !error && revisions.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">No revisions yet. Save with history to create one.</p>
      ) : null}

      {revisions.length > 0 ? (
        <ul className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
          {revisions.map((revision) => (
            <li key={revision.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
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
                onClick={() => {
                  if (
                    !window.confirm(
                      "Restore this revision into the editor? Unsaved changes in the current draft will be replaced."
                    )
                  ) {
                    return;
                  }
                  onRestore(revision);
                }}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
