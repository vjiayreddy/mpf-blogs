"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import {
  DELETE_MEDIA_MUTATION,
  LIST_MEDIA_QUERY,
  UPDATE_MEDIA_ALT_MUTATION,
} from "@/graphql/operations/media";
import { hasMinRole } from "@/lib/rbac";
import type { Role } from "@/lib/constants";

type MediaItem = {
  id: string;
  url: string;
  alt?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
};

type MediaData = { blogPortalMedia: MediaItem[] };

export function MediaLibrary() {
  const { data: sessionData } = useSession();
  const canDelete = hasMinRole((sessionData?.user?.role as Role) || "READER", "ADMIN");
  const { data, loading, error, refetch } = useQuery<MediaData>(LIST_MEDIA_QUERY, {
    variables: { limit: 48 },
  });
  const [updateAlt] = useMutation(UPDATE_MEDIA_ALT_MUTATION);
  const [deleteMedia] = useMutation(DELETE_MEDIA_MUTATION);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  const items = data?.blogPortalMedia || [];

  async function onUpload(file: File) {
    setUploading(true);
    setFormError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("alt", file.name);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Upload failed");
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <p className="text-sm text-stone-500">Loading media…</p>;
  if (error) return <p className="text-sm text-red-700">{error.message}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Media library</h1>
          <p className="text-sm text-stone-500">Upload images to Cloudinary</p>
        </div>
        <label className="cursor-pointer rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          {uploading ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
        </label>
      </div>
      {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt || ""} className="aspect-square w-full object-cover" />
            <figcaption className="space-y-2 p-3">
              <input
                defaultValue={item.alt || ""}
                placeholder="Alt text"
                className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
                onBlur={async (e) => {
                  await updateAlt({ variables: { id: item.id, alt: e.target.value } });
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-teal-800"
                  onClick={() => navigator.clipboard.writeText(item.url)}
                >
                  Copy URL
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-red-700"
                    onClick={async () => {
                      await deleteMedia({ variables: { id: item.id } });
                      await refetch();
                    }}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">No media yet. Upload your first image.</p>
      ) : null}
    </div>
  );
}
