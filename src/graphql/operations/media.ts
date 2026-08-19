import { gql } from "@apollo/client";

export const LIST_MEDIA_QUERY = gql`
  query ListMedia($limit: Int) {
    blogPortalMedia(limit: $limit) {
      id
      url
      alt
      width
      height
      format
      uploadedBy {
        id
        name
      }
    }
  }
`;

export const UPDATE_MEDIA_ALT_MUTATION = gql`
  mutation UpdateMediaAlt($id: ID!, $alt: String!) {
    blogPortalUpdateMediaAlt(id: $id, alt: $alt) {
      id
      alt
    }
  }
`;

export const DELETE_MEDIA_MUTATION = gql`
  mutation DeleteMedia($id: ID!) {
    blogPortalDeleteMedia(id: $id) {
      ok
    }
  }
`;
