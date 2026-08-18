import { gql } from "@apollo/client";

export const LIST_USERS_QUERY = gql`
  query ListUsers {
    blogPortalUsers {
      id
      name
      email
      role
      status
      bio
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateBlogUser($input: BlogPortalUserCreateInput!) {
    blogPortalCreateUser(input: $input) {
      id
      name
      email
      role
      status
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateBlogUser($id: ID!, $input: BlogPortalUserUpdateInput!) {
    blogPortalUpdateUser(id: $id, input: $input) {
      id
      name
      email
      role
      status
      bio
    }
  }
`;
