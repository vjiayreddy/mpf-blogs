import { getClient, getPublicClient } from "@/lib/apollo-server";
import type { DocumentNode } from "graphql";

export type GraphqlAuthMode = "session" | "public" | "cron";

async function resolveClient(mode: GraphqlAuthMode) {
  if (mode === "public") return getPublicClient();
  return getClient();
}

function authContext(mode: GraphqlAuthMode = "session") {
  if (mode === "cron") {
    const token = process.env.GRAPHQL_ACCESS_TOKEN;
    if (!token) {
      throw new Error("GRAPHQL_ACCESS_TOKEN is not set (required for scheduled publish)");
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  return {};
}

export async function apolloQuery<T>(opts: {
  query: DocumentNode;
  variables?: Record<string, unknown>;
  context?: Record<string, unknown>;
  auth?: GraphqlAuthMode;
}): Promise<T> {
  const mode = opts.auth || "session";
  const client = await resolveClient(mode);
  const result = await client.query({
    query: opts.query,
    variables: opts.variables,
    context: { ...authContext(mode), ...opts.context },
    fetchPolicy: "no-cache",
  });
  if (result.error) throw result.error;
  return result.data as T;
}

export async function apolloMutate<T>(opts: {
  mutation: DocumentNode;
  variables?: Record<string, unknown>;
  context?: Record<string, unknown>;
  auth?: GraphqlAuthMode;
}): Promise<T> {
  const mode = opts.auth || "session";
  const client = await resolveClient(mode);
  const result = await client.mutate({
    mutation: opts.mutation,
    variables: opts.variables,
    context: { ...authContext(mode), ...opts.context },
  });
  if (result.error) throw result.error;
  return result.data as T;
}
