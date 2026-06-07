import { query } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Ensure optional columns exist (édition complète : ouverture, péremption…)
    for (const col of [
      "ALTER TABLE pantry_items ADD COLUMN opened_at TEXT",
      "ALTER TABLE pantry_items ADD COLUMN shelf_life_after_open_days INTEGER",
      "ALTER TABLE pantry_items ADD COLUMN package_size REAL",
      "ALTER TABLE pantry_items ADD COLUMN brand TEXT",
    ]) {
      try { await query(col); } catch { /* already exists */ }
    }

    const result = await query(
      `SELECT p.*, pr.icon, pr.default_unit as defaultUnit,
              pr.kcal_per_100, pr.protein_per_100, pr.carbs_per_100, pr.fat_per_100, pr.fiber_per_100,
              pr.default_package_size, pr.default_brand
       FROM pantry_items p
       LEFT JOIN products pr ON p.product_id = pr.id
       ORDER BY p.category ASC, p.product_name ASC`
    );
    return Response.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch pantry:", error);
    return Response.json(
      { error: "Failed to fetch pantry", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, productName, quantity, unit, category, location } = body;

    try { await query("ALTER TABLE pantry_items ADD COLUMN shelf_life_after_open_days INTEGER"); } catch { /* exists */ }

    if (!productName) {
      return Response.json(
        { error: "productName is required" },
        { status: 400 }
      );
    }

    // Check if item already exists in pantry
    const existing = await query(
      "SELECT * FROM pantry_items WHERE product_name = ? AND location = ?",
      [productName, location || "placard"]
    );

    if (existing.rows.length > 0) {
      // Update quantity
      const item = existing.rows[0];
      const newQty = ((item.quantity as number) || 0) + (quantity || 1);
      await query("UPDATE pantry_items SET quantity = ? WHERE id = ?", [
        newQty,
        item.id as number,
      ]);
      const updated = await query("SELECT * FROM pantry_items WHERE id = ?", [
        item.id as number,
      ]);
      return Response.json(updated.rows[0]);
    }

    // Reprend les valeurs standard du produit (conservation, après ouverture)
    let shelfLifeAfterOpen: number | null = null;
    let expiresAt: string | null = null;
    if (productId) {
      try {
        const prod = await query(
          "SELECT default_shelf_life_days, default_shelf_life_after_open_days FROM products WHERE id = ?",
          [productId]
        );
        if (prod.rows.length > 0) {
          const p = prod.rows[0];
          shelfLifeAfterOpen = (p.default_shelf_life_after_open_days as number | null) ?? null;
          const sl = p.default_shelf_life_days as number | null;
          if (sl != null) {
            const d = new Date();
            d.setDate(d.getDate() + sl);
            expiresAt = d.toISOString().split("T")[0];
          }
        }
      } catch { /* colonnes absentes */ }
    }

    const result = await query(
      `INSERT INTO pantry_items (product_id, product_name, quantity, unit, category, location, shelf_life_after_open_days, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [
        productId || null,
        productName,
        quantity || 1,
        unit || "pcs",
        category || "Autre",
        location || "placard",
        shelfLifeAfterOpen,
        expiresAt,
      ]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to add pantry item:", error);
    return Response.json(
      { error: "Failed to add pantry item" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      productName,
      quantity,
      unit,
      category,
      location,
      addedAt,
      expiresAt,
      openedAt,
      shelfLifeAfterOpenDays,
      packageSize,
      brand,
    } = body;

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const args: (string | number | null)[] = [];

    if (productName !== undefined) {
      updates.push("product_name = ?");
      args.push(productName);
    }
    if (quantity !== undefined) {
      updates.push("quantity = ?");
      args.push(quantity);
    }
    if (unit !== undefined) {
      updates.push("unit = ?");
      args.push(unit);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      args.push(category);
    }
    if (location !== undefined) {
      updates.push("location = ?");
      args.push(location);
    }
    if (addedAt !== undefined) {
      updates.push("added_at = ?");
      args.push(addedAt);
    }
    if (expiresAt !== undefined) {
      updates.push("expires_at = ?");
      args.push(expiresAt);
    }
    if (openedAt !== undefined) {
      updates.push("opened_at = ?");
      args.push(openedAt);
    }
    if (shelfLifeAfterOpenDays !== undefined) {
      updates.push("shelf_life_after_open_days = ?");
      args.push(shelfLifeAfterOpenDays);
    }
    if (packageSize !== undefined) {
      updates.push("package_size = ?");
      args.push(packageSize);
    }
    if (brand !== undefined) {
      updates.push("brand = ?");
      args.push(brand);
    }

    if (updates.length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    args.push(id);
    await query(
      `UPDATE pantry_items SET ${updates.join(", ")} WHERE id = ?`,
      args
    );

    const result = await query("SELECT * FROM pantry_items WHERE id = ?", [id]);
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update pantry item:", error);
    return Response.json(
      { error: "Failed to update pantry item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    await query("DELETE FROM pantry_items WHERE id = ?", [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete pantry item:", error);
    return Response.json(
      { error: "Failed to delete pantry item" },
      { status: 500 }
    );
  }
}
