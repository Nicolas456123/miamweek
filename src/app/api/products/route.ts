import { query } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Valeurs standard optionnelles (durée de conservation, après ouverture)
    for (const col of [
      "ALTER TABLE products ADD COLUMN default_shelf_life_days INTEGER",
      "ALTER TABLE products ADD COLUMN default_shelf_life_after_open_days INTEGER",
      "ALTER TABLE products ADD COLUMN price REAL",
    ]) {
      try { await query(col); } catch { /* already exists */ }
    }

    const result = await query(
      "SELECT * FROM products ORDER BY category ASC, COALESCE(sort_order, 100) ASC, name ASC"
    );

    return Response.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return Response.json(
      { error: "Failed to fetch products", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      defaultUnit,
      defaultQuantity,
      icon,
      defaultShelfLifeDays,
      defaultShelfLifeAfterOpenDays,
      price,
    } = body;

    if (!name || !category || !defaultUnit) {
      return Response.json(
        { error: "name, category, and defaultUnit are required" },
        { status: 400 }
      );
    }

    for (const col of [
      "ALTER TABLE products ADD COLUMN default_shelf_life_days INTEGER",
      "ALTER TABLE products ADD COLUMN default_shelf_life_after_open_days INTEGER",
      "ALTER TABLE products ADD COLUMN price REAL",
    ]) {
      try { await query(col); } catch { /* already exists */ }
    }

    const result = await query(
      "INSERT INTO products (name, category, default_unit, default_quantity, icon, is_custom, default_shelf_life_days, default_shelf_life_after_open_days, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
      [
        name,
        category,
        defaultUnit,
        defaultQuantity ?? 1,
        icon || null,
        1,
        defaultShelfLifeDays ?? null,
        defaultShelfLifeAfterOpenDays ?? null,
        price ?? null,
      ]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      category,
      defaultUnit,
      defaultQuantity,
      icon,
      defaultShelfLifeDays,
      defaultShelfLifeAfterOpenDays,
      price,
      kcalPer100,
      proteinPer100,
      carbsPer100,
      fatPer100,
      fiberPer100,
      defaultPackageSize,
      defaultBrand,
    } = body;

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const fields: Record<string, string> = {
      name: "name",
      category: "category",
      defaultUnit: "default_unit",
      defaultQuantity: "default_quantity",
      icon: "icon",
      defaultShelfLifeDays: "default_shelf_life_days",
      defaultShelfLifeAfterOpenDays: "default_shelf_life_after_open_days",
      price: "price",
      kcalPer100: "kcal_per_100",
      proteinPer100: "protein_per_100",
      carbsPer100: "carbs_per_100",
      fatPer100: "fat_per_100",
      fiberPer100: "fiber_per_100",
      defaultPackageSize: "default_package_size",
      defaultBrand: "default_brand",
    };

    const values: Record<string, unknown> = {
      name,
      category,
      defaultUnit,
      defaultQuantity,
      icon,
      defaultShelfLifeDays,
      defaultShelfLifeAfterOpenDays,
      price,
      kcalPer100,
      proteinPer100,
      carbsPer100,
      fatPer100,
      fiberPer100,
      defaultPackageSize,
      defaultBrand,
    };

    const updates: string[] = [];
    const args: (string | number | null)[] = [];
    for (const [key, col] of Object.entries(fields)) {
      if (values[key] !== undefined) {
        updates.push(`${col} = ?`);
        args.push(values[key] as string | number | null);
      }
    }

    if (updates.length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    args.push(id);
    await query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, args);
    const result = await query("SELECT * FROM products WHERE id = ?", [id]);
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update product:", error);
    return Response.json(
      { error: "Failed to update product" },
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

    await query("DELETE FROM products WHERE id = ?", [id]);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return Response.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
