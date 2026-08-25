import { SettingsForm } from "@/components/admin/settings-form";
import { requireMinRole } from "@/lib/admin-guard";

export default async function SettingsPage() {
  await requireMinRole("ADMIN");
  return <SettingsForm />;
}
