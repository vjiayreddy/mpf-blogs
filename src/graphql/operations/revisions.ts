import { gql } from "@apollo/client";

export const LIST_REVISIONS_QUERY = gql`
  query ListRevisions($documentId: ID!, $documentType: BlogPortalRevisionDocumentType!) {
    blogPortalRevisions(documentId: $documentId, documentType: $documentType) {
      id
      title
      html
      lexicalJSON
      createdAt
      author {
        id
        name
      }
    }
  }
`;
