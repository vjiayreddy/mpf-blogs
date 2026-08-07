import { z } from "zod";
import { CONTENT_STATUSES, ROLES, USER_STATUSES } from "./constants";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(ROLES),
  bio: z.string().max(500).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.enum(ROLES).optional(),
  bio: z.string().max(500).optional(),
  status: z.enum(USER_STATUSES).optional(),
  password: z.string().min(8).max(128).optional(),
});

export const seoSchema = z.object({
  title: z.string().max(70).optional(),
  description: z.string().max(160).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
});

export const postInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  lexicalJSON: z.string().optional(),
  html: z.string().optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  seriesId: z.string().nullable().optional(),
  seriesOrder: z.number().int().min(0).optional(),
  coverImage: z.string().optional(),
  seo: seoSchema.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  featured: z.boolean().optional(),
});

export const pageInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  lexicalJSON: z.string().optional(),
  html: z.string().optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  coverImage: z.string().optional(),
  seo: seoSchema.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export const taxonomySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  coverImage: z.string().optional(),
});

export const mediaUpdateSchema = z.object({
  alt: z.string().max(200).optional(),
});

export const settingsSchema = z.object({
  siteTitle: z.string().min(1).max(120),
  siteDescription: z.string().max(300).optional(),
  logo: z.string().optional(),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  defaultSeo: seoSchema.optional(),
});

export const analyticsEventSchema = z.object({
  type: z.literal("page_view"),
  path: z.string().min(1).max(500),
  postId: z.string().optional(),
  referrer: z.string().max(500).optional(),
});

export const AI_TONES = ["professional", "casual", "technical", "storytelling"] as const;
export const AI_LENGTHS = ["short", "medium", "long"] as const;

export const aiGeneratePostSchema = z.object({
  topic: z.string().min(3).max(500),
  tone: z.enum(AI_TONES).default("professional"),
  length: z.enum(AI_LENGTHS).default("medium"),
  keywords: z.string().max(300).optional(),
});
