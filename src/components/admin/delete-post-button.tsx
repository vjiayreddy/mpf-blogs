"use client";

import { useMutation } from "@apollo/client/react";
import { DELETE_POST_MUTATION } from "@/graphql/operations/posts";

export function DeletePostButton({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted?: () => void;
}) {
  const [deletePost, { loading }] = useMutation(DELETE_POST_MUTATION);

  return (
    <button
      type="button"
      disabled={loading}
      className="text-xs text-red-700 hover:underline"
      onClick={async () => {
        if (!confirm("Delete this post?")) return;
        await deletePost({ variables: { id } });
        onDeleted?.();
      }}
    >
      Delete
    </button>
  );
}
