import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apolloMutate } from "@/lib/apollo/rsc";
import { PUBLISH_DUE_CONTENT_MUTATION } from "@/graphql/operations/posts";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await apolloMutate<{
      blogPortalPublishDueContent: {
        publishedPosts: number;
        publishedPages: number;
      };
    }>({
      mutation: PUBLISH_DUE_CONTENT_MUTATION,
    });

    const publishedPosts = data.blogPortalPublishDueContent?.publishedPosts || 0;
    const publishedPages = data.blogPortalPublishDueContent?.publishedPages || 0;

    if (publishedPosts || publishedPages) {
      revalidatePath("/");
      revalidatePath("/blog");
    }

    return NextResponse.json({
      publishedPosts,
      publishedPages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "GraphQL publish failed";
    console.error("[graphql] PublishDue failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
