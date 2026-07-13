import "server-only";

import { cache } from "react";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createQueryClient } from "@/server/api/query-client";
import type { AppRouter } from "@/server/api/root";

const createContext = cache(createTRPCContext);
const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: trpcServer, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
