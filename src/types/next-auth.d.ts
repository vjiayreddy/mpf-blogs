import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role: Role;
    accessToken: string;
  }
  interface Session {
    accessToken?: string;
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
  }
}

export {};
