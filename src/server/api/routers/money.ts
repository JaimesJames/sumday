import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createMoneyCategory,
  createMoneyCommitment,
  createMoneyTransaction,
  deleteMoneyCommitment,
  deleteMoneyTransaction,
  getMoneySummary,
  getUpcomingExpenseTotal,
  listMoneyCategories,
  listMoneyCommitments,
  listMoneyTransactions,
  setCommitmentStatus,
} from "@/server/services/money-service";
import {
  moneyCategorySchema,
  moneyCommitmentSchema,
  moneyTransactionSchema,
} from "@/server/validators/money";

const monthSchema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) });

export const moneyRouter = createTRPCRouter({
  listCategories: protectedProcedure.query(({ ctx }) => listMoneyCategories(ctx.user.id)),

  createCategory: protectedProcedure
    .input(moneyCategorySchema)
    .mutation(({ ctx, input }) => createMoneyCategory(ctx.user.id, input)),

  listTransactions: protectedProcedure
    .input(monthSchema)
    .query(({ ctx, input }) => listMoneyTransactions(ctx.user.id, input.month)),

  createTransaction: protectedProcedure
    .input(moneyTransactionSchema)
    .mutation(({ ctx, input }) => createMoneyTransaction(ctx.user.id, input)),

  deleteTransaction: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => deleteMoneyTransaction(ctx.user.id, input.id)),

  listCommitments: protectedProcedure.query(({ ctx }) => listMoneyCommitments(ctx.user.id)),

  createCommitment: protectedProcedure
    .input(moneyCommitmentSchema)
    .mutation(({ ctx, input }) => createMoneyCommitment(ctx.user.id, input)),

  setCommitmentStatus: protectedProcedure
    .input(z.object({ id: z.string().uuid(), status: z.enum(["active", "paused", "completed"]) }))
    .mutation(({ ctx, input }) => setCommitmentStatus(ctx.user.id, input.id, input.status)),

  deleteCommitment: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => deleteMoneyCommitment(ctx.user.id, input.id)),

  summary: protectedProcedure
    .input(monthSchema)
    .query(({ ctx, input }) => getMoneySummary(ctx.user.id, input.month)),

  upcomingExpenseTotal: protectedProcedure.query(({ ctx }) => getUpcomingExpenseTotal(ctx.user.id)),
});
