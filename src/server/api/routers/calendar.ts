import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  getCalendarConnectionState,
  syncMoneyCommitmentsToGoogle,
} from "@/server/services/google-calendar-service";

export const calendarRouter = createTRPCRouter({
  connectionState: protectedProcedure.query(({ ctx }) => getCalendarConnectionState(ctx.user.id)),

  sync: protectedProcedure.mutation(({ ctx }) => syncMoneyCommitmentsToGoogle(ctx.user.id)),
});
