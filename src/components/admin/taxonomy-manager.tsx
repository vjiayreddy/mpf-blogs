"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { slugify } from "@/lib/utils";
import {
  CREATE_CATEGORY_MUTATION,
  CREATE_SERIES_MUTATION,
  CREATE_TAG_MUTATION,
  LIST_TAXONOMIES_QUERY,
  UPDATE_CATEGORY_MUTATION,
  UPDATE_SERIES_MUTATION,
  UPDATE_TAG_MUTATION,
} from "@/graphql/operations/taxonomies";

type Item = { id: string; name: string; slug: string; description?: string | null };

type TaxonomiesData = {
  blogPortalCategories: Item[];
  blogPortalTags: Item[];
  blogPortalSeriesList: Item[];
};

const KIND = {
  category: {
    title: "Categories",
    withDescription: true,
    listKey: "blogPortalCategories" as const,
    create: CREATE_CATEGORY_MUTATION,
    update: UPDATE_CATEGORY_MUTATION,
    resultCreate: "blogPortalCreateCategory",
    resultUpdate: "blogPortalUpdateCategory",
  },
  tag: {
    title: "Tags",
    withDescription: false,
    listKey: "blogPortalTags" as const,
    create: CREATE_TAG_MUTATION,
    update: UPDATE_TAG_MUTATION,
    resultCreate: "blogPortalCreateTag",
    resultUpdate: "blogPortalUpdateTag",
  },
  series: {
    title: "Series",
    withDescription: true,
    listKey: "blogPortalSeriesList" as const,
    create: CREATE_SERIES_MUTATION,
    update: UPDATE_SERIES_MUTATION,
    resultCreate: "blogPortalCreateSeries",
    resultUpdate: "blogPortalUpdateSeries",
  },
};

export function TaxonomyManager({ kind }: { kind: keyof typeof KIND }) {
  const config = KIND[kind];
  const { data, loading, error, refetch } = useQuery<TaxonomiesData>(LIST_TAXONOMIES_QUERY);
  const [createItem] = useMutation(config.create);
  const [updateItem] = useMutation(config.update);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  const items = data?.[config.listKey] || [];

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>;
  if (error) {
    return <p className="text-sm text-red-700">{error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">{config.title}</h1>
      <form
        className="flex flex-wrap gap-3 rounded-lg border border-stone-200 bg-white p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          try {
            await createItem({
              variables: {
                input: {
                  name,
                  slug: slugify(name),
                  description: config.withDescription ? description : undefined,
                },
              },
            });
            setName("");
            setDescription("");
            await refetch();
          } finally {
            setPending(false);
          }
        }}
      >
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        {config.withDescription ? (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="min-w-[220px] flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add
        </button>
      </form>
      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium text-stone-900">{item.name}</p>
              <p className="text-xs text-stone-500">/{item.slug}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-stone-600">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="text-sm text-stone-600 hover:underline"
              onClick={async () => {
                const next = window.prompt("Rename", item.name);
                if (!next) return;
                await updateItem({ variables: { id: item.id, input: { name: next } } });
                await refetch();
              }}
            >
              Rename
            </button>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="px-4 py-6 text-sm text-stone-500">Nothing here yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
