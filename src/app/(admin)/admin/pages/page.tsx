import { PagesManager } from "@/components/admin/pages-manager";
import { requireMinRole } from "@/lib/admin-guard";

export default async function AdminPagesPage() {
  await requireMinRole("EDITOR");
  return <PagesManager />;
}
