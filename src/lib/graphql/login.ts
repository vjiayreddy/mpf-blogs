import { apolloQuery } from "@/lib/apollo/rsc";
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

function parseAccessTokenExpires(expires?: string | null): number | undefined {
  if (!expires) return undefined;
  const numeric = Number(expires);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 1e12 ? Date.now() + numeric * 1000 : numeric;
  }
  const parsed = Date.parse(expires);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function authenticateBlogPortal(email: string, password: string) {
  const loginData = await apolloQuery<LoginResponse>({
    query: LOGIN_QUERY,
    variables: { source: email, password },
    auth: "public",
  });

  const accessToken = loginData.login?.token;
  if (!accessToken) return null;

  const meData = await apolloQuery<MeResponse>({
    query: BLOG_PORTAL_ME_QUERY,
    context: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: "public",
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
    accessTokenExpires: parseAccessTokenExpires(loginData.login?.expires),
  };
}
