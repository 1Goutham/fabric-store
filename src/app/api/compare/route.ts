import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/api/respond";
import { compareProducts } from "@/lib/intelligence/assistant";

const schema = z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(2).max(4) });

export const POST = handle(async (req) => {
  const { ids } = await parseBody(req, schema);
  return ok({ rows: await compareProducts(ids) });
});
