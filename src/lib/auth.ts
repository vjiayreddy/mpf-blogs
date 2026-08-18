import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validators";
import { authConfig } from "@/lib/auth.config";
import { authenticateBlogPortal } from "@/lib/graphql/login";
import { GraphqlError } from "@/lib/graphql/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const user = await authenticateBlogPortal(
            parsed.data.email.toLowerCase(),
            parsed.data.password
          );
          if (!user) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            accessToken: user.accessToken,
          };
        } catch (err) {
          if (err instanceof GraphqlError) {
            console.error("[auth] GraphQL login failed:", err.message);
            return null;
          }
          throw err;
        }
      },
    }),
  ],
});
