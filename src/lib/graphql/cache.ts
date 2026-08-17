import { InMemoryCache } from "@apollo/client-integration-nextjs";

export function makeApolloCache() {
  return new InMemoryCache({
    typePolicies: {
      User: { keyFields: ["id"] },
      Post: { keyFields: ["id"] },
      Page: { keyFields: ["id"] },
      Category: { keyFields: ["id"] },
      Tag: { keyFields: ["id"] },
      Series: { keyFields: ["id"] },
      Media: { keyFields: ["id"] },
      Revision: { keyFields: ["id"] },
      Settings: { keyFields: ["id"] },
    },
  });
}
