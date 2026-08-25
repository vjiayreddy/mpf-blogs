"use client";

import { ApolloLink } from "@apollo/client/link";
import { SetContextLink } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { HttpLink } from "@apollo/client/link/http";
import {
  ApolloClient,
  ApolloNextAppProvider,
} from "@apollo/client-integration-nextjs";
import { getSession, signOut } from "next-auth/react";
import { makeApolloCache } from "@/lib/graphql/cache";
import { getGraphqlUri } from "@/lib/graphql/uri";
import { isUnauthenticatedError } from "@/lib/graphql-auth";

let signingOut = false;

function makeClient() {
  const errorLink = new ErrorLink(({ error }) => {
    if (!isUnauthenticatedError(error) || signingOut) return;
    if (typeof window !== "undefined" && window.location.pathname === "/login") return;
    signingOut = true;
    void signOut({ callbackUrl: "/login" });
  });

  const authLink = new SetContextLink(async (prev) => {
    const session = await getSession();
    const headers = { ...(prev.headers || {}) } as Record<string, string>;
    if (session?.accessToken && !session.error && !headers.Authorization) {
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
    link: ApolloLink.from([errorLink, authLink, httpLink]),
  });
}

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
