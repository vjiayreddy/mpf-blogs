export const LIST_TAXONOMIES_QUERY = /* GraphQL */ `
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

export const CREATE_CATEGORY_MUTATION = /* GraphQL */ `
  mutation CreateCategory($name: String!, $slug: String, $description: String) {
    blogPortalCreateCategory(input: { name: $name, slug: $slug, description: $description }) {
      id
      name
      slug
      description
    }
  }
`;

export const UPDATE_CATEGORY_MUTATION = /* GraphQL */ `
  mutation UpdateCategory($id: ID!, $name: String, $description: String) {
    blogPortalUpdateCategory(id: $id, input: { name: $name, description: $description }) {
      id
      name
      slug
      description
    }
  }
`;

export const CREATE_TAG_MUTATION = /* GraphQL */ `
  mutation CreateTag($name: String!, $slug: String) {
    blogPortalCreateTag(input: { name: $name, slug: $slug }) {
      id
      name
      slug
    }
  }
`;

export const UPDATE_TAG_MUTATION = /* GraphQL */ `
  mutation UpdateTag($id: ID!, $name: String) {
    blogPortalUpdateTag(id: $id, input: { name: $name }) {
      id
      name
      slug
    }
  }
`;

export const CREATE_SERIES_MUTATION = /* GraphQL */ `
  mutation CreateSeries($name: String!, $slug: String, $description: String, $coverImage: String) {
    blogPortalCreateSeries(
      input: { name: $name, slug: $slug, description: $description, coverImage: $coverImage }
    ) {
      id
      name
      slug
      description
      coverImage
    }
  }
`;

export const UPDATE_SERIES_MUTATION = /* GraphQL */ `
  mutation UpdateSeries($id: ID!, $name: String, $description: String, $coverImage: String) {
    blogPortalUpdateSeries(
      id: $id
      input: { name: $name, description: $description, coverImage: $coverImage }
    ) {
      id
      name
      slug
      description
      coverImage
    }
  }
`;
