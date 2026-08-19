import { gql } from "@apollo/client";

export const SETTINGS_QUERY = gql`
  query GetSettings {
    blogPortalSettings {
      id
      siteTitle
      siteDescription
      logo
      socialLinks {
        twitter
        github
        linkedin
        website
      }
      defaultSeo {
        title
        description
        ogImage
      }
    }
  }
`;

export const UPDATE_SETTINGS_MUTATION = gql`
  mutation UpdateSettings($input: BlogPortalSettingsInput!) {
    blogPortalUpdateSettings(input: $input) {
      id
      siteTitle
      siteDescription
      logo
      socialLinks {
        twitter
        github
        linkedin
        website
      }
      defaultSeo {
        title
        description
        ogImage
      }
    }
  }
`;
