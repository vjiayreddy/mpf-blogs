import { auth } from "@/lib/auth";

/** Session lookup that never throws — bad/expired cookies are treated as logged out. */
export async function safeAuth() {
  try {
    return await auth();
  } catch (err) {
    console.warn("[auth] session read failed; treating as logged out:", err);
    return null;
  }
}
