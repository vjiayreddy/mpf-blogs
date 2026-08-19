"use client";

import { useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { TRACK_PAGE_VIEW_MUTATION } from "@/graphql/operations/analytics";

export function TrackPageView({ path, postId }: { path: string; postId?: string }) {
  const [track] = useMutation(TRACK_PAGE_VIEW_MUTATION);

  useEffect(() => {
    void track({
      variables: {
        input: {
          path,
          postId: postId || null,
          referrer: document.referrer || "",
        },
      },
    });
  }, [path, postId, track]);

  return null;
}
