import { query } from "@/db";

export const runtime = "nodejs";

// Ensure column exists
let columnAdded = false;
async function ensureColumn() {
  if (columnAdded) return;
  try { await query("ALTER TABLE recipes ADD COLUMN is_favorite INTEGER DEFAULT 0"); } catch { /* exists */ }
  columnAdded = true;
}

export async function POST(request: Request) {
  try {
    await ensureColumn();
    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return Response.json({ error: "recipeId is required" }, { status: 400 });
    }

    // Toggle favorite
    const current = await query("SELECT is_favorite FROM recipes WHERE id = ?", [recipeId]);
    if (current.rows.length === 0) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    const isFav = current.rows[0].is_favorite;
    const newVal = isFav ? 0 : 1;
    await query("UPDATE recipes SET is_favorite = ? WHERE id = ?", [newVal, recipeId]);

    return Response.json({ recipeId, isFavorite: newVal === 1 });
  } catch (error) {
    console.error("Favorite toggle error:", error);
    return Response.json({ error: "Failed to toggle favorite" }, { status: 500 });
  }
}
