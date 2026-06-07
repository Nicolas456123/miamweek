import { query } from "@/db";
import { CONSERVATION } from "@/lib/conservation-data";
import { normalize } from "@/lib/utils";

export const runtime = "nodejs";

// Pré-remplit les durées de conservation des produits depuis la base de
// référence (src/lib/conservation-data). Par défaut ne remplit que les
// valeurs manquantes ; ?force=1 écrase les valeurs existantes.
export async function POST(request: Request) {
  try {
    let force = false;
    try {
      const body = await request.json();
      force = !!body?.force;
    } catch {
      /* no body */
    }

    for (const col of [
      "ALTER TABLE products ADD COLUMN default_shelf_life_days INTEGER",
      "ALTER TABLE products ADD COLUMN default_shelf_life_after_open_days INTEGER",
    ]) {
      try { await query(col); } catch { /* already exists */ }
    }

    const result = await query("SELECT id, name, default_shelf_life_days, default_shelf_life_after_open_days FROM products");
    let updated = 0;

    for (const p of result.rows) {
      const data = CONSERVATION[normalize(p.name as string)];
      if (!data) continue;

      const hasShelf = p.default_shelf_life_days != null;
      const hasOpen = p.default_shelf_life_after_open_days != null;
      if (!force && hasShelf && hasOpen) continue;

      const newShelf = force || !hasShelf ? data.shelfLifeDays : p.default_shelf_life_days;
      const newOpen = force || !hasOpen ? data.afterOpenDays : p.default_shelf_life_after_open_days;

      await query(
        "UPDATE products SET default_shelf_life_days = ?, default_shelf_life_after_open_days = ? WHERE id = ?",
        [newShelf as number | null, newOpen as number | null, p.id as number]
      );
      updated++;
    }

    return Response.json({ success: true, updated, available: Object.keys(CONSERVATION).length });
  } catch (error) {
    console.error("Failed to seed conservation:", error);
    return Response.json({ error: "Failed to seed conservation" }, { status: 500 });
  }
}
