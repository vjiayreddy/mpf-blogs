import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/constants";

const SKEW_MS = 60_000;

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const hasValidToken = Boolean(auth?.accessToken) && !auth?.error;
      const isLoggedIn = Boolean(auth?.user) && hasValidToken;
      const role = auth?.user?.role as Role | undefined;

      if (pathname.startsWith("/admin") && !isLoggedIn) {
        return false;
      }

      if (pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/admin", request.nextUrl));
      }

      if (pathname.startsWith("/admin") && isLoggedIn) {
        if (!role || !["OWNER", "ADMIN", "EDITOR", "AUTHOR"].includes(role)) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.accessTokenExpires = user.accessTokenExpires;
        delete token.error;
      }

      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() >= token.accessTokenExpires - SKEW_MS
      ) {
        token.accessToken = undefined;
        token.error = "AccessTokenExpired";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = (token.role as Role) || "READER";
      }
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.error = typeof token.error === "string" ? token.error : undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
