import Link from "next/link";
import { DashboardStats } from "@/components/admin/dashboard-stats";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
          <p className="text-sm text-stone-500">Overview of your publishing pipeline</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          New post
        </Link>
      </div>

      <DashboardStats />
    </div>
  );
}
