import { query } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  try {
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
    const { name, category, defaultUnit, icon } = body;

    if (!name || !category || !defaultUnit) {
      return Response.json(
        { error: "name, category, and defaultUnit are required" },
        { status: 400 }
      );
    }

    const result = await query(
      "INSERT INTO products (name, category, default_unit, icon, is_custom) VALUES (?, ?, ?, ?, ?) RETURNING *",
      [name, category, defaultUnit, icon || null, 1]
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
