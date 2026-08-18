import { graphqlRequest } from "@/lib/graphql/client";
import { BLOG_PORTAL_ME_QUERY, LOGIN_QUERY } from "@/graphql/operations/auth";
import { ROLES, type Role } from "@/lib/constants";

const STAFF_ROLES: Role[] = ["OWNER", "ADMIN", "EDITOR", "AUTHOR"];

type LoginResponse = {
  login: {
    token: string;
    expires?: string | null;
    user?: {
      _id?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    } | null;
  } | null;
};

type MeResponse = {
  blogPortalMe: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    status?: string | null;
    bio?: string | null;
  } | null;
};

function isStaffRole(role: string): role is Role {
  return STAFF_ROLES.includes(role as Role) && ROLES.includes(role as Role);
}

export async function authenticateBlogPortal(email: string, password: string) {
  const loginData = await graphqlRequest<LoginResponse>({
    query: LOGIN_QUERY,
    variables: { source: email, password },
  });

  const accessToken = loginData.login?.token;
  if (!accessToken) return null;

  const meData = await graphqlRequest<MeResponse>({
    query: BLOG_PORTAL_ME_QUERY,
    accessToken,
  });

  const me = meData.blogPortalMe;
  if (!me?.id || me.status !== "active" || !isStaffRole(me.role)) {
    return null;
  }

  const name =
    me.name ||
    [loginData.login?.user?.firstName, loginData.login?.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    me.email ||
    email;

  return {
    id: me.id,
    name,
    email: me.email || email,
    role: me.role,
    accessToken,
  };
}
