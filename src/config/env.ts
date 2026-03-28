import { z } from "zod";

const envSchema = z.object({
  GOOGLE_AI_API_KEY: z.string().min(1, "GOOGLE_AI_API_KEY is required"),
});

export const env = envSchema.parse({
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
});
