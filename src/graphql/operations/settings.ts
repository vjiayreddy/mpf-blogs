export const SETTINGS_QUERY = /* GraphQL */ `
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

export const UPDATE_SETTINGS_MUTATION = /* GraphQL */ `
  mutation UpdateSettings(
    $siteTitle: String
    $siteDescription: String
    $logo: String
    $twitter: String
    $github: String
    $linkedin: String
    $website: String
    $seoTitle: String
    $seoDescription: String
    $ogImage: String
  ) {
    blogPortalUpdateSettings(
      input: {
        siteTitle: $siteTitle
        siteDescription: $siteDescription
        logo: $logo
        socialLinks: {
          twitter: $twitter
          github: $github
          linkedin: $linkedin
          website: $website
        }
        defaultSeo: {
          title: $seoTitle
          description: $seoDescription
          ogImage: $ogImage
        }
      }
    ) {
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
