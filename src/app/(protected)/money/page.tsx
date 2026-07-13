import { format } from "date-fns";
import { MoneyView } from "@/components/money/money-view";
import { requireUser } from "@/server/auth/session";
import { HydrateClient, trpcServer } from "@/trpc/server";

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; calendar?: string }>;
}) {
  await requireUser();
  const query = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(query.month ?? "") ? query.month! : format(new Date(), "yyyy-MM");

  await Promise.all([
    trpcServer.money.listCategories.prefetch(),
    trpcServer.money.listTransactions.prefetch({ month }),
    trpcServer.money.listCommitments.prefetch(),
    trpcServer.money.summary.prefetch({ month }),
    trpcServer.money.upcomingExpenseTotal.prefetch(),
    trpcServer.calendar.connectionState.prefetch(),
  ]);

  return (
    <HydrateClient>
      {query.calendar === "connected" ? (
        <div className="mx-auto mb-4 max-w-[1500px] rounded-[8px] border border-[#38BDF8] bg-[#17303a] px-4 py-2 text-sm text-[#9DDBF5]">
          Google Calendar connected. You can sync active commitments now.
        </div>
      ) : null}
      <MoneyView month={month} />
    </HydrateClient>
  );
}
