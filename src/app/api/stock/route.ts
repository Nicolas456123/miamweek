import { db } from "@/db";
import { stockItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

async function queryTursoRaw(sql: string) {
  const url = process.env.TURSO_DATABASE_URL!.replace("libsql://", "https://");
  const res = await fetch(`${url}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql } },
        { type: "close" },
      ],
    }),
  });
  const data = await res.json();
  const result = data.results?.[0]?.response?.result;
  if (!result) return [];
  const cols = result.cols.map((c: { name: string }) => c.name);
  return result.rows.map((row: { value: string }[]) => {
    const obj: Record<string, string> = {};
    row.forEach((cell: { value: string }, i: number) => {
      obj[cols[i]] = cell.value;
    });
    return obj;
  });
}

export async function GET() {
  try {
    const rows = await queryTursoRaw(
      "SELECT s.*, p.name as product_name FROM stock_items s LEFT JOIN products p ON s.product_id = p.id ORDER BY CASE s.status WHEN 'out' THEN 1 WHEN 'low' THEN 2 ELSE 3 END"
    );
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: "Failed to fetch stock", details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
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
  } catch (error) {
    return Response.json({ error: "Failed to update stock", details: String(error) }, { status: 500 });
  }
}
