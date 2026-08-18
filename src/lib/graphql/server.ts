import { graphqlRequest } from "@/lib/graphql/client";
import { ActionError, getGraphqlAccessToken } from "@/lib/session";

export async function graphqlAuthed<T>(opts: {
  query: string;
  variables?: Record<string, unknown>;
}) {
  const accessToken = await getGraphqlAccessToken();
  if (!accessToken) {
    throw new ActionError("Unauthorized", 401);
  }
  return graphqlRequest<T>({ ...opts, accessToken });
}
