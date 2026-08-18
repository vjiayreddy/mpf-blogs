"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { ANALYTICS_SUMMARY_QUERY } from "@/graphql/operations/analytics";

type AnalyticsData = {
  blogPortalAnalyticsSummary: {
    totalViews: number;
    viewsByDay: Array<{ date: string; count: number }>;
    topPosts: Array<{ postId: string; title: string; slug: string; count: number }>;
  };
};

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useQuery<AnalyticsData>(ANALYTICS_SUMMARY_QUERY, {
    variables: { days },
  });
  const summary = data?.blogPortalAnalyticsSummary;
  const max = Math.max(...(summary?.viewsByDay.map((d) => d.count) || [0]), 1);

  if (loading && !summary) return <p className="text-sm text-stone-500">Loading analytics…</p>;
  if (error) return <p className="text-sm text-red-700">{error.message}</p>;
  if (!summary) return <p className="text-sm text-stone-500">No analytics yet.</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-stone-500">Page views over the last {days} days</p>
        </div>
        <div className="flex gap-2">
          {[7, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                days === d ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-800"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-sm text-stone-500">Total views</p>
        <p className="mt-1 text-3xl font-semibold">{summary.totalViews}</p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold">Views by day</h2>
        <div className="mt-4 flex h-40 items-end gap-1">
          {summary.viewsByDay.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-teal-800"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 0 }}
                title={`${d.date}: ${d.count}`}
              />
            </div>
          ))}
          {summary.viewsByDay.length === 0 ? (
            <p className="text-sm text-stone-500">No views yet.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold">Top posts</h2>
        <ul className="mt-4 space-y-2">
          {summary.topPosts.map((p) => (
            <li key={p.postId} className="flex justify-between text-sm">
              <span>
                {p.slug ? (
                  <Link href={`/blog/${p.slug}`} className="hover:underline">
                    {p.title}
                  </Link>
                ) : (
                  p.title
                )}
              </span>
              <span className="text-stone-500">{p.count}</span>
            </li>
          ))}
          {summary.topPosts.length === 0 ? (
            <li className="text-sm text-stone-500">No post views yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
