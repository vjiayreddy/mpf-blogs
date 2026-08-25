import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { requireMinRole } from "@/lib/admin-guard";

export default async function AnalyticsPage() {
  await requireMinRole("ADMIN");
  return <AnalyticsDashboard />;
}
