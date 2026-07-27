import { cookies } from "next/headers";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requireUser } from "@/server/auth/session";
import { HydrateClient, trpcServer } from "@/trpc/server";

export default async function DashboardPage() {
  await requireUser();
  const cookieStore = await cookies();
  const timeZone = cookieStore.get("dayly_tz")?.value ?? "UTC";

  await Promise.all([
    trpcServer.category.list.prefetch(),
    trpcServer.dashboard.summary.prefetch({ timeZone }),
  ]);

  return (
    <HydrateClient>
      <DashboardView timeZone={timeZone} />
    </HydrateClient>
  );
}
