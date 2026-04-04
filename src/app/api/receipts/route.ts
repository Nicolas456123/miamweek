import { db } from "@/db";
import { receipts, priceHistory } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "prices") {
    const prices = await db
      .select()
      .from(priceHistory)
      .orderBy(desc(priceHistory.date));
    return Response.json(prices);
  }

  const allReceipts = await db
    .select()
    .from(receipts)
    .orderBy(desc(receipts.date));
  return Response.json(allReceipts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { date, store, total, items } = body;

  if (!date) {
    return Response.json({ error: "date is required" }, { status: 400 });
  }

  // Insert receipt
  const [receipt] = await db.insert(receipts).values({
    date,
    store: store || null,
    total: total || null,
  }).returning();

  // Insert price history entries
  const priceEntries = [];
  if (items && Array.isArray(items)) {
    for (const item of items) {
      const [entry] = await db.insert(priceHistory).values({
        productName: item.productName,
        price: item.price,
        date,
        store: store || null,
        receiptId: receipt.id,
      }).returning();
      priceEntries.push(entry);
    }
  }

  return Response.json({ receipt, items: priceEntries }, { status: 201 });
}
