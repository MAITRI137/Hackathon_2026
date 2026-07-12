import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("file:")),
  NEXT_PUBLIC_APP_NAME: z.string().default("TransitOps"),
  APP_ENV: z.enum(["development", "production", "test"]).default("development"),
  SESSION_SECRET: z.string().min(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
