"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { LexicalEditor } from "@/components/editor/lexical-editor";
import { AiGeneratePanel, type AiGeneratedPost } from "@/components/admin/ai-generate-panel";
import { RevisionHistory, type RevisionRecord } from "@/components/admin/revision-history";
import {
  CREATE_POST_MUTATION,
  GET_POST_QUERY,
  UPDATE_POST_MUTATION,
} from "@/graphql/operations/posts";
import { LIST_TAXONOMIES_QUERY } from "@/graphql/operations/taxonomies";
import { toPostInput, type RawGraphqlPost } from "@/lib/graphql/posts-input";
import { slugify } from "@/lib/utils";
import { canPublish } from "@/lib/rbac";
import type { ContentStatus, Role } from "@/lib/constants";

type Taxonomy = { id: string; name: string };
type TaxonomiesData = {
  blogPortalCategories: Taxonomy[];
  blogPortalTags: Taxonomy[];
  blogPortalSeriesList: Taxonomy[];
};
type GetPostData = { blogPortalPost: RawGraphqlPost | null };
type CreatePostData = { blogPortalCreatePost: { id: string } };

export function PostEditorForm({
  mode,
  postId,
}: {
  mode: "create" | "edit";
  postId?: string;
}) {
  const { data: sessionData } = useSession();
  const role = (sessionData?.user?.role as Role) || "READER";
  const { data: taxData, loading: taxLoading } = useQuery<TaxonomiesData>(LIST_TAXONOMIES_QUERY);
  const { data: postData, loading: postLoading, error } = useQuery<GetPostData>(GET_POST_QUERY, {
    variables: { id: postId },
    skip: !postId,
  });

  if (taxLoading || (mode === "edit" && postLoading)) {
    return <p className="text-sm text-stone-500">Loading editor…</p>;
  }
  if (mode === "edit" && (error || !postData?.blogPortalPost)) {
    return <p className="text-sm text-red-700">{error?.message || "Post not found"}</p>;
  }

  return (
    <PostEditorFields
      key={postId || "new"}
      mode={mode}
      postId={postId}
      initial={postData?.blogPortalPost || undefined}
      categories={taxData?.blogPortalCategories || []}
      tags={taxData?.blogPortalTags || []}
      series={taxData?.blogPortalSeriesList || []}
      canPublish={canPublish(role)}
    />
  );
}

function PostEditorFields({
  mode,
  postId,
  initial,
  categories,
  tags,
  series,
  canPublish: canPub,
}: {
  mode: "create" | "edit";
  postId?: string;
  initial?: RawGraphqlPost;
  categories: Taxonomy[];
  tags: Taxonomy[];
  series: Taxonomy[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createPost] = useMutation<CreatePostData>(CREATE_POST_MUTATION);
  const [updatePost] = useMutation(UPDATE_POST_MUTATION);
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [status, setStatus] = useState<ContentStatus>(
    (initial?.status as ContentStatus) || "draft"
  );
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    (initial?.categories || []).map((c) => c.id)
  );
  const [tagIds, setTagIds] = useState<string[]>((initial?.tags || []).map((t) => t.id));
  const [seriesId, setSeriesId] = useState(initial?.series?.id || "");
  const [featured, setFeatured] = useState(Boolean(initial?.featured));
  const [seoTitle, setSeoTitle] = useState(initial?.seo?.title || "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo?.description || "");
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [htmlToImport, setHtmlToImport] = useState<{ html: string; key: number } | undefined>();
  const [jsonToImport, setJsonToImport] = useState<{ json: string; key: number } | undefined>();
  const contentRef = useRef({
    lexicalJSON: initial?.lexicalJSON || "",
    html: initial?.html || "",
  });
  const autosaveCount = useRef(0);
  const [currentId, setCurrentId] = useState<string | undefined>(postId);
  const importKey = useRef(0);

  const buildPayload = useCallback(
    (overrideStatus?: ContentStatus) =>
      toPostInput({
        title: title || "Untitled",
        slug: slug || slugify(title || "untitled"),
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
        const input = buildPayload(opts?.status);
        if (mode === "create" && !currentId) {
          const result = await createPost({ variables: { input } });
          const createdId = result.data?.blogPortalCreatePost.id;
          if (!createdId) throw new Error("Create post failed");
          setCurrentId(createdId);
          setMessage("Created");
          if (opts?.navigate !== false) {
            router.replace(`/admin/posts/${createdId}`);
          }
        } else if (currentId) {
          await updatePost({
            variables: {
              id: currentId,
              input,
              createRevision: Boolean(opts?.revision),
            },
          });
          setMessage("Saved");
        }
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Save failed");
      }
    },
    [buildPayload, mode, router, createPost, updatePost, currentId]
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

  const restoreRevision = useCallback((revision: RevisionRecord) => {
    if (revision.title) setTitle(revision.title);
    contentRef.current = {
      lexicalJSON: revision.lexicalJSON || "",
      html: revision.html || "",
    };
    importKey.current += 1;
    if (revision.lexicalJSON) {
      setJsonToImport({ json: revision.lexicalJSON, key: importKey.current });
    } else if (revision.html) {
      setHtmlToImport({ html: revision.html, key: importKey.current });
    }
    setMessage("Revision restored — review and save");
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
          {currentId ? (
            <a
              href={`/admin/preview/post/${currentId}`}
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
          {canPub ? (
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
        initialJSON={initial?.lexicalJSON || undefined}
        htmlToImport={htmlToImport}
        jsonToImport={jsonToImport}
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
            {canPub ? <option value="scheduled">Scheduled</option> : null}
            {canPub ? <option value="published">Published</option> : null}
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
              <option key={s.id} value={s.id}>
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
                key={c.id}
                type="button"
                onClick={() => setCategoryIds((prev) => toggleId(prev, c.id))}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  categoryIds.includes(c.id)
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
                key={t.id}
                type="button"
                onClick={() => setTagIds((prev) => toggleId(prev, t.id))}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tagIds.includes(t.id) ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"
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

      {currentId ? (
        <RevisionHistory
          documentId={currentId}
          documentType="post"
          refreshKey={lastSaved}
          onRestore={restoreRevision}
        />
      ) : null}
    </div>
  );
}
