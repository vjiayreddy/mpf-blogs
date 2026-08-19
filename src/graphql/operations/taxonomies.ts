import { gql } from "@apollo/client";

export const LIST_TAXONOMIES_QUERY = gql`
  query ListTaxonomies {
    blogPortalCategories {
      id
      name
      slug
      description
    }
    blogPortalTags {
      id
      name
      slug
    }
    blogPortalSeriesList {
      id
      name
      slug
      description
      coverImage
    }
  }
`;

export const CREATE_CATEGORY_MUTATION = gql`
  mutation CreateCategory($input: BlogPortalTaxonomyInput!) {
    blogPortalCreateCategory(input: $input) {
      id
      name
      slug
      description
    }
  }
`;

export const UPDATE_CATEGORY_MUTATION = gql`
  mutation UpdateCategory($id: ID!, $input: BlogPortalTaxonomyUpdateInput!) {
    blogPortalUpdateCategory(id: $id, input: $input) {
      id
      name
      slug
      description
    }
  }
`;

export const CREATE_TAG_MUTATION = gql`
  mutation CreateTag($input: BlogPortalTaxonomyInput!) {
    blogPortalCreateTag(input: $input) {
      id
      name
      slug
    }
  }
`;

export const UPDATE_TAG_MUTATION = gql`
  mutation UpdateTag($id: ID!, $input: BlogPortalTaxonomyUpdateInput!) {
    blogPortalUpdateTag(id: $id, input: $input) {
      id
      name
      slug
    }
  }
`;

export const CREATE_SERIES_MUTATION = gql`
  mutation CreateSeries($input: BlogPortalTaxonomyInput!) {
    blogPortalCreateSeries(input: $input) {
      id
      name
      slug
      description
      coverImage
    }
  }
`;

export const UPDATE_SERIES_MUTATION = gql`
  mutation UpdateSeries($id: ID!, $input: BlogPortalTaxonomyUpdateInput!) {
    blogPortalUpdateSeries(id: $id, input: $input) {
      id
      name
      slug
      description
      coverImage
    }
  }
`;
