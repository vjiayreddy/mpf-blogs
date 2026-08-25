import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role: Role;
    accessToken: string;
    accessTokenExpires?: number;
  }
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    accessToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}

export {};
