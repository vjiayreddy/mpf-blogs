import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const AI_TONES = ["professional", "casual", "technical", "storytelling"] as const;
export const AI_LENGTHS = ["short", "medium", "long"] as const;

export const aiGeneratePostSchema = z.object({
  topic: z.string().min(3).max(500),
  tone: z.enum(AI_TONES).default("professional"),
  length: z.enum(AI_LENGTHS).default("medium"),
  keywords: z.string().max(300).optional(),
});
