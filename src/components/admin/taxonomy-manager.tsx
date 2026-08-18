"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Item = { _id: string; name: string; slug: string; description?: string };

export function TaxonomyManager({
  title,
  items,
  onCreate,
  onUpdate,
  onDelete,
  withDescription,
}: {
  title: string;
  items: Item[];
  onCreate: (input: { name: string; description?: string }) => Promise<unknown>;
  onUpdate: (id: string, input: { name: string; description?: string }) => Promise<unknown>;
  onDelete?: (id: string) => Promise<unknown>;
  withDescription?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
      <form
        className="flex flex-wrap gap-3 rounded-lg border border-stone-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await onCreate({ name, description: withDescription ? description : undefined });
            setName("");
            setDescription("");
            router.refresh();
          });
        }}
      >
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        {withDescription ? (
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
          <li key={item._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium text-stone-900">{item.name}</p>
              <p className="text-xs text-stone-500">/{item.slug}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-stone-600">{item.description}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-stone-600 hover:underline"
                onClick={() => {
                  const next = window.prompt("Rename", item.name);
                  if (!next) return;
                  startTransition(async () => {
                    await onUpdate(item._id, { name: next });
                    router.refresh();
                  });
                }}
              >
                Rename
              </button>
              {onDelete ? (
                <button
                  type="button"
                  className="text-sm text-red-700 hover:underline"
                  onClick={() =>
                    startTransition(async () => {
                      await onDelete(item._id);
                      router.refresh();
                    })
                  }
                >
                  Delete
                </button>
              ) : null}
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="px-4 py-6 text-sm text-stone-500">Nothing here yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
