import { getClient } from "@/lib/apollo-server";
import type { DocumentNode } from "graphql";

export async function apolloQuery<T>(opts: {
  query: DocumentNode;
  variables?: Record<string, unknown>;
  context?: Record<string, unknown>;
}): Promise<T> {
  const client = await getClient();
  const result = await client.query({
    query: opts.query,
    variables: opts.variables,
    context: opts.context,
    fetchPolicy: "no-cache",
  });
  if (result.error) throw result.error;
  return result.data as T;
}

export async function apolloMutate<T>(opts: {
  mutation: DocumentNode;
  variables?: Record<string, unknown>;
  context?: Record<string, unknown>;
}): Promise<T> {
  const client = await getClient();
  const result = await client.mutate({
    mutation: opts.mutation,
    variables: opts.variables,
    context: opts.context,
  });
  if (result.error) throw result.error;
  return result.data as T;
}
