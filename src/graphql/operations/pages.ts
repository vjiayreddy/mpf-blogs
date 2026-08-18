import { gql } from "@apollo/client";

const PAGE_FIELDS = `
  id
  title
  slug
  excerpt
  lexicalJSON
  html
  status
  coverImage
  scheduledAt
  publishedAt
  updatedAt
  createdAt
  seo {
    title
    description
    ogImage
  }
  author {
    id
    name
  }
`;

export const LIST_PAGES_QUERY = gql`
  query ListPages {
    blogPortalPages {
      ${PAGE_FIELDS}
    }
  }
`;

export const GET_PAGE_QUERY = gql`
  query GetPage($id: ID!) {
    blogPortalPage(id: $id) {
      ${PAGE_FIELDS}
    }
  }
`;

export const GET_PAGE_BY_SLUG_QUERY = gql`
  query GetPageBySlug($slug: String!) {
    blogPortalPageBySlug(slug: $slug) {
      ${PAGE_FIELDS}
    }
  }
`;

export const CREATE_PAGE_MUTATION = gql`
  mutation CreatePage($input: BlogPortalPageInput!) {
    blogPortalCreatePage(input: $input) {
      ${PAGE_FIELDS}
    }
  }
`;

export const UPDATE_PAGE_MUTATION = gql`
  mutation UpdatePage($id: ID!, $input: BlogPortalPageUpdateInput!, $createRevision: Boolean) {
    blogPortalUpdatePage(id: $id, input: $input, createRevision: $createRevision) {
      ${PAGE_FIELDS}
    }
  }
`;
