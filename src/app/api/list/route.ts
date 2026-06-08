import { query } from "@/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const list = searchParams.get("list");

  // Lazily ensure optional columns exist so they are returned to clients
  try { await query("ALTER TABLE list_items ADD COLUMN unavailable INTEGER DEFAULT 0"); } catch { /* already exists */ }
  try { await query("ALTER TABLE list_items ADD COLUMN list_name TEXT DEFAULT 'Ma liste'"); } catch { /* already exists */ }

  const clauses: string[] = [];
  const args: (string | number | null)[] = [];
  if (status) {
    clauses.push("list_status = ?");
    args.push(status);
  }
  if (list) {
    clauses.push("list_name = ?");
    args.push(list);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const result = await query(`SELECT * FROM list_items${where}`, args);
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, productName, quantity, unit, category, source, listStatus, sourceRecipe, listName } = body;

  if (!productName) {
    return Response.json({ error: "productName is required" }, { status: 400 });
  }

  const finalListName = listName || "Ma liste";

  // Add optional columns if they don't exist yet
  try { await query("ALTER TABLE list_items ADD COLUMN source_recipe TEXT"); } catch { /* already exists */ }
  try { await query("ALTER TABLE list_items ADD COLUMN list_name TEXT DEFAULT 'Ma liste'"); } catch { /* already exists */ }

  // For recipe ingredients, convert to purchase units (e.g., 150g lardons → 1 paquet)
  let finalQty = quantity || null;
  let finalUnit = unit || null;
  let finalProductId = productId || null;

  if (source === "recipe" && !productId) {
    // Try to find matching product in catalog
    const match = await query(
      "SELECT id, default_unit FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1",
      [productName]
    );
    if (match.rows.length > 0) {
      finalProductId = match.rows[0].id as number;
      const catalogUnit = match.rows[0].default_unit as string;
      // If recipe uses g/mL but catalog uses pcs/lot/paquet, convert to 1 unit
      if ((unit === "g" || unit === "mL") && !["g", "mL", "kg", "L"].includes(catalogUnit)) {
        finalQty = 1;
        finalUnit = catalogUnit;
      }
    }
  }

  // Fusionne avec un article existant uniquement si même produit, même statut,
  // même liste ET même unité (sinon on additionnait des g dans des kg…).
  if (finalProductId) {
    const existing = await query(
      "SELECT id, quantity, unit FROM list_items WHERE product_id = ? AND list_status = ? AND list_name = ? LIMIT 1",
      [finalProductId, listStatus || "prep", finalListName]
    );
    const sameUnit =
      existing.rows.length > 0 &&
      (existing.rows[0].unit || null) === (finalUnit || null);
    if (existing.rows.length > 0 && sameUnit) {
      const existingQty = (existing.rows[0].quantity as number) || 1;
      const addQty = finalQty || 1;
      const mergedQty = existingQty + addQty;
      const updateResult = await query(
        "UPDATE list_items SET quantity = ? WHERE id = ? RETURNING *",
        [mergedQty, existing.rows[0].id as number]
      );
      return Response.json(updateResult.rows[0], { status: 200 });
    }
  }

  const result = await query(
    "INSERT INTO list_items (product_id, product_name, quantity, unit, category, source, list_status, source_recipe, list_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    [
      finalProductId,
      productName,
      finalQty,
      finalUnit,
      category || null,
      source || "manual",
      listStatus || "prep",
      sourceRecipe || null,
      finalListName,
    ]
  );

  return Response.json(result.rows[0], { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, checked, quantity, listStatus, unavailable } = body;

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  // Lazily add the column if it doesn't exist yet (article indisponible en magasin)
  try { await query("ALTER TABLE list_items ADD COLUMN unavailable INTEGER DEFAULT 0"); } catch { /* already exists */ }

  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (checked !== undefined) {
    setClauses.push("checked = ?");
    values.push(checked ? 1 : 0);
    if (checked === true) {
      setClauses.push("checked_at = ?");
      values.push(new Date().toISOString());
    }
  }
  if (unavailable !== undefined) {
    setClauses.push("unavailable = ?");
    values.push(unavailable ? 1 : 0);
  }
  if (quantity !== undefined) {
    setClauses.push("quantity = ?");
    values.push(quantity);
  }
  if (listStatus !== undefined) {
    setClauses.push("list_status = ?");
    values.push(listStatus);
  }

  if (setClauses.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);
  const result = await query(
    `UPDATE list_items SET ${setClauses.join(", ")} WHERE id = ? RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  return Response.json(result.rows[0]);
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const { id, all, status } = body;

  // Bulk delete: all items (optionally filtered by status)
  if (all) {
    if (status) {
      await query("DELETE FROM list_items WHERE list_status = ?", [status]);
    } else {
      await query("DELETE FROM list_items");
    }
    return Response.json({ success: true });
  }

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  await query("DELETE FROM list_items WHERE id = ?", [id]);
  return Response.json({ success: true });
}
