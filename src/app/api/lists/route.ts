import { query } from "@/db";

export const runtime = "nodejs";

async function ensureTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS shopping_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    );
  } catch { /* ignore */ }
  // Liste par défaut + listes déjà présentes via les articles existants
  try {
    await query("INSERT OR IGNORE INTO shopping_lists (name) VALUES ('Ma liste')");
    await query(
      "INSERT OR IGNORE INTO shopping_lists (name) SELECT DISTINCT list_name FROM list_items WHERE list_name IS NOT NULL"
    );
  } catch { /* la colonne list_name peut ne pas exister encore */ }
}

export async function GET() {
  try {
    await ensureTable();
    const result = await query("SELECT * FROM shopping_lists ORDER BY created_at ASC, name ASC");
    return Response.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch lists:", error);
    return Response.json({ error: "Failed to fetch lists" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const { name } = await request.json();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    await query("INSERT OR IGNORE INTO shopping_lists (name) VALUES (?)", [trimmed]);
    const result = await query("SELECT * FROM shopping_lists WHERE name = ?", [trimmed]);
    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create list:", error);
    return Response.json({ error: "Failed to create list" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureTable();
    const { name } = await request.json();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    if (trimmed === "Ma liste") {
      return Response.json({ error: "La liste par défaut ne peut pas être supprimée" }, { status: 400 });
    }
    // Supprime la liste et ses articles
    await query("DELETE FROM shopping_lists WHERE name = ?", [trimmed]);
    try { await query("DELETE FROM list_items WHERE list_name = ?", [trimmed]); } catch { /* ignore */ }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete list:", error);
    return Response.json({ error: "Failed to delete list" }, { status: 500 });
  }
}
