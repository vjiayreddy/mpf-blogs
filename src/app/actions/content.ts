"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { ActionError, requireGraphqlRole, requireRole, toJSON } from "@/lib/session";
import {
  canAssignRole,
  canEditAnyContent,
  canManageUsers,
  canPublish,
} from "@/lib/rbac";
import {
  pageInputSchema,
  postInputSchema,
  taxonomySchema,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/validators";
import { readingTimeFromHtml, slugify } from "@/lib/utils";
import { Post } from "@/models/Post";
import { Page } from "@/models/Page";
import { Revision } from "@/models/Revision";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { graphqlAuthed } from "@/lib/graphql/server";
import { DASHBOARD_STATS_QUERY } from "@/graphql/operations/dashboard";
import { GraphqlError } from "@/lib/graphql/client";
import { fetchTaxonomies } from "@/lib/graphql/taxonomies";
import {
  CREATE_CATEGORY_MUTATION,
  CREATE_SERIES_MUTATION,
  CREATE_TAG_MUTATION,
  UPDATE_CATEGORY_MUTATION,
  UPDATE_SERIES_MUTATION,
  UPDATE_TAG_MUTATION,
} from "@/graphql/operations/taxonomies";
import type { Role } from "@/lib/constants";
import type { ContentStatus } from "@/lib/constants";

function plaintextFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function uniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Model: { findOne: (...args: any[]) => any },
  base: string,
  excludeId?: string
) {
  let slug = slugify(base) || "item";
  let i = 0;
  while (true) {
    const candidate = i === 0 ? slug : `${slug}-${i}`;
    const existing = await Model.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();
    if (!existing) return candidate;
    i += 1;
  }
}

async function saveRevision(opts: {
  documentId: string;
  documentType: "post" | "page";
  lexicalJSON: string;
  html: string;
  title: string;
  authorId: string;
}) {
  await Revision.create(opts);
}

function resolveStatusFields(
  status: ContentStatus | undefined,
  scheduledAt: string | null | undefined,
  role: Role
) {
  let nextStatus: ContentStatus = status || "draft";
  let nextScheduledAt: Date | null = null;
  let publishedAt: Date | null | undefined = undefined;

  if (nextStatus === "published" || nextStatus === "scheduled") {
    if (!canPublish(role)) {
      throw new ActionError("You cannot publish or schedule content", 403);
    }
  }

  if (nextStatus === "scheduled") {
    if (!scheduledAt) throw new ActionError("scheduledAt is required for scheduled posts");
    nextScheduledAt = new Date(scheduledAt);
    if (nextScheduledAt.getTime() <= Date.now()) {
      nextStatus = "published";
      nextScheduledAt = null;
      publishedAt = new Date();
    }
  }

  if (nextStatus === "published") {
    publishedAt = new Date();
    nextScheduledAt = null;
  }

  if (nextStatus === "draft") {
    nextScheduledAt = null;
  }

  return { nextStatus, nextScheduledAt, publishedAt };
}

export async function listPosts(filters?: {
  status?: string;
  q?: string;
}) {
  const session = await requireRole("AUTHOR");
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters?.status) query.status = filters.status;
  if (!canEditAnyContent(session.user.role)) {
    query.authorId = session.user.id;
  }
  if (filters?.q) {
    query.$text = { $search: filters.q };
  }
  const posts = await Post.find(query)
    .sort({ updatedAt: -1 })
    .populate("authorId", "name email")
    .lean();
  return toJSON(posts);
}

export async function getPost(id: string) {
  const session = await requireRole("AUTHOR");
  await connectDB();
  const post = await Post.findById(id)
    .populate("authorId", "name email")
    .populate("categoryIds")
    .populate("tagIds")
    .populate("seriesId")
    .lean();
  if (!post) throw new ActionError("Post not found", 404);
  if (
    !canEditAnyContent(session.user.role) &&
    String(post.authorId?._id || post.authorId) !== session.user.id
  ) {
    throw new ActionError("Forbidden", 403);
  }
  return toJSON(post);
}

