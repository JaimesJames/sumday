import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/server/services/category-service";
import { categorySchema } from "@/server/validators/category";

export const categoryRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listCategories(ctx.user.id)),

  create: protectedProcedure
    .input(categorySchema)
    .mutation(({ ctx, input }) => createCategory(ctx.user.id, input)),

  update: protectedProcedure
    .input(categorySchema.extend({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      const { id, ...rest } = input;
      return updateCategory(ctx.user.id, id, rest);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => deleteCategory(ctx.user.id, input.id)),
});
