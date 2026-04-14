import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
});

const authSecret = parsedEnv.AUTH_SECRET ?? parsedEnv.NEXTAUTH_SECRET;
if (!authSecret) {
  throw new Error("Missing AUTH_SECRET or NEXTAUTH_SECRET");
}

export const env = {
  DATABASE_URL: parsedEnv.DATABASE_URL,
  AUTH_SECRET: authSecret,
  AUTH_URL: parsedEnv.AUTH_URL ?? parsedEnv.NEXTAUTH_URL,
  AUTH_TRUST_HOST: parsedEnv.AUTH_TRUST_HOST ?? false,
  GOOGLE_CLIENT_ID: parsedEnv.AUTH_GOOGLE_ID ?? parsedEnv.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: parsedEnv.AUTH_GOOGLE_SECRET ?? parsedEnv.GOOGLE_CLIENT_SECRET,
};
