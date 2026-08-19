"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useQuery } from "@apollo/client/react";
import { DASHBOARD_STATS_QUERY } from "@/graphql/operations/dashboard";

type DashboardData = {
  blogPortalDashboardStats: {
    drafts: number;
    scheduled: number;
    published: number;
    recentDrafts: Array<{ id: string; title: string; slug: string; status: string }>;
    scheduledQueue: Array<{
      id: string;
      title: string;
      slug: string;
      scheduledAt?: string | null;
    }>;
  };
};

export function DashboardStats() {
  const { data, loading, error } = useQuery<DashboardData>(DASHBOARD_STATS_QUERY);

  if (loading) {
    return <p className="text-sm text-stone-500">Loading dashboard…</p>;
  }

  if (error || !data?.blogPortalDashboardStats) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
        {error?.message || "Failed to load dashboard"}
      </p>
    );
  }

  const stats = data.blogPortalDashboardStats;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Drafts", value: stats.drafts },
          { label: "Scheduled", value: stats.scheduled },
          { label: "Published", value: stats.published },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900">Recent drafts</h2>
          <ul className="mt-4 space-y-3">
            {stats.recentDrafts.map((post) => (
              <li key={post.id}>
                <Link href={`/admin/posts/${post.id}`} className="text-sm font-medium hover:underline">
                  {post.title}
                </Link>
                <p className="text-xs text-stone-500">{post.status}</p>
              </li>
            ))}
            {stats.recentDrafts.length === 0 ? (
              <li className="text-sm text-stone-500">No drafts yet.</li>
            ) : null}
          </ul>
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900">Scheduled queue</h2>
          <ul className="mt-4 space-y-3">
            {stats.scheduledQueue.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {post.title}
                </Link>
                <p className="text-xs text-stone-500">
                  {post.scheduledAt
                    ? format(new Date(post.scheduledAt), "MMM d, yyyy HH:mm")
                    : "No date"}
                </p>
              </li>
            ))}
            {stats.scheduledQueue.length === 0 ? (
              <li className="text-sm text-stone-500">Nothing scheduled.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </>
  );
}
