import { query } from "@/db";
import { normalize } from "@/lib/utils";

export const runtime = "nodejs";

async function ensureTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS recipe_persons (
        recipe_id INTEGER PRIMARY KEY,
        persons INTEGER NOT NULL
      )`
    );
  } catch { /* ignore */ }
}

export async function GET() {
  try {
    await ensureTable();
    const result = await query("SELECT * FROM recipe_persons");
    return Response.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch recipe persons:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureTable();
    const { recipeId, persons } = await request.json();
    if (recipeId == null || persons == null) {
      return Response.json({ error: "recipeId and persons required" }, { status: 400 });
    }
    const p = Math.max(1, Number(persons));
    await query(
      `INSERT INTO recipe_persons (recipe_id, persons) VALUES (?, ?)
       ON CONFLICT(recipe_id) DO UPDATE SET persons = excluded.persons`,
      [recipeId, p]
    );

    // Recalcule les quantités des articles de liste issus de cette recette.
    const recRes = await query("SELECT name, servings FROM recipes WHERE id = ?", [recipeId]);
    if (recRes.rows.length > 0) {
      const recName = recRes.rows[0].name as string;
      const servings = (recRes.rows[0].servings as number) || 2;
      const factor = p / (servings || 1);
      const ingRes = await query(
        "SELECT name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ?",
        [recipeId]
      );
      const ings = ingRes.rows.map((r) => ({
        name: normalize(r.name as string),
        quantity: r.quantity as number | null,
        unit: (r.unit as string | null) || null,
      }));
      // Articles candidats : liste en préparation ou active, liés à cette recette
      const itemsRes = await query(
        "SELECT id, product_name FROM list_items WHERE list_status IN ('prep','active') AND source_recipe LIKE ?",
        [`%${recName}%`]
      );
      for (const it of itemsRes.rows) {
        const match = ings.find((ing) => {
          const n = normalize(it.product_name as string);
          return ing.name === n || ing.name.includes(n) || n.includes(ing.name);
        });
        if (match && match.quantity != null) {
          const newQty = Math.round(match.quantity * factor * 100) / 100;
          await query("UPDATE list_items SET quantity = ?, unit = ? WHERE id = ?", [
            newQty,
            match.unit,
            it.id as number,
          ]);
        }
      }
    }

    return Response.json({ success: true, persons: p });
  } catch (error) {
    console.error("Failed to set recipe persons:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
