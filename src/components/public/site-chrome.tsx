import Link from "next/link";
import { safeAuth } from "@/lib/safe-auth";
import { fetchPublicSettings } from "@/lib/graphql/settings";

export async function PublicHeader() {
  const [settings, session] = await Promise.all([
    fetchPublicSettings(),
    safeAuth(),
  ]);

  return (
    <header className="border-b border-stone-200 bg-[#faf8f5]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="text-xl font-semibold tracking-tight text-stone-900">
          {settings.siteTitle}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-stone-700">
          <Link href="/blog" className="hover:text-stone-900">
            Blog
          </Link>
          <Link href="/search" className="hover:text-stone-900">
            Search
          </Link>
          <Link href="/about" className="hover:text-stone-900">
            About
          </Link>
          {session?.user ? (
            <Link
              href="/admin"
              className="rounded-full bg-stone-900 px-3 py-1.5 text-white hover:bg-stone-800"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-stone-900 px-3 py-1.5 text-white hover:bg-stone-800"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export async function PublicFooter() {
  const settings = await fetchPublicSettings();
  return (
    <footer className="mt-auto border-t border-stone-200 bg-[#faf8f5]">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {settings.siteTitle}
        </p>
        <div className="flex gap-4">
          <Link href="/rss.xml" className="hover:text-stone-800">
            RSS
          </Link>
          <Link href="/sitemap.xml" className="hover:text-stone-800">
            Sitemap
          </Link>
        </div>
      </div>
    </footer>
  );
}
