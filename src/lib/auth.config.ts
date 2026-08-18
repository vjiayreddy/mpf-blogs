import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/constants";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
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
      return session;
    },
  },
} satisfies NextAuthConfig;