export async function createPost(input: unknown) {
  const session = await requireRole("AUTHOR");
  const data = postInputSchema.parse(input);
  await connectDB();

  const { nextStatus, nextScheduledAt, publishedAt } = resolveStatusFields(
    data.status,
    data.scheduledAt,
    session.user.role
  );

  const slug = await uniqueSlug(Post, data.slug || data.title);
  const html = data.html || "";
  const post = await Post.create({
    title: data.title,
    slug,
    excerpt: data.excerpt || "",
    lexicalJSON: data.lexicalJSON || "",
    html,
    plaintext: plaintextFromHtml(html),
    status: nextStatus,
    authorId: session.user.id,
    categoryIds: data.categoryIds || [],
    tagIds: data.tagIds || [],
    seriesId: data.seriesId || null,
    seriesOrder: data.seriesOrder || 0,
    coverImage: data.coverImage || "",
    seo: data.seo || {},
    scheduledAt: nextScheduledAt,
    publishedAt: publishedAt ?? null,
    readingTime: readingTimeFromHtml(html),
    featured: data.featured || false,
  });

  if (data.lexicalJSON) {
    await saveRevision({
      documentId: post._id.toString(),
      documentType: "post",
      lexicalJSON: data.lexicalJSON,
      html,
      title: data.title,
      authorId: session.user.id,
    });
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
  return toJSON(post);
}

export async function updatePost(id: string, input: unknown, opts?: { createRevision?: boolean }) {
  const session = await requireRole("AUTHOR");
  const data = postInputSchema.partial().extend({ title: postInputSchema.shape.title.optional() }).parse(input);
  await connectDB();

  const existing = await Post.findById(id);
  if (!existing) throw new ActionError("Post not found", 404);
  if (
    !canEditAnyContent(session.user.role) &&
    existing.authorId.toString() !== session.user.id
  ) {
    throw new ActionError("Forbidden", 403);
  }

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.excerpt !== undefined) updates.excerpt = data.excerpt;
  if (data.lexicalJSON !== undefined) updates.lexicalJSON = data.lexicalJSON;
  if (data.html !== undefined) {
    updates.html = data.html;
    updates.plaintext = plaintextFromHtml(data.html);
    updates.readingTime = readingTimeFromHtml(data.html);
  }
  if (data.categoryIds !== undefined) updates.categoryIds = data.categoryIds;
  if (data.tagIds !== undefined) updates.tagIds = data.tagIds;
  if (data.seriesId !== undefined) updates.seriesId = data.seriesId;
  if (data.seriesOrder !== undefined) updates.seriesOrder = data.seriesOrder;
  if (data.coverImage !== undefined) updates.coverImage = data.coverImage;
  if (data.seo !== undefined) updates.seo = data.seo;
  if (data.featured !== undefined) updates.featured = data.featured;
  if (data.slug !== undefined) {
    updates.slug = await uniqueSlug(Post, data.slug, id);
  } else if (data.title !== undefined && existing.status === "draft") {
    // keep existing slug unless explicitly changed
  }

  if (data.status !== undefined || data.scheduledAt !== undefined) {
    const { nextStatus, nextScheduledAt, publishedAt } = resolveStatusFields(
      data.status || (existing.status as ContentStatus),
      data.scheduledAt !== undefined
        ? data.scheduledAt
        : existing.scheduledAt?.toISOString() || null,
      session.user.role
    );
    updates.status = nextStatus;
    updates.scheduledAt = nextScheduledAt;
    if (publishedAt) {
      updates.publishedAt = existing.publishedAt || publishedAt;
    }
    if (nextStatus === "draft") {
      updates.publishedAt = null;
    }
    if (canEditAnyContent(session.user.role)) {
      updates.editorId = session.user.id;
    }
  }

  const post = await Post.findByIdAndUpdate(id, updates, { new: true });
  if (!post) throw new ActionError("Post not found", 404);

  if (opts?.createRevision && (data.lexicalJSON || existing.lexicalJSON)) {
    await saveRevision({
      documentId: id,
      documentType: "post",
      lexicalJSON: (data.lexicalJSON ?? existing.lexicalJSON) || "",
      html: (data.html ?? existing.html) || "",
      title: (data.title ?? existing.title) || "",
      authorId: session.user.id,
    });
  }

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}`);
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");
  revalidatePath("/");
  return toJSON(post);
}

export async function deletePost(id: string) {
  const session = await requireRole("EDITOR");
  await connectDB();
  const post = await Post.findById(id);
  if (!post) throw new ActionError("Post not found", 404);
  if (
    !canEditAnyContent(session.user.role) &&
    post.authorId.toString() !== session.user.id
  ) {
    throw new ActionError("Forbidden", 403);
  }
  await Post.findByIdAndDelete(id);
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true };
}

export async function listPages() {
  await requireRole("AUTHOR");
  await connectDB();
  const pages = await Page.find().sort({ updatedAt: -1 }).lean();
  return toJSON(pages);
}

export async function getPage(id: string) {
  await requireRole("AUTHOR");
  await connectDB();
  const page = await Page.findById(id).lean();
  if (!page) throw new ActionError("Page not found", 404);
  return toJSON(page);
}

export async function createPage(input: unknown) {
  const session = await requireRole("EDITOR");
  const data = pageInputSchema.parse(input);
  await connectDB();
  const { nextStatus, nextScheduledAt, publishedAt } = resolveStatusFields(
    data.status,
    data.scheduledAt,
    session.user.role
  );
  const slug = await uniqueSlug(Page, data.slug || data.title);
  const page = await Page.create({
    title: data.title,
    slug,
    excerpt: data.excerpt || "",
    lexicalJSON: data.lexicalJSON || "",
    html: data.html || "",
    status: nextStatus,
    authorId: session.user.id,
    coverImage: data.coverImage || "",
    seo: data.seo || {},
    scheduledAt: nextScheduledAt,
    publishedAt: publishedAt ?? null,
  });
  revalidatePath("/admin/pages");
  revalidatePath(`/${page.slug}`);
  return toJSON(page);
}

export async function updatePage(id: string, input: unknown, opts?: { createRevision?: boolean }) {
  const session = await requireRole("EDITOR");
  const data = pageInputSchema.partial().extend({ title: pageInputSchema.shape.title.optional() }).parse(input);
  await connectDB();
  const existing = await Page.findById(id);
  if (!existing) throw new ActionError("Page not found", 404);

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.excerpt !== undefined) updates.excerpt = data.excerpt;
  if (data.lexicalJSON !== undefined) updates.lexicalJSON = data.lexicalJSON;
  if (data.html !== undefined) updates.html = data.html;
  if (data.coverImage !== undefined) updates.coverImage = data.coverImage;
  if (data.seo !== undefined) updates.seo = data.seo;
  if (data.slug) updates.slug = await uniqueSlug(Page, data.slug, id);

  if (data.status !== undefined || data.scheduledAt !== undefined) {
    const resolved = resolveStatusFields(
      data.status || (existing.status as ContentStatus),
      data.scheduledAt !== undefined
        ? data.scheduledAt
        : existing.scheduledAt?.toISOString() || null,
      session.user.role
    );
    updates.status = resolved.nextStatus;
    updates.scheduledAt = resolved.nextScheduledAt;
    if (resolved.publishedAt) updates.publishedAt = existing.publishedAt || resolved.publishedAt;
    if (resolved.nextStatus === "draft") updates.publishedAt = null;
  }

  updates.editorId = session.user.id;
  const page = await Page.findByIdAndUpdate(id, updates, { new: true });
  if (!page) throw new ActionError("Page not found", 404);

  if (opts?.createRevision && (data.lexicalJSON || existing.lexicalJSON)) {
    await saveRevision({
      documentId: id,
      documentType: "page",
      lexicalJSON: (data.lexicalJSON ?? existing.lexicalJSON) || "",
      html: (data.html ?? existing.html) || "",
      title: (data.title ?? existing.title) || "",
      authorId: session.user.id,
    });
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/${page.slug}`);
  return toJSON(page);
}

