import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { categories, timeLogs } from "@/server/db/schema";
import { categorySchema } from "@/server/validators/category";

export async function listCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.name));
}

export async function createCategory(userId: string, rawInput: unknown) {
  const input = categorySchema.parse(rawInput);
  const [created] = await db
    .insert(categories)
    .values({ userId, ...input })
    .returning();
  return created;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  rawInput: unknown,
) {
  const input = categorySchema.parse(rawInput);
  const [updated] = await db
    .update(categories)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();
  return updated;
}

export async function deleteCategory(userId: string, categoryId: string) {
  const [usage] = await db
    .select({ id: timeLogs.id })
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), eq(timeLogs.categoryId, categoryId)))
    .limit(1);
  if (usage) {
    throw new Error("Category is currently used by logs.");
  }

  const [deleted] = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();
  return deleted;
}
