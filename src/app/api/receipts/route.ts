import { query } from "@/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const receiptId = searchParams.get("receiptId");

  if (type === "prices") {
    const result = await query(
      "SELECT * FROM price_history ORDER BY date DESC"
    );
    return Response.json(result.rows);
  }

  // Return items for a specific receipt
  if (receiptId) {
    const result = await query(
      "SELECT * FROM price_history WHERE receipt_id = ? ORDER BY id",
      [Number(receiptId)]
    );
    return Response.json(result.rows);
  }

  const result = await query(
    `SELECT r.*, COUNT(ph.id) as item_count
     FROM receipts r
     LEFT JOIN price_history ph ON ph.receipt_id = r.id
     GROUP BY r.id
     ORDER BY r.date DESC`
  );
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { date, store, total, items } = body;

  if (!date) {
    return Response.json({ error: "date is required" }, { status: 400 });
  }

  // Insert receipt
  const receiptResult = await query(
    "INSERT INTO receipts (date, store, total) VALUES (?, ?, ?) RETURNING *",
    [date, store || null, total || null]
  );
  const receipt = receiptResult.rows[0];

  // Insert price history entries
  const priceEntries = [];
  if (items && Array.isArray(items)) {
    for (const item of items) {
      const entryResult = await query(
        "INSERT INTO price_history (product_name, brand, quantity, unit, price, date, store, receipt_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
        [
          item.productName,
          item.brand || null,
          item.quantity || null,
          item.unit || null,
          item.price,
          date,
          store || null,
          receipt.id as number,
        ]
      );
      priceEntries.push(entryResult.rows[0]);
    }
  }

  return Response.json({ receipt, items: priceEntries }, { status: 201 });
}
