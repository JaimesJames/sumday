import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a valid hex color"),
});
