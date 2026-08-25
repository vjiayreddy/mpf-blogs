"use client";

import { useState } from "react";
import { AI_LENGTHS, AI_TONES } from "@/lib/validators";

export type AiGeneratedPost = {
  title: string;
  excerpt: string;
  html: string;
  seo: { title: string; description: string };
};

type AiGeneratePanelProps = {
  hasExistingContent: () => boolean;
  onGenerated: (payload: AiGeneratedPost) => void;
};

export function AiGeneratePanel({ hasExistingContent, onGenerated }: AiGeneratePanelProps) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<(typeof AI_TONES)[number]>("professional");
  const [length, setLength] = useState<(typeof AI_LENGTHS)[number]>("medium");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!topic.trim()) {
      setError("Enter a topic or brief first.");
      return;
    }

    if (
      hasExistingContent() &&
      !window.confirm(
        "This will replace the current title, body, excerpt, and SEO fields. Continue?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          tone,
          length,
          keywords: keywords.trim() || undefined,
        }),
      });
      const data = (await res.json()) as AiGeneratedPost & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }
      onGenerated({
        title: data.title,
        excerpt: data.excerpt || "",
        html: data.html,
        seo: {
          title: data.seo?.title || data.title,
          description: data.seo?.description || data.excerpt || "",
        },
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-800"
      >
        <span>Generate with AI</span>
        <span className="text-stone-500">{open ? "Hide" : "Show"}</span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-stone-200 px-4 py-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Topic / brief</span>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="What should this post cover?"
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-stone-700">Tone</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as (typeof AI_TONES)[number])}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
              >
                {AI_TONES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-stone-700">Length</span>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as (typeof AI_LENGTHS)[number])}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
              >
                <option value="short">Short (~400 words)</option>
                <option value="medium">Medium (~800 words)</option>
                <option value="long">Long (~1500 words)</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">
              Keywords <span className="font-normal text-stone-500">(optional)</span>
            </span>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="comma-separated keywords"
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="button"
            disabled={loading}
            onClick={() => void generate()}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate draft"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
