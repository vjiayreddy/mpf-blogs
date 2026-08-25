import { auth } from "@/lib/auth";
import { ApolloLink } from "@apollo/client/link";
import { SetContextLink } from "@apollo/client/link/context";
import { HttpLink } from "@apollo/client/link/http";
import {
  ApolloClient,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";
import { makeApolloCache } from "@/lib/graphql/cache";
import { getGraphqlUri } from "@/lib/graphql/uri";

type AuthContext = {
  headers?: Record<string, string>;
};

function makeHttpLink() {
  return new HttpLink({
    uri: getGraphqlUri("server"),
    fetchOptions: { cache: "no-store" },
  });
}

/** Session-authenticated client for admin RSC queries/mutations. Never falls back to env token. */
export const { getClient } = registerApolloClient(async () => {
  const authLink = new SetContextLink(async (prev) => {
    const previous = prev as AuthContext;
    const headers = { ...(previous.headers || {}) };

    if (headers.Authorization) {
      return { headers };
    }

    try {
      const session = await auth();
      if (session?.accessToken && !session.error) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
    } catch {
      // Corrupt session cookie — leave request unauthenticated.
    }

    return { headers };
  });

  return new ApolloClient({
    cache: makeApolloCache(),
    link: ApolloLink.from([authLink, makeHttpLink()]),
  });
});

/**
 * Public RSC client — never uses the user session JWT.
 * If GRAPHQL_ACCESS_TOKEN is set, uses it as a server-only service token
 * (needed when the API requires auth even for public reads).
 */
export const { getClient: getPublicClient } = registerApolloClient(async () => {
  const serviceToken = process.env.GRAPHQL_ACCESS_TOKEN;
  const authLink = new SetContextLink(async (prev) => {
    const previous = prev as AuthContext;
    const headers = { ...(previous.headers || {}) };
    if (!headers.Authorization && serviceToken) {
      headers.Authorization = `Bearer ${serviceToken}`;
    }
    return { headers };
  });

  return new ApolloClient({
    cache: makeApolloCache(),
    link: ApolloLink.from([authLink, makeHttpLink()]),
  });
});
