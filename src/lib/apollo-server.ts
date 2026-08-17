import { cookies } from "next/headers";
import { HttpLink } from "@apollo/client/link/http";
import { ApolloClient, registerApolloClient } from "@apollo/client-integration-nextjs";
import { makeApolloCache } from "@/lib/graphql/cache";
import { getGraphqlUri } from "@/lib/graphql/uri";

export const { getClient, query, PreloadQuery } = registerApolloClient(
  async () => {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    return new ApolloClient({
      cache: makeApolloCache(),
      link: new HttpLink({
        uri: getGraphqlUri("server"),
        credentials: "include",
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        fetchOptions: { cache: "no-store" },
      }),
    });
  },
);
