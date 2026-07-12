import { z } from "zod";

const amountSchema = z.coerce.number().positive().finite().transform((value) => Math.round(value * 100));

export const moneyCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  kind: z.enum(["income", "expense", "both"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const moneyTransactionSchema = z.object({
  categoryId: z.string().uuid(),
  kind: z.enum(["income", "expense"]),
  amountMinor: amountSchema,
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  occurredOn: z.iso.date(),
  note: z.string().trim().max(1000).optional(),
});

export const moneyCommitmentSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(140),
  kind: z.enum(["income", "expense"]),
  amountMinor: amountSchema,
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  firstDueOn: z.iso.date(),
  frequency: z.enum(["once", "weekly", "monthly", "yearly"]),
  installmentCount: z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().int().positive().optional()),
  endsOn: z.preprocess((value) => value === "" || value == null ? undefined : value, z.iso.date().optional()),
  status: z.enum(["active", "paused", "completed"]).default("active"),
  note: z.string().trim().max(1000).optional(),
});
