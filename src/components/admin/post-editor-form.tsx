"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LexicalEditor } from "@/components/editor/lexical-editor";
import { AiGeneratePanel, type AiGeneratedPost } from "@/components/admin/ai-generate-panel";
import { createPost, updatePost } from "@/app/actions/content";
import type { ContentStatus } from "@/lib/constants";

type Taxonomy = { _id: string; name: string };
type SeriesItem = { _id: string; name: string };

type PostFormProps = {
  mode: "create" | "edit";
  postId?: string;
  initial?: {
    title?: string;
    slug?: string;
    excerpt?: string;
    lexicalJSON?: string;
    html?: string;
    status?: ContentStatus;
    coverImage?: string;
    categoryIds?: string[];
    tagIds?: string[];
    seriesId?: string | null;
    seriesOrder?: number;
    featured?: boolean;
    scheduledAt?: string | null;
    seo?: { title?: string; description?: string; ogImage?: string };
  };
  categories: Taxonomy[];
  tags: Taxonomy[];
  series: SeriesItem[];
  canPublish: boolean;
};

export function PostEditorForm({
  mode,
  postId,
  initial,
  categories,
  tags,
  series,
  canPublish,
}: PostFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [status, setStatus] = useState<ContentStatus>(initial?.status || "draft");
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduledAt
      ? new Date(initial.scheduledAt).toISOString().slice(0, 16)
      : ""
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds || []);
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds || []);
  const [seriesId, setSeriesId] = useState(initial?.seriesId || "");
  const [featured, setFeatured] = useState(initial?.featured || false);
  const [seoTitle, setSeoTitle] = useState(initial?.seo?.title || "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo?.description || "");
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [htmlToImport, setHtmlToImport] = useState<{ html: string; key: number } | undefined>();
  const contentRef = useRef({
    lexicalJSON: initial?.lexicalJSON || "",
    html: initial?.html || "",
  });
  const autosaveCount = useRef(0);
  const currentId = useRef(postId);
  const importKey = useRef(0);

  const buildPayload = useCallback(
    (overrideStatus?: ContentStatus) => ({
      title: title || "Untitled",
      slug: slug || undefined,
      excerpt,
      lexicalJSON: contentRef.current.lexicalJSON,
      html: contentRef.current.html,
      status: overrideStatus || status,
      coverImage,
      categoryIds,
      tagIds,
      seriesId: seriesId || null,
      featured,
      scheduledAt:
        (overrideStatus || status) === "scheduled" && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : null,
      seo: {
        title: seoTitle || undefined,
        description: seoDescription || undefined,
        ogImage: coverImage || undefined,
      },
    }),
    [
      title,
      slug,
      excerpt,
      status,
      coverImage,
      categoryIds,
      tagIds,
      seriesId,
      featured,
      scheduledAt,
      seoTitle,
      seoDescription,
    ]
  );

  const persist = useCallback(
    async (opts?: { status?: ContentStatus; revision?: boolean; navigate?: boolean }) => {
      try {
        const payload = buildPayload(opts?.status);
        if (mode === "create" && !currentId.current) {
          const created = await createPost(payload);
          currentId.current = created._id;
          setMessage("Created");
          if (opts?.navigate !== false) {
            router.replace(`/admin/posts/${created._id}`);
          }
        } else if (currentId.current) {
          await updatePost(currentId.current, payload, {
            createRevision: opts?.revision,
          });
          setMessage("Saved");
        }
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Save failed");
      }
    },
    [buildPayload, mode, router]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      if (!title && !contentRef.current.lexicalJSON) return;
      autosaveCount.current += 1;
      startTransition(() => {
        void persist({
          revision: autosaveCount.current % 5 === 0,
          navigate: false,
        });
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [persist, title]);

  const onEditorChange = useCallback((payload: { lexicalJSON: string; html: string }) => {
    contentRef.current = payload;
  }, []);

  const checkExistingContent = useCallback(() => {
    return Boolean(
      title.trim() ||
        excerpt.trim() ||
        seoTitle.trim() ||
        seoDescription.trim() ||
        contentRef.current.lexicalJSON ||
        contentRef.current.html
    );
  }, [title, excerpt, seoTitle, seoDescription]);

  const onAiGenerated = useCallback((payload: AiGeneratedPost) => {
    setTitle(payload.title);
    setExcerpt(payload.excerpt);
    setSeoTitle(payload.seo.title);
    setSeoDescription(payload.seo.description);
    importKey.current += 1;
    setHtmlToImport({ html: payload.html, key: importKey.current });
    setMessage("AI draft applied — review and save");
  }, []);

  const toggleId = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">
            {mode === "create" ? "New post" : "Edit post"}
          </h1>
          <p className="text-sm text-stone-500">
            {lastSaved ? `Last saved ${lastSaved}` : "Autosave every 10s"}
            {message ? ` · ${message}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentId.current ? (
            <a
              href={`/admin/preview/post/${currentId.current}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
            >
              Preview
            </a>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await persist({ status: "draft", revision: true });
              })
            }
            className="rounded-full bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900"
          >
            Save draft
          </button>
          {canPublish ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setStatus("scheduled");
                    await persist({ status: "scheduled", revision: true });
                  })
                }
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
              >
                Schedule
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Publish this post? It will be visible on the site.")) {
                    return;
                  }
                  startTransition(async () => {
                    setStatus("published");
                    await persist({ status: "published", revision: true });
                  });
                }}
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                Publish
              </button>
            </>
          ) : null}
        </div>
      </div>

      <AiGeneratePanel hasExistingContent={checkExistingContent} onGenerated={onAiGenerated} />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        className="w-full border-0 border-b border-stone-200 bg-transparent pb-3 text-3xl font-semibold outline-none placeholder:text-stone-300"
      />

      <LexicalEditor
        initialJSON={initial?.lexicalJSON}
        htmlToImport={htmlToImport}
        onChange={onEditorChange}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Cover image URL</span>
          <input
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            placeholder="https://…"
          />
        </label>
        <label className="block text-sm lg:col-span-2">
          <span className="mb-1 block font-medium text-stone-700">Excerpt</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContentStatus)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          >
            <option value="draft">Draft</option>
            {canPublish ? <option value="scheduled">Scheduled</option> : null}
            {canPublish ? <option value="published">Published</option> : null}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Schedule at</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Series</span>
          <select
            value={seriesId}
            onChange={(e) => setSeriesId(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          >
            <option value="">None</option>
            {series.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Featured on home
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-700">Categories</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => setCategoryIds((prev) => toggleId(prev, c._id))}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  categoryIds.includes(c._id)
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-700">Tags</legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => setTagIds((prev) => toggleId(prev, t._id))}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tagIds.includes(t._id)
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">SEO title</span>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">SEO description</span>
          <input
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
      </div>
    </div>
  );
}
