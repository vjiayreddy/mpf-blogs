import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import type { Role } from "@/lib/constants";
import { hasMinRole } from "@/lib/rbac";

export class ActionError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ActionError("Unauthorized", 401);
  }
  return session;
}

export async function getGraphqlAccessToken() {
  const session = await auth();
  return session?.accessToken || null;
}

export async function requireRole(minRole: Role) {
  const session = await requireSession();
  if (!hasMinRole(session.user.role, minRole)) {
    throw new ActionError("Forbidden", 403);
  }
  await connectDB();
  return session;
}

export function toJSON(doc: unknown) {
  return JSON.parse(JSON.stringify(doc));
}
