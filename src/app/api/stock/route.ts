import { db } from "@/db";
import { stockItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@libsql/client";

export const runtime = "nodejs";

export async function GET() {
  let url = process.env.TURSO_DATABASE_URL!;
  if (url.startsWith("libsql://")) url = url.replace("libsql://", "https://");
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const result = await client.execute(
    "SELECT s.*, p.name as product_name FROM stock_items s LEFT JOIN products p ON s.product_id = p.id ORDER BY CASE s.status WHEN 'out' THEN 1 WHEN 'low' THEN 2 ELSE 3 END"
  );

  return Response.json(result.rows);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return Response.json({ error: "id and status are required" }, { status: 400 });
  }

  const result = await db
    .update(stockItems)
    .set({ status })
    .where(eq(stockItems.id, id))
    .returning();

  if (result.length === 0) {
    return Response.json({ error: "Stock item not found" }, { status: 404 });
  }

  return Response.json(result[0]);
}
