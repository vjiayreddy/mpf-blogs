"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { ActionError, requireGraphqlRole, requireRole, toJSON } from "@/lib/session";
import { canManageSettings, canUploadMedia, canViewAnalytics } from "@/lib/rbac";
import { mediaUpdateSchema, settingsSchema } from "@/lib/validators";
import { Media } from "@/models/Media";
import { configureCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Post } from "@/models/Post";
import mongoose from "mongoose";
import { graphqlAuthed } from "@/lib/graphql/server";
import { GraphqlError } from "@/lib/graphql/client";
import { UPDATE_SETTINGS_MUTATION } from "@/graphql/operations/settings";
import {
  fetchBlogPortalSettings,
  normalizeSettings,
  type BlogPortalSettings,
} from "@/lib/graphql/settings";

export async function listMedia(limit = 48) {
  await requireRole("AUTHOR");
  await connectDB();
  const items = await Media.find().sort({ createdAt: -1 }).limit(limit).lean();
  return toJSON(items);
}

export async function updateMediaAlt(id: string, alt: string) {
  const session = await requireRole("AUTHOR");
  if (!canUploadMedia(session.user.role)) throw new ActionError("Forbidden", 403);
  const parsed = mediaUpdateSchema.parse({ alt });
  await connectDB();
  const media = await Media.findByIdAndUpdate(id, { alt: parsed.alt || "" }, { new: true });
  if (!media) throw new ActionError("Not found", 404);
  revalidatePath("/admin/media");
  return toJSON(media);
}

export async function deleteMedia(id: string) {
  await requireRole("ADMIN");
  await connectDB();
  const media = await Media.findById(id);
  if (!media) throw new ActionError("Not found", 404);

  if (isCloudinaryConfigured()) {
    const cloudinary = configureCloudinary();
    try {
      await cloudinary.uploader.destroy(media.cloudinaryPublicId);
    } catch {
      // continue deleting DB record
    }
  }

  await Media.findByIdAndDelete(id);
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function getAdminSettings() {
  const session = await requireGraphqlRole("ADMIN");
  try {
    return await fetchBlogPortalSettings(session.accessToken);
  } catch (err) {
    if (err instanceof GraphqlError) {
      throw new ActionError(err.message, 502);
    }
    throw err;
  }
}

export async function updateSettings(input: unknown) {
  const session = await requireGraphqlRole("ADMIN");
  if (!canManageSettings(session.user.role)) throw new ActionError("Forbidden", 403);
  const data = settingsSchema.parse(input);

  try {
    const result = await graphqlAuthed<{
      blogPortalUpdateSettings: BlogPortalSettings | null;
    }>({
      query: UPDATE_SETTINGS_MUTATION,
      variables: {
        siteTitle: data.siteTitle,
        siteDescription: data.siteDescription || "",
        logo: data.logo || "",
        twitter: data.socialLinks?.twitter || "",
        github: data.socialLinks?.github || "",
        linkedin: data.socialLinks?.linkedin || "",
        website: data.socialLinks?.website || "",
        seoTitle: data.defaultSeo?.title || "",
        seoDescription: data.defaultSeo?.description || "",
        ogImage: data.defaultSeo?.ogImage || "",
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return normalizeSettings(result.blogPortalUpdateSettings);
  } catch (err) {
    if (err instanceof GraphqlError) {
      throw new ActionError(err.message, 502);
    }
    throw err;
  }
}

export async function getAnalyticsSummary(days = 30) {
  const session = await requireRole("ADMIN");
  if (!canViewAnalytics(session.user.role)) throw new ActionError("Forbidden", 403);

  await connectDB();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [viewsByDay, topPosts, totalViews] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { type: "page_view", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          type: "page_view",
          createdAt: { $gte: since },
          postId: { $ne: null },
        },
      },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AnalyticsEvent.countDocuments({ type: "page_view", createdAt: { $gte: since } }),
  ]);

  const postIds = topPosts
    .map((p) => p._id)
    .filter(Boolean)
    .map((id) => new mongoose.Types.ObjectId(String(id)));
  const posts = await Post.find({ _id: { $in: postIds } })
    .select("title slug")
    .lean();
  const postMap = new Map(posts.map((p) => [p._id.toString(), p]));

  return toJSON({
    totalViews,
    viewsByDay: viewsByDay.map((d) => ({ date: d._id, count: d.count })),
    topPosts: topPosts.map((p) => ({
      postId: String(p._id),
      count: p.count,
      title: postMap.get(String(p._id))?.title || "Deleted post",
      slug: postMap.get(String(p._id))?.slug || "",
    })),
  });
}
