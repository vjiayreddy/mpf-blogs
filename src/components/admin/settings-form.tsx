"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { SETTINGS_QUERY, UPDATE_SETTINGS_MUTATION } from "@/graphql/operations/settings";

type Settings = {
  siteTitle: string;
  siteDescription?: string;
  logo?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  defaultSeo?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
};

type SettingsData = { blogPortalSettings: Settings | null };

export function SettingsForm() {
  const { data, loading, error } = useQuery<SettingsData>(SETTINGS_QUERY);
  const [updateSettings, { loading: saving }] = useMutation(UPDATE_SETTINGS_MUTATION, {
    refetchQueries: [{ query: SETTINGS_QUERY }],
  });
  const [form, setForm] = useState<Settings>({
    siteTitle: "",
    siteDescription: "",
    logo: "",
    socialLinks: {},
    defaultSeo: {},
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (data?.blogPortalSettings) {
      setForm(data.blogPortalSettings);
    }
  }, [data]);

  if (loading) return <p className="text-sm text-stone-500">Loading settings…</p>;
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
        {error.message}
      </p>
    );
  }

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setMessage("");
        try {
          await updateSettings({
            variables: {
              input: {
                siteTitle: form.siteTitle,
                siteDescription: form.siteDescription || "",
                logo: form.logo || "",
                socialLinks: {
                  twitter: form.socialLinks?.twitter || "",
                  github: form.socialLinks?.github || "",
                  linkedin: form.socialLinks?.linkedin || "",
                  website: form.socialLinks?.website || "",
                },
                defaultSeo: {
                  title: form.defaultSeo?.title || "",
                  description: form.defaultSeo?.description || "",
                  ogImage: form.defaultSeo?.ogImage || "",
                },
              },
            },
          });
          setMessage("Settings saved");
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Failed");
        }
      }}
    >
      <h1 className="text-2xl font-semibold">Site settings</h1>
      {(
        [
          ["siteTitle", "Site title"],
          ["siteDescription", "Site description"],
          ["logo", "Logo URL"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block text-sm">
          <span className="mb-1 block font-medium">{label}</span>
          <input
            value={(form[key] as string) || ""}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        {(["twitter", "github", "linkedin", "website"] as const).map((key) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block font-medium capitalize">{key}</span>
            <input
              value={form.socialLinks?.[key] || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  socialLinks: { ...f.socialLinks, [key]: e.target.value },
                }))
              }
              className="w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </label>
        ))}
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Default SEO title</span>
        <input
          value={form.defaultSeo?.title || ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              defaultSeo: { ...f.defaultSeo, title: e.target.value },
            }))
          }
          className="w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Default SEO description</span>
        <textarea
          value={form.defaultSeo?.description || ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              defaultSeo: { ...f.defaultSeo, description: e.target.value },
            }))
          }
          rows={3}
          className="w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
      >
        Save settings
      </button>
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </form>
  );
}
