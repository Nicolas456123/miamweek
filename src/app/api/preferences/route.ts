import { query } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await query(
      `SELECT fp.*, p.icon, p.category as product_category
       FROM food_preferences fp
       LEFT JOIN products p ON fp.product_id = p.id
       ORDER BY fp.status ASC, fp.product_name ASC`
    );
    return Response.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return Response.json(
      { error: "Failed to fetch preferences", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, productName, status, note } = body;

    if (!productName || !status) {
      return Response.json(
        { error: "productName and status are required" },
        { status: 400 }
      );
    }

    // Check if preference already exists for this product
    const existing = await query(
      "SELECT * FROM food_preferences WHERE product_name = ?",
      [productName]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await query(
        "UPDATE food_preferences SET status = ?, note = ? WHERE id = ?",
        [status, note || null, existing.rows[0].id as number]
      );
      const updated = await query(
        "SELECT * FROM food_preferences WHERE id = ?",
        [existing.rows[0].id as number]
      );
      return Response.json(updated.rows[0]);
    }

    const result = await query(
      `INSERT INTO food_preferences (product_id, product_name, status, note)
       VALUES (?, ?, ?, ?) RETURNING *`,
      [productId || null, productName, status, note || null]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to save preference:", error);
    return Response.json(
      { error: "Failed to save preference" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, note } = body;

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const args: (string | number | null)[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      args.push(status);
    }
    if (note !== undefined) {
      updates.push("note = ?");
      args.push(note);
    }

    if (updates.length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    args.push(id);
    await query(
      `UPDATE food_preferences SET ${updates.join(", ")} WHERE id = ?`,
      args
    );

    const result = await query(
      "SELECT * FROM food_preferences WHERE id = ?",
      [id]
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update preference:", error);
    return Response.json(
      { error: "Failed to update preference" },
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

    await query("DELETE FROM food_preferences WHERE id = ?", [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete preference:", error);
    return Response.json(
      { error: "Failed to delete preference" },
      { status: 500 }
    );
  }
}
