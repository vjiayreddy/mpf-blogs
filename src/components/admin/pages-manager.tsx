"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useQuery } from "@apollo/client/react";
import { LIST_PAGES_QUERY } from "@/graphql/operations/pages";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt?: string | null;
};

type ListPagesData = {
  blogPortalPages: PageRow[];
};

export function PagesManager() {
  const { data, loading, error } = useQuery<ListPagesData>(LIST_PAGES_QUERY);
  const pages = data?.blogPortalPages || [];

  if (loading) return <p className="text-sm text-stone-500">Loading pages…</p>;
  if (error) return <p className="text-sm text-red-700">{error.message}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pages</h1>
        <Link
          href="/admin/pages/new"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          New page
        </Link>
      </div>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {pages.map((page) => (
          <li key={page.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <Link href={`/admin/pages/${page.id}`} className="font-medium hover:underline">
                {page.title}
              </Link>
              <p className="text-xs text-stone-500">
                /{page.slug} · {page.status}
                {page.updatedAt ? ` · ${format(new Date(page.updatedAt), "MMM d, yyyy")}` : ""}
              </p>
            </div>
          </li>
        ))}
        {pages.length === 0 ? (
          <li className="px-4 py-8 text-sm text-stone-500">No pages yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
