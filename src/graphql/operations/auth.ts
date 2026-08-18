export const LOGIN_QUERY = /* GraphQL */ `
  query Login($source: String!, $password: String!) {
    login(source: $source, password: $password) {
      token
      expires
      user {
        _id
        email
        firstName
        lastName
      }
    }
  }
`;

export const BLOG_PORTAL_ME_QUERY = /* GraphQL */ `
  query BlogPortalMe {
    blogPortalMe {
      id
      name
      email
      role
      status
      bio
    }
  }
`;
