import { apolloQuery } from "@/lib/apollo/rsc";
import { SETTINGS_QUERY } from "@/graphql/operations/settings";

export type BlogPortalSettings = {
  id: string;
  siteTitle: string;
  siteDescription: string;
  logo: string;
  socialLinks: {
    twitter: string;
    github: string;
    linkedin: string;
    website: string;
  };
  defaultSeo: {
    title: string;
    description: string;
    ogImage: string;
  };
};

const FALLBACK_SETTINGS: BlogPortalSettings = {
  id: "",
  siteTitle: "Blog Portal",
  siteDescription: "",
  logo: "",
  socialLinks: { twitter: "", github: "", linkedin: "", website: "" },
  defaultSeo: { title: "", description: "", ogImage: "" },
};

type SettingsQueryData = {
  blogPortalSettings: {
    id?: string | null;
    siteTitle?: string | null;
    siteDescription?: string | null;
    logo?: string | null;
    socialLinks?: {
      twitter?: string | null;
      github?: string | null;
      linkedin?: string | null;
      website?: string | null;
    } | null;
    defaultSeo?: {
      title?: string | null;
      description?: string | null;
      ogImage?: string | null;
    } | null;
  } | null;
};

export function normalizeSettings(
  raw: SettingsQueryData["blogPortalSettings"]
): BlogPortalSettings {
  return {
    id: raw?.id || "",
    siteTitle: raw?.siteTitle || FALLBACK_SETTINGS.siteTitle,
    siteDescription: raw?.siteDescription || "",
    logo: raw?.logo || "",
    socialLinks: {
      twitter: raw?.socialLinks?.twitter || "",
      github: raw?.socialLinks?.github || "",
      linkedin: raw?.socialLinks?.linkedin || "",
      website: raw?.socialLinks?.website || "",
    },
    defaultSeo: {
      title: raw?.defaultSeo?.title || "",
      description: raw?.defaultSeo?.description || "",
      ogImage: raw?.defaultSeo?.ogImage || "",
    },
  };
}

export async function fetchPublicSettings() {
  try {
    const data = await apolloQuery<SettingsQueryData>({
      query: SETTINGS_QUERY,
      auth: "public",
    });
    return normalizeSettings(data.blogPortalSettings);
  } catch (err) {
    console.error("[graphql] GetSettings failed, using fallback:", err);
    return FALLBACK_SETTINGS;
  }
}
