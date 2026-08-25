export type StoredRevisionRestore = {
  title?: string | null;
  html?: string | null;
  lexicalJSON: string;
};

function storageKey(documentType: "post" | "page", documentId: string) {
  return `blog-portal-restore:${documentType}:${documentId}`;
}

export function storeRevisionRestore(
  documentType: "post" | "page",
  documentId: string,
  revision: StoredRevisionRestore
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(documentType, documentId), JSON.stringify(revision));
}

export function consumeRevisionRestore(
  documentType: "post" | "page",
  documentId: string
): StoredRevisionRestore | null {
  if (typeof window === "undefined") return null;
  const key = storageKey(documentType, documentId);
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key);
  try {
    return JSON.parse(raw) as StoredRevisionRestore;
  } catch {
    return null;
  }
}

export function applyRevisionRestore(
  revision: StoredRevisionRestore,
  setTitle: (title: string) => void,
  contentRef: { current: { lexicalJSON: string; html: string } },
  importKey: { current: number },
  setJsonToImport: (value: { json: string; key: number } | undefined) => void,
  setHtmlToImport: (value: { html: string; key: number } | undefined) => void
) {
  if (revision.title) setTitle(revision.title);
  contentRef.current = {
    lexicalJSON: revision.lexicalJSON || "",
    html: revision.html || "",
  };
  importKey.current += 1;
  if (revision.lexicalJSON) {
    setJsonToImport({ json: revision.lexicalJSON, key: importKey.current });
    setHtmlToImport(undefined);
  } else if (revision.html) {
    setHtmlToImport({ html: revision.html, key: importKey.current });
    setJsonToImport(undefined);
  }
}
