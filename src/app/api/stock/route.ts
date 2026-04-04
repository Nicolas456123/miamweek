import { query } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await query(
      "SELECT s.*, p.name as product_name FROM stock_items s LEFT JOIN products p ON s.product_id = p.id ORDER BY CASE s.status WHEN 'out' THEN 1 WHEN 'low' THEN 2 ELSE 3 END"
    );
    return Response.json(result.rows);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch stock", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return Response.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    const result = await query(
      "UPDATE stock_items SET status = ? WHERE id = ? RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Stock item not found" },
        { status: 404 }
      );
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    return Response.json(
      { error: "Failed to update stock", details: String(error) },
      { status: 500 }
    );
  }
}
