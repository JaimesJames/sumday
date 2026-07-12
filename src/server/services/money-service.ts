import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { moneyCategories, moneyCommitments, moneyTransactions } from "@/server/db/schema";
import { monthRange } from "@/lib/money";
import { moneyCategorySchema, moneyCommitmentSchema, moneyTransactionSchema } from "@/server/validators/money";

async function requireCategory(userId: string, categoryId: string, kind: "income" | "expense") {
  const [category] = await db.select().from(moneyCategories).where(and(eq(moneyCategories.id, categoryId), eq(moneyCategories.userId, userId))).limit(1);
  if (!category || (category.kind !== "both" && category.kind !== kind)) throw new Error("Money category not found for this type.");
}

export async function ensureDefaultMoneyCategories(userId: string) {
  await db.insert(moneyCategories).values([
    { userId, name: "Salary", kind: "income", color: "#22C55E" },
    { userId, name: "Bills", kind: "expense", color: "#F97316" },
    { userId, name: "Food", kind: "expense", color: "#EAB308" },
    { userId, name: "Other", kind: "both", color: "#38BDF8" },
  ]).onConflictDoNothing();
}

export async function listMoneyCategories(userId: string) {
  await ensureDefaultMoneyCategories(userId);
  return db.select().from(moneyCategories).where(eq(moneyCategories.userId, userId)).orderBy(asc(moneyCategories.name));
}

export async function createMoneyCategory(userId: string, raw: unknown) {
  const input = moneyCategorySchema.parse(raw);
  const [created] = await db.insert(moneyCategories).values({ userId, ...input }).returning();
  return created;
}

export async function listMoneyTransactions(userId: string, month: string) {
  const { start, end } = monthRange(month);
  return db.select({ transaction: moneyTransactions, categoryName: moneyCategories.name, categoryColor: moneyCategories.color })
    .from(moneyTransactions).innerJoin(moneyCategories, eq(moneyCategories.id, moneyTransactions.categoryId))
    .where(and(eq(moneyTransactions.userId, userId), gte(moneyTransactions.occurredOn, start), lte(moneyTransactions.occurredOn, end)))
    .orderBy(desc(moneyTransactions.occurredOn), desc(moneyTransactions.createdAt));
}

export async function getMoneySummary(userId: string, month: string) {
  const { start, end } = monthRange(month);
  const rows = await db.select({ kind: moneyTransactions.kind, total: sql<number>`coalesce(sum(${moneyTransactions.amountMinor}), 0)::bigint` })
    .from(moneyTransactions).where(and(eq(moneyTransactions.userId, userId), gte(moneyTransactions.occurredOn, start), lte(moneyTransactions.occurredOn, end)))
    .groupBy(moneyTransactions.kind);
  const income = Number(rows.find((row) => row.kind === "income")?.total ?? 0);
  const expense = Number(rows.find((row) => row.kind === "expense")?.total ?? 0);
  return { income, expense, net: income - expense };
}

export async function createMoneyTransaction(userId: string, raw: unknown) {
  const input = moneyTransactionSchema.parse(raw);
  await requireCategory(userId, input.categoryId, input.kind);
  const [created] = await db.insert(moneyTransactions).values({ userId, ...input }).returning();
  return created;
}

export async function deleteMoneyTransaction(userId: string, id: string) {
  await db.delete(moneyTransactions).where(and(eq(moneyTransactions.id, id), eq(moneyTransactions.userId, userId)));
}

export async function listMoneyCommitments(userId: string) {
  return db.select({ commitment: moneyCommitments, categoryName: moneyCategories.name, categoryColor: moneyCategories.color })
    .from(moneyCommitments).innerJoin(moneyCategories, eq(moneyCategories.id, moneyCommitments.categoryId))
    .where(eq(moneyCommitments.userId, userId)).orderBy(asc(moneyCommitments.firstDueOn));
}

export async function createMoneyCommitment(userId: string, raw: unknown) {
  const input = moneyCommitmentSchema.parse(raw);
  await requireCategory(userId, input.categoryId, input.kind);
  const [created] = await db.insert(moneyCommitments).values({
    userId, ...input, remainingInstallments: input.installmentCount ?? null,
  }).returning();
  return created;
}

export async function setCommitmentStatus(userId: string, id: string, status: "active" | "paused" | "completed") {
  await db.update(moneyCommitments).set({ status, updatedAt: new Date() }).where(and(eq(moneyCommitments.id, id), eq(moneyCommitments.userId, userId)));
}

export async function deleteMoneyCommitment(userId: string, id: string) {
  await db.delete(moneyCommitments).where(and(eq(moneyCommitments.id, id), eq(moneyCommitments.userId, userId)));
}

export async function getUpcomingExpenseTotal(userId: string) {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  const [row] = await db.select({ total: sql<number>`coalesce(sum(${moneyCommitments.amountMinor}), 0)::bigint` })
    .from(moneyCommitments).where(and(eq(moneyCommitments.userId, userId), eq(moneyCommitments.status, "active"), eq(moneyCommitments.kind, "expense"), lte(moneyCommitments.firstDueOn, end.toISOString().slice(0, 10))));
  return Number(row?.total ?? 0);
}
