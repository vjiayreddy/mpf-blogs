import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const AI_TONES = ["professional", "casual", "technical", "storytelling"] as const;
export const AI_LENGTHS = ["short", "medium", "long"] as const;