export async function deletePage(id: string) {
  await requireRole("EDITOR");
  await connectDB();
  await Page.findByIdAndDelete(id);
  revalidatePath("/admin/pages");
  return { ok: true };
}

export async function listTaxonomies() {
  const session = await requireGraphqlRole("AUTHOR");
  try {
    return await fetchTaxonomies(session.accessToken);
  } catch (err) {
    if (err instanceof GraphqlError) throw new ActionError(err.message, 502);
    throw err;
  }
}

export async function listCategories() {
  const { categories } = await listTaxonomies();
  return categories;
}
export async function createCategory(input: unknown) {
  await requireGraphqlRole("EDITOR");
  const data = taxonomySchema.parse(input);
  try {
    const result = await graphqlAuthed<{
      blogPortalCreateCategory: { id: string; name: string; slug: string; description?: string };
    }>({
      query: CREATE_CATEGORY_MUTATION,
      variables: {
        name: data.name,
        slug: data.slug || slugify(data.name),
        description: data.description || "",
      },
    });
    revalidatePath("/admin/categories");
    const created = result.blogPortalCreateCategory;
    return { _id: created.id, ...created };
  } catch (err) {
    if (err instanceof GraphqlError) throw new ActionError(err.message, 502);
    throw err;
  }
}
export async function updateCategory(id: string, input: unknown) {
  await requireGraphqlRole("EDITOR");
  const data = taxonomySchema.partial().parse(input);
  try {
    const result = await graphqlAuthed<{
      blogPortalUpdateCategory: { id: string; name: string; slug: string; description?: string };
    }>({
      query: UPDATE_CATEGORY_MUTATION,
      variables: { id, name: data.name, description: data.description },
    });
    revalidatePath("/admin/categories");
    const updated = result.blogPortalUpdateCategory;
    return { _id: updated.id, ...updated };
  } catch (err) {
    if (err instanceof GraphqlError) throw new ActionError(err.message, 502);
    throw err;
  }
}
export async function deleteCategory(_id: string) {
  await requireGraphqlRole("EDITOR");
  throw new ActionError("Deleting categories is not supported by the GraphQL API", 405);
}

