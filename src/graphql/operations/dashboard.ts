import { gql } from "@apollo/client";

export const DASHBOARD_STATS_QUERY = gql`
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
