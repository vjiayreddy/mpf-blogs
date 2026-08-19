import { gql } from "@apollo/client";

const POST_FIELDS = `
  id
  title
  slug
  excerpt
  lexicalJSON
  html
  plaintext
  status
  featured
  coverImage
  scheduledAt
  publishedAt
  readingTime
  seriesOrder
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
    email
  }
  editor {
    id
    name
  }
  categories {
    id
    name
    slug
  }
  tags {
    id
    name
    slug
  }
  series {
    id
    name
    slug
  }
`;

export const LIST_POSTS_QUERY = gql`
  query ListPosts($filter: BlogPortalPostFilterInput) {
    blogPortalPosts(filter: $filter) {
      ${POST_FIELDS}
    }
  }
`;

export const GET_POST_QUERY = gql`
  query GetPost($id: ID!) {
    blogPortalPost(id: $id) {
      ${POST_FIELDS}
    }
  }
`;

export const GET_POST_BY_SLUG_QUERY = gql`
  query GetPostBySlug($slug: String!) {
    blogPortalPostBySlug(slug: $slug) {
      ${POST_FIELDS}
    }
  }
`;

export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: BlogPortalPostInput!) {
    blogPortalCreatePost(input: $input) {
      ${POST_FIELDS}
    }
  }
`;

export const UPDATE_POST_MUTATION = gql`
  mutation UpdatePost($id: ID!, $input: BlogPortalPostUpdateInput!, $createRevision: Boolean) {
    blogPortalUpdatePost(id: $id, input: $input, createRevision: $createRevision) {
      ${POST_FIELDS}
    }
  }
`;

export const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    blogPortalDeletePost(id: $id) {
      ok
    }
  }
`;

export const GENERATE_POST_DRAFT_MUTATION = gql`
  mutation GenerateDraft($input: BlogPortalAiGeneratePostInput!) {
    blogPortalGeneratePostDraft(input: $input) {
      title
      excerpt
      html
      seo {
        title
        description
        ogImage
      }
    }
  }
`;

export const PUBLISH_DUE_CONTENT_MUTATION = gql`
  mutation PublishDue {
    blogPortalPublishDueContent {
      publishedPosts
      publishedPages
    }
  }
`;
