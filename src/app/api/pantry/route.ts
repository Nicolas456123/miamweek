import { query } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await query(
      `SELECT p.*, pr.icon, pr.default_unit as defaultUnit
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

    const result = await query(
      `INSERT INTO pantry_items (product_id, product_name, quantity, unit, category, location)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      [
        productId || null,
        productName,
        quantity || 1,
        unit || "pcs",
        category || "Autre",
        location || "placard",
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
    const { id, quantity, unit, location, expiresAt, openedAt, shelfLifeAfterOpenDays } = body;

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const args: (string | number | null)[] = [];

    if (quantity !== undefined) {
      updates.push("quantity = ?");
      args.push(quantity);
    }
    if (unit !== undefined) {
      updates.push("unit = ?");
      args.push(unit);
    }
    if (location !== undefined) {
      updates.push("location = ?");
      args.push(location);
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
