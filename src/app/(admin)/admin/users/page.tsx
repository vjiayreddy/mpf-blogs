import { UsersManager } from "@/components/admin/users-manager";
import { requireMinRole } from "@/lib/admin-guard";

export default async function UsersPage() {
  await requireMinRole("ADMIN");
  return <UsersManager />;
}
