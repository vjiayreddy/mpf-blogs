import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

function LoginFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-5 animate-pulse" aria-hidden>
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-stone-200" />
        <div className="h-9 w-40 rounded bg-stone-200" />
        <div className="h-4 w-56 rounded bg-stone-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-12 rounded bg-stone-200" />
        <div className="h-12 w-full rounded-lg bg-stone-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-stone-200" />
        <div className="h-12 w-full rounded-lg bg-stone-100" />
      </div>
      <div className="h-12 w-full rounded-full bg-stone-200" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f3efe8] to-[#faf8f5]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-stone-900"
        >
          Blog Portal
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-teal-800 hover:underline"
        >
          ← Back to site
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md border border-stone-200 bg-white px-6 py-8 sm:px-8 sm:py-10">
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
