export const DASHBOARD_STATS_QUERY = /* GraphQL */ `
  query BlogPortalDashboardStats {
    blogPortalDashboardStats {
      drafts
      scheduled
      published
      recentDrafts {
        id
        title
        slug
        status
      }
      scheduledQueue {
        id
        title
        slug
        scheduledAt
      }
    }
  }
`;
