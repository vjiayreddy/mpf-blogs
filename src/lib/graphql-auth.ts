import { CombinedGraphQLErrors } from "@apollo/client/errors";

export function isUnauthenticatedError(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some((graphQLError) => {
      const code = graphQLError.extensions?.code;
      if (code === "UNAUTHENTICATED") return true;
      return /jwt expired|unauthenticated|unauthorized|not authenticated/i.test(
        graphQLError.message
      );
    });
  }
  if (error instanceof Error) {
    return /UNAUTHENTICATED|jwt expired|unauthorized/i.test(error.message);
  }
  return false;
}