export async function listTags() {
  const { tags } = await listTaxonomies();
  return tags;
}
export async function createTag(input: unknown) {
  await requireGraphqlRole("EDITOR");
  const data = taxonomySchema.parse(input);
  try {
    const result = await graphqlAuthed<{
      blogPortalCreateTag: { id: string; name: string; slug: string };
    }>({
      query: CREATE_TAG_MUTATION,
      variables: { name: data.name, slug: data.slug || slugify(data.name) },
    });
    revalidatePath("/admin/tags");
    const created = result.blogPortalCreateTag;
    return { _id: created.id, ...created };
  } catch (err) {
    if (err instanceof GraphqlError) throw new ActionError(err.message, 502);
    throw err;
  }
}
export async function updateTag(id: string, input: unknown) {
  await requireGraphqlRole("EDITOR");
  const data = taxonomySchema.partial().parse(input);
  try {
    const result = await graphqlAuthed<{
      blogPortalUpdateTag: { id: string; name: string; slug: string };
    }>({
      query: UPDATE_TAG_MUTATION,
      variables: { id, name: data.name },
    });
    revalidatePath("/admin/tags");
    const updated = result.blogPortalUpdateTag;
    return { _id: updated.id, ...updated };
  } catch (err) {
    if (err instanceof GraphqlError) throw new ActionError(err.message, 502);
    throw err;
  }
}
export async function deleteTag(_id: string) {
  await requireGraphqlRole("EDITOR");
  throw new ActionError("Deleting tags is not supported by the GraphQL API", 405);
}

