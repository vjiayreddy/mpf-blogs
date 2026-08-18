export class GraphqlError extends Error {
  constructor(
    message: string,
    public errors?: unknown
  ) {
    super(message);
    this.name = "GraphqlError";
  }
}

export function getGraphqlUrl() {
  const url = process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (!url) {
    throw new GraphqlError("GRAPHQL_URL is not configured");
  }
  return url;
}

export async function graphqlRequest<T>(opts: {
  query: string;
  variables?: Record<string, unknown>;
  accessToken?: string | null;
}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }

  const operation =
    opts.query.match(/(?:query|mutation)\s+([A-Za-z0-9_]+)/)?.[1] || "anonymous";
  const url = getGraphqlUrl();
  console.info(`[graphql] ${operation} ${opts.accessToken ? "(authed)" : "(public)"}`);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: opts.query,
      variables: opts.variables,
    }),
    cache: "no-store",
  });

  let json: { data?: T; errors?: Array<{ message: string }> };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new GraphqlError(`GraphQL request failed (${res.status})`);
  }

  if (json.errors?.length) {
    throw new GraphqlError(json.errors[0]?.message || "GraphQL request failed", json.errors);
  }

  if (!res.ok || json.data === undefined || json.data === null) {
    throw new GraphqlError(`GraphQL request failed (${res.status})`);
  }

  return json.data;
}
