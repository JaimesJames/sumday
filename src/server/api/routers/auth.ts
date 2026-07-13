import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { registerSchema } from "@/server/validators/auth";

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerSchema).mutation(async ({ input }) => {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const [existingUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

    if (existingUser?.passwordHash) {
      throw new TRPCError({ code: "CONFLICT", message: "Email already registered. Please sign in instead." });
    }

    if (existingUser && !existingUser.passwordHash) {
      await db
        .update(users)
        .set({
          name: existingUser.name ?? input.name,
          passwordHash,
        })
        .where(eq(users.id, existingUser.id));
      return { upgradedGoogleAccount: true };
    }

    await db.insert(users).values({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    return { upgradedGoogleAccount: false };
  }),
});