export async function listSeries() {
  const { series } = await listTaxonomies();
  return series;
}
export async function createSeries(input: unknown) {
  await requireGraphqlRole("EDITOR");
  const data = taxonomySchema.parse(input);
  try {
    const result = await graphqlAuthed<{
      blogPortalCreateSeries: {
        id: string;
        name: string;
        slug: string;
        description?: string;
        coverImage?: string;
      };
    }>({
      query: CREATE_SERIES_MUTATION,
      variables: {
        name: data.name,
        slug: data.slug || slugify(data.name),
        description: data.description || "",
        coverImage: data.coverImage || "",
      },
    });
    revalidatePath("/admin/series");
    const created = result.blogPortalCreateSeries;
    return { _id: created.id, ...created };
  } catch (err) {
    if (err instanceof GraphqlError) throw new ActionError(err.message, 502);
    throw err;
  }
}
export async function updateSeries(id: string, input: unknown) {
  await requireGraphqlRole("EDITOR");
  const data = taxonomySchema.partial().parse(input);
  try {
    const result = await graphqlAuthed<{
      blogPortalUpdateSeries: {
        id: string;
        name: string;
        slug: string;
        description?: string;
        coverImage?: string;
      };
    }>({
      query: UPDATE_SERIES_MUTATION,
      variables: {
        id,
        name: data.name,
        description: data.description,
        coverImage: data.coverImage,
      },
    });
    revalidatePath("/admin/series");
    const updated = result.blogPortalUpdateSeries;
    return { _id: updated.id, ...updated };
  } catch (err) {
    if (err instanceof GraphqlError) throw new ActionError(err.message, 502);
    throw err;
  }
}
export async function deleteSeries(_id: string) {
  await requireGraphqlRole("EDITOR");
  throw new ActionError("Deleting series is not supported by the GraphQL API", 405);
}

export async function listUsers() {
  await requireRole("ADMIN");
  await connectDB();
  return toJSON(
    await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean()
  );
}

export async function createUser(input: unknown) {
  const session = await requireRole("ADMIN");
  if (!canManageUsers(session.user.role)) throw new ActionError("Forbidden", 403);
  const data = userCreateSchema.parse(input);
  if (!canAssignRole(session.user.role, data.role as Role)) {
    throw new ActionError("Cannot assign that role", 403);
  }
  await connectDB();
  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) throw new ActionError("Email already in use");
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: data.role,
    bio: data.bio || "",
  });
  revalidatePath("/admin/users");
  return toJSON({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  });
}

export async function updateUser(id: string, input: unknown) {
  const session = await requireRole("ADMIN");
  const data = userUpdateSchema.parse(input);
  await connectDB();
  const target = await User.findById(id);
  if (!target) throw new ActionError("User not found", 404);
  if (target.role === "OWNER" && session.user.role !== "OWNER") {
    throw new ActionError("Cannot modify owner", 403);
  }
  if (data.role && !canAssignRole(session.user.role, data.role as Role)) {
    throw new ActionError("Cannot assign that role", 403);
  }
  const updates: Record<string, unknown> = {};
  if (data.name) updates.name = data.name;
  if (data.role) updates.role = data.role;
  if (data.bio !== undefined) updates.bio = data.bio;
  if (data.status) updates.status = data.status;
  if (data.password) updates.passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-passwordHash");
  revalidatePath("/admin/users");
  return toJSON(user);
}

export async function getDashboardStats() {
  await requireGraphqlRole("AUTHOR");

  try {
    const data = await graphqlAuthed<{
      blogPortalDashboardStats: {
        drafts: number;
        scheduled: number;
        published: number;
        recentDrafts: Array<{
          id: string;
          title: string;
          slug: string;
          status: string;
        }>;
        scheduledQueue: Array<{
          id: string;
          title: string;
          slug: string;
          scheduledAt?: string | null;
        }>;
      };
    }>({ query: DASHBOARD_STATS_QUERY });

    return data.blogPortalDashboardStats;
  } catch (err) {
    if (err instanceof GraphqlError) {
      throw new ActionError(err.message, 502);
    }
    throw err;
  }
}
