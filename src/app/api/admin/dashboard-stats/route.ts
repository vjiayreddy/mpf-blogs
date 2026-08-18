import { NextResponse } from "next/server";
import { getDashboardStats } from "@/app/actions/content";
import { ActionError } from "@/lib/session";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[dashboard-stats]", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 502 });
  }
}
