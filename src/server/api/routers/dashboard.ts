import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getDashboardSummary } from "@/server/services/dashboard-service";

export const dashboardRouter = createTRPCRouter({
  summary: protectedProcedure
    .input(z.object({ timeZone: z.string() }))
    .query(({ ctx, input }) => getDashboardSummary(ctx.user.id, input.timeZone)),
});
