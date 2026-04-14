"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { registerSchema } from "@/server/validators/auth";

export type RegisterActionState = {
  error: string | null;
};

export async function registerAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  console.info("[register] registerAction invoked");
  const parsedResult = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsedResult.success) {
    console.warn("[register] validation failed", parsedResult.error.flatten().fieldErrors);
    return {
      error: "Please provide a valid name, email, and password (minimum 8 characters).",
    };
  }
  const parsed = parsedResult.data;

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const [existingUser] = await db.select().from(users).where(eq(users.email, parsed.email)).limit(1);

  if (existingUser?.passwordHash) {
    console.warn("[register] duplicate email", { email: parsed.email });
    return { error: "Email already registered. Please sign in instead." };
  }

  if (existingUser && !existingUser.passwordHash) {
    console.info("[register] upgrading OAuth-only account with password", { email: parsed.email });
    await db
      .update(users)
      .set({
        name: existingUser.name ?? parsed.name,
        passwordHash,
      })
      .where(eq(users.id, existingUser.id));
    redirect("/login?registered=true&fromGoogle=true");
  }

  console.info("[register] creating new credentials user", { email: parsed.email });
  await db.insert(users).values({
    name: parsed.name,
    email: parsed.email,
    passwordHash,
  });
  redirect("/login?registered=true");
}
