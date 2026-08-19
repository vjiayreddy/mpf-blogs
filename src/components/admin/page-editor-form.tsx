"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { LexicalEditor } from "@/components/editor/lexical-editor";
import { RevisionHistory, type RevisionRecord } from "@/components/admin/revision-history";
import {
  CREATE_PAGE_MUTATION,
  GET_PAGE_QUERY,
  UPDATE_PAGE_MUTATION,
} from "@/graphql/operations/pages";
import { toPageInput, type RawGraphqlPage } from "@/lib/graphql/pages-input";
import { slugify } from "@/lib/utils";
import type { ContentStatus } from "@/lib/constants";

type GetPageData = { blogPortalPage: RawGraphqlPage | null };
type CreatePageData = { blogPortalCreatePage: { id: string } };

export function PageEditorForm({
  mode,
  pageId,
}: {
  mode: "create" | "edit";
  pageId?: string;
}) {
  const { data, loading, error } = useQuery<GetPageData>(GET_PAGE_QUERY, {
    variables: { id: pageId },
    skip: !pageId,
  });

  if (mode === "edit" && loading) {
    return <p className="text-sm text-stone-500">Loading page…</p>;
  }
  if (mode === "edit" && (error || !data?.blogPortalPage)) {
    return <p className="text-sm text-red-700">{error?.message || "Page not found"}</p>;
  }

  return (
    <PageEditorFields
      key={pageId || "new"}
      mode={mode}
      pageId={pageId}
      initial={data?.blogPortalPage || undefined}
    />
  );
}

function PageEditorFields({
  mode,
  pageId,
  initial,
}: {
  mode: "create" | "edit";
  pageId?: string;
  initial?: RawGraphqlPage;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createPage] = useMutation<CreatePageData>(CREATE_PAGE_MUTATION);
  const [updatePage] = useMutation(UPDATE_PAGE_MUTATION);
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [status, setStatus] = useState<ContentStatus>(
    (initial?.status as ContentStatus) || "draft"
  );
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [jsonToImport, setJsonToImport] = useState<{ json: string; key: number } | undefined>();
  const [htmlToImport, setHtmlToImport] = useState<{ html: string; key: number } | undefined>();
  const contentRef = useRef({
    lexicalJSON: initial?.lexicalJSON || "",
    html: initial?.html || "",
  });
  const [currentId, setCurrentId] = useState(pageId);
  const importKey = useRef(0);

  const persist = useCallback(
    async (nextStatus?: ContentStatus) => {
      const input = toPageInput({
        title: title || "Untitled",
        slug: slug || slugify(title || "untitled"),
        excerpt,
        lexicalJSON: contentRef.current.lexicalJSON,
        html: contentRef.current.html,
        status: nextStatus || status,
        coverImage,
        seo: { title: title || undefined, description: excerpt || undefined },
      });
      try {
        if (mode === "create" && !currentId) {
          const result = await createPage({ variables: { input } });
          const createdId = result.data?.blogPortalCreatePage.id;
          if (!createdId) throw new Error("Create page failed");
          setCurrentId(createdId);
          router.replace(`/admin/pages/${createdId}`);
        } else if (currentId) {
          await updatePage({
            variables: {
              id: currentId,
              input,
              createRevision: true,
            },
          });
        }
        if (nextStatus) setStatus(nextStatus);
        setMessage("Saved");
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Save failed");
      }
    },
    [title, slug, excerpt, status, coverImage, mode, router, createPage, updatePage, currentId]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      if (!title && !contentRef.current.lexicalJSON) return;
      startTransition(() => void persist());
    }, 10000);
    return () => clearInterval(timer);
  }, [persist, title]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{mode === "create" ? "New page" : "Edit page"}</h1>
          <p className="text-sm text-stone-500">{message || "Autosave every 10s"}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => persist("draft"))}
            className="rounded-full bg-stone-200 px-4 py-2 text-sm font-medium"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => persist("published"))}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Publish
          </button>
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Page title"
        className="w-full border-0 border-b border-stone-200 bg-transparent pb-3 text-3xl font-semibold outline-none"
      />
      <LexicalEditor
        initialJSON={initial?.lexicalJSON || undefined}
        htmlToImport={htmlToImport}
        jsonToImport={jsonToImport}
        onChange={(payload) => {
          contentRef.current = payload;
        }}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Cover image URL</span>
          <input
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm lg:col-span-2">
          <span className="mb-1 block font-medium">Excerpt</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
      </div>

      {currentId ? (
        <RevisionHistory
          documentId={currentId}
          documentType="page"
          refreshKey={lastSaved}
          onRestore={restoreRevision}
        />
      ) : null}
    </div>
  );
}
