"use client";

import { ApolloLink } from "@apollo/client/link";
import { SetContextLink } from "@apollo/client/link/context";
import { HttpLink } from "@apollo/client/link/http";
import {
  ApolloClient,
  ApolloNextAppProvider,
} from "@apollo/client-integration-nextjs";
import { getSession } from "next-auth/react";
import { makeApolloCache } from "@/lib/graphql/cache";
import { getGraphqlUri } from "@/lib/graphql/uri";

function makeClient() {
  const authLink = new SetContextLink(async (prev) => {
    const session = await getSession();
    const headers = { ...(prev.headers || {}) } as Record<string, string>;
    if (session?.accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return { headers };
  });

  const httpLink = new HttpLink({
    uri: getGraphqlUri("browser"),
    fetchOptions: { cache: "no-store" },
  });

  return new ApolloClient({
    cache: makeApolloCache(),
    link: ApolloLink.from([authLink, httpLink]),
  });
}

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
