"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  type EditorState,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor as LexicalEditorType,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { CodeNode, $createCodeNode } from "@lexical/code";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $setBlocksType } from "@lexical/selection";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

const theme = {
  paragraph: "mb-3 leading-7 text-[15px] text-stone-800",
  quote: "border-l-4 border-stone-300 pl-4 italic text-stone-600 my-4",
  heading: {
    h1: "text-3xl font-semibold tracking-tight mt-6 mb-3 text-stone-900",
    h2: "text-2xl font-semibold tracking-tight mt-5 mb-2 text-stone-900",
    h3: "text-xl font-semibold mt-4 mb-2 text-stone-900",
  },
  list: {
    ul: "list-disc ml-6 mb-3 space-y-1",
    ol: "list-decimal ml-6 mb-3 space-y-1",
    listitem: "leading-7",
  },
  link: "text-teal-800 underline underline-offset-2",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    code: "rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]",
  },
  code: "block rounded-lg bg-stone-900 text-stone-100 p-4 my-4 overflow-x-auto font-mono text-sm",
};

function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const format = (type: "bold" | "italic" | "underline" | "code") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  const setHeading = (tag: "h1" | "h2" | "h3" | "paragraph" | "quote" | "code") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (tag === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
      } else if (tag === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
      } else if (tag === "code") {
        $setBlocksType(selection, () => $createCodeNode());
      } else {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1 border-b border-stone-200 bg-stone-50 px-2 py-2">
      {[
        { label: "Bold", onClick: () => format("bold") },
        { label: "Italic", onClick: () => format("italic") },
        { label: "Underline", onClick: () => format("underline") },
        { label: "Code", onClick: () => format("code") },
        { label: "H1", onClick: () => setHeading("h1") },
        { label: "H2", onClick: () => setHeading("h2") },
        { label: "H3", onClick: () => setHeading("h3") },
        { label: "Quote", onClick: () => setHeading("quote") },
        {
          label: "Bullet",
          onClick: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
        },
        {
          label: "Numbered",
          onClick: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
        },
        {
          label: "Link",
          onClick: () => {
            const url = window.prompt("URL");
            if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
          },
        },
        {
          label: "Undo",
          onClick: () => editor.dispatchCommand(UNDO_COMMAND, undefined),
        },
        {
          label: "Redo",
          onClick: () => editor.dispatchCommand(REDO_COMMAND, undefined),
        },
      ].map((btn) => (
        <button
          key={btn.label}
          type="button"
          onClick={btn.onClick}
          className="rounded px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

function InitialContentPlugin({ initialJSON }: { initialJSON?: string }) {
  const [editor] = useLexicalComposerContext();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !initialJSON) return;
    loaded.current = true;
    try {
      const state = editor.parseEditorState(initialJSON);
      editor.setEditorState(state);
    } catch {
      // ignore invalid initial state
    }
  }, [editor, initialJSON]);

  return null;
}

function HtmlImportPlugin({
  htmlToImport,
}: {
  htmlToImport?: { html: string; key: number };
}) {
  const [editor] = useLexicalComposerContext();
  const lastKey = useRef<number | null>(null);

  useEffect(() => {
    if (!htmlToImport?.html || htmlToImport.key === lastKey.current) return;
    lastKey.current = htmlToImport.key;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(htmlToImport.html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
      root.selectEnd();
    });
  }, [editor, htmlToImport]);

  return null;
}

type EditorProps = {
  initialJSON?: string;
  htmlToImport?: { html: string; key: number };
  onChange: (payload: { lexicalJSON: string; html: string }) => void;
  className?: string;
};

export function LexicalEditor({
  initialJSON,
  htmlToImport,
  onChange,
  className,
}: EditorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initialConfig = useMemo(
    () => ({
      namespace: "BlogEditor",
      theme,
      onError(error: Error) {
        console.error(error);
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    }),
    []
  );

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditorType) => {
      editorState.read(() => {
        const lexicalJSON = JSON.stringify(editorState.toJSON());
        const html = $generateHtmlFromNodes(editor);
        onChange({ lexicalJSON, html });
      });
    },
    [onChange]
  );

  if (!mounted) {
    return (
      <div className="min-h-[320px] rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-400">
        Loading editor…
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-stone-200 bg-white ${className || ""}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[320px] px-4 py-3 outline-none" />
            }
            placeholder={
              <div className="pointer-events-none absolute left-4 top-3 text-stone-400">
                Start writing…
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <InitialContentPlugin initialJSON={initialJSON} />
        <HtmlImportPlugin htmlToImport={htmlToImport} />
      </LexicalComposer>
    </div>
  );
}
