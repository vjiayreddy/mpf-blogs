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

type LocalUpload = MediaItem & { local: true };

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
  const [notice, setNotice] = useState("");
  const [localUploads, setLocalUploads] = useState<LocalUpload[]>([]);

  const items = data?.blogPortalMedia || [];

  async function onUpload(file: File) {
    setUploading(true);
    setFormError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("alt", file.name);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Upload failed");
      const uploaded: LocalUpload = {
        id: payload.id || payload.publicId,
        url: payload.url,
        alt: payload.alt || file.name,
        width: payload.width,
        height: payload.height,
        format: payload.format,
        local: true,
      };
      setLocalUploads((prev) => [uploaded, ...prev]);
      try {
        await navigator.clipboard.writeText(uploaded.url);
        setNotice("Uploaded to Cloudinary. URL copied — paste it into a cover image field.");
      } catch {
        setNotice("Uploaded to Cloudinary. Copy the URL to use it as a cover image.");
      }
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
          <p className="text-sm text-stone-500">
            Upload to Cloudinary, then copy the URL. The grid is the GraphQL media library.
          </p>
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
      {notice ? <p className="text-sm text-teal-800">{notice}</p> : null}
      {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {localUploads.map((item) => (
          <MediaCard
            key={`local-${item.id}`}
            item={item}
            badge="Just uploaded"
            onCopy={() => navigator.clipboard.writeText(item.url)}
          />
        ))}
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            canDelete={canDelete}
            onCopy={() => navigator.clipboard.writeText(item.url)}
            onAltBlur={async (alt) => {
              await updateAlt({ variables: { id: item.id, alt } });
            }}
            onDelete={async () => {
              await deleteMedia({ variables: { id: item.id } });
              await refetch();
            }}
          />
        ))}
      </div>
      {items.length === 0 && localUploads.length === 0 ? (
        <p className="text-sm text-stone-500">No media yet. Upload your first image.</p>
      ) : null}
    </div>
  );
}

function MediaCard({
  item,
  badge,
  canDelete,
  onCopy,
  onAltBlur,
  onDelete,
}: {
  item: MediaItem;
  badge?: string;
  canDelete?: boolean;
  onCopy: () => void;
  onAltBlur?: (alt: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.alt || ""} className="aspect-square w-full object-cover" />
      <figcaption className="space-y-2 p-3">
        {badge ? <p className="text-[11px] font-medium uppercase tracking-wide text-teal-800">{badge}</p> : null}
        <input
          defaultValue={item.alt || ""}
          placeholder="Alt text"
          className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
          readOnly={!onAltBlur}
          onBlur={async (e) => {
            if (onAltBlur) await onAltBlur(e.target.value);
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="text-xs font-medium text-teal-800" onClick={onCopy}>
            Copy URL
          </button>
          {canDelete && onDelete ? (
            <button
              type="button"
              className="text-xs font-medium text-red-700"
              onClick={() => void onDelete()}
            >
              Delete
            </button>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}
