import { db } from "@/db";
import { listItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST() {
  await db
    .update(listItems)
    .set({ listStatus: "active" })
    .where(eq(listItems.listStatus, "prep"));

  return Response.json({ success: true });
}
