import { query } from "@/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    // Move all active items back to prep
    await query(
      "UPDATE list_items SET list_status = 'prep', checked = 0, checked_at = NULL WHERE list_status = 'active'"
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to cancel shopping", details: String(error) },
      { status: 500 }
    );
  }
}
