import { gql } from "@apollo/client";

export const ANALYTICS_SUMMARY_QUERY = gql`
  query AnalyticsSummary($days: Int) {
    blogPortalAnalyticsSummary(days: $days) {
      totalViews
      viewsByDay {
        date
        count
      }
      topPosts {
        postId
        title
        slug
        count
      }
    }
  }
`;

export const TRACK_PAGE_VIEW_MUTATION = gql`
  mutation TrackViews($input: BlogPortalTrackPageViewInput!) {
    blogPortalTrackPageView(input: $input) {
      ok
    }
  }
`;
