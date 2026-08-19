import slugifyLib from "slugify";

export function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true, trim: true });
}

export function siteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
