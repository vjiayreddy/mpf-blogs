import { gql } from "@apollo/client";

export const LOGIN_QUERY = gql`
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

export const BLOG_PORTAL_ME_QUERY = gql`
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
