import { db } from "@/db";
import { listItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (status) {
    const items = await db
      .select()
      .from(listItems)
      .where(eq(listItems.listStatus, status));
    return Response.json(items);
  }

  const items = await db.select().from(listItems);
  return Response.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, productName, quantity, unit, category, source, listStatus } = body;

  if (!productName) {
    return Response.json({ error: "productName is required" }, { status: 400 });
  }

  const result = await db.insert(listItems).values({
    productId: productId || null,
    productName,
    quantity: quantity || null,
    unit: unit || null,
    category: category || null,
    source: source || "manual",
    listStatus: listStatus || "prep",
  }).returning();

  return Response.json(result[0], { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, checked, quantity, listStatus } = body;

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (checked !== undefined) {
    updates.checked = checked;
    if (checked === true) {
      updates.checkedAt = new Date().toISOString();
    }
  }
  if (quantity !== undefined) updates.quantity = quantity;
  if (listStatus !== undefined) updates.listStatus = listStatus;

  const result = await db
    .update(listItems)
    .set(updates)
    .where(eq(listItems.id, id))
    .returning();

  if (result.length === 0) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  return Response.json(result[0]);
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  await db.delete(listItems).where(eq(listItems.id, id));
  return Response.json({ success: true });
}
