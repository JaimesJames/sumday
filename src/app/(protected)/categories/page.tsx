import { CategoriesView } from "@/components/categories/categories-view";
import { requireUser } from "@/server/auth/session";
import { HydrateClient, trpcServer } from "@/trpc/server";

export default async function CategoriesPage() {
  await requireUser();
  await trpcServer.category.list.prefetch();

  return (
    <HydrateClient>
      <CategoriesView />
    </HydrateClient>
  );
}
