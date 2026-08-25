import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";
import { hasMinRole } from "@/lib/rbac";
import type { Role } from "@/lib/constants";

export async function requireMinRole(minRole: Role) {
  const session = await safeAuth();
  if (!session?.user || !session.accessToken || session.error) {
    redirect("/login");
  }
  if (!hasMinRole(session.user.role, minRole)) {
    redirect("/admin");
  }
  return session;
}
