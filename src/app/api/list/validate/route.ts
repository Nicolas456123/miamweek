import { query } from "@/db";

export const runtime = "nodejs";

export async function POST() {
  await query(
    "UPDATE list_items SET list_status = 'active' WHERE list_status = 'prep'"
  );

  return Response.json({ success: true });
}
