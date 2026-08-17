export type GraphqlRuntime = "server" | "browser";

export function getGraphqlUri(runtime: GraphqlRuntime = "browser"): string {
  const uri =
    (runtime === "server" ? process.env.GRAPHQL_URL : undefined) ||
    process.env.NEXT_PUBLIC_GRAPHQL_URL;

  if (!uri) {
    throw new Error(
      "Missing GraphQL URL. Set NEXT_PUBLIC_GRAPHQL_URL (absolute), and optionally GRAPHQL_URL for the server.",
    );
  }

  if (!/^https?:\/\//.test(uri)) {
    throw new Error(
      `GraphQL URL must be absolute for SSR (got "${uri}"). Example: http://localhost:4000/graphql`,
    );
  }

  return uri;
}
