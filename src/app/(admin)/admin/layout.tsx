import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { safeAuth } from "@/lib/safe-auth";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();
  if (!session?.user || !session.accessToken || session.error) redirect("/login");

  return (
    <div className="flex min-h-screen bg-stone-100">
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role as Role,
        }}
      />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
