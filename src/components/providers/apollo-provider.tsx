"use client";

import { HttpLink } from "@apollo/client/link/http";
import {
  ApolloClient,
  ApolloNextAppProvider,
} from "@apollo/client-integration-nextjs";
import { makeApolloCache } from "@/lib/graphql/cache";
import { getGraphqlUri } from "@/lib/graphql/uri";

function makeClient() {
  return new ApolloClient({
    cache: makeApolloCache(),
    link: new HttpLink({
      uri: getGraphqlUri("browser"),
      credentials: "include",
      fetchOptions: { cache: "no-store" },
    }),
  });
}

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
