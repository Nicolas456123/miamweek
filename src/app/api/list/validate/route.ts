import { query } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let listName: string | null = null;
  try {
    const body = await request.json();
    listName = body?.listName ?? null;
  } catch {
    /* no body */
  }

  try { await query("ALTER TABLE list_items ADD COLUMN list_name TEXT DEFAULT 'Ma liste'"); } catch { /* already exists */ }

  if (listName) {
    await query(
      "UPDATE list_items SET list_status = 'active' WHERE list_status = 'prep' AND list_name = ?",
      [listName]
    );
  } else {
    await query(
      "UPDATE list_items SET list_status = 'active' WHERE list_status = 'prep'"
    );
  }

  return Response.json({ success: true });
}
