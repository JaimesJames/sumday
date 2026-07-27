import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

// Prefetches in Server Components are `await`ed (not fire-and-forget), so
// every dehydrated query is already resolved by the time it's serialized —
// no need to opt into dehydrating pending/streaming queries here.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
