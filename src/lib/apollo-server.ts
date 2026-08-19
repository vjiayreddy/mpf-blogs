import { auth } from "@/lib/auth";
import { ApolloLink } from "@apollo/client/link";
import { SetContextLink } from "@apollo/client/link/context";
import { HttpLink } from "@apollo/client/link/http";
import { ApolloClient, registerApolloClient } from "@apollo/client-integration-nextjs";
import { makeApolloCache } from "@/lib/graphql/cache";
import { getGraphqlUri } from "@/lib/graphql/uri";

export const { getClient, query, PreloadQuery } = registerApolloClient(async () => {
  const authLink = new SetContextLink(async (prev) => {
    const session = await auth();
    const token = session?.accessToken || process.env.GRAPHQL_ACCESS_TOKEN;
    const headers = { ...(prev.headers || {}) } as Record<string, string>;
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }
    return { headers };
  });

  const httpLink = new HttpLink({
    uri: getGraphqlUri("server"),
    fetchOptions: { cache: "no-store" },
  });

  return new ApolloClient({
    cache: makeApolloCache(),
    link: ApolloLink.from([authLink, httpLink]),
  });
});
