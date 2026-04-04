import { NextRequest } from "next/server";
import { db } from "@/db";
import { shoppingItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const weekStart = request.nextUrl.searchParams.get("weekStart");

    if (!weekStart) {
      return Response.json(
        { error: "weekStart query parameter is required" },
        { status: 400 }
      );
    }

    const items = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.weekStart, weekStart));

    return Response.json(items);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch shopping items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart, name, quantity, unit, category } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const [item] = await db
      .insert(shoppingItems)
      .values({
        weekStart,
        name,
        quantity,
        unit,
        category,
        checked: false,
        source: "manual",
      })
      .returning();

    return Response.json(item, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Failed to add shopping item" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, checked } = body;

    if (id === undefined || checked === undefined) {
      return Response.json(
        { error: "id and checked are required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(shoppingItems)
      .set({ checked })
      .where(eq(shoppingItems.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: "Failed to update shopping item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(shoppingItems)
      .where(eq(shoppingItems.id, parseInt(id, 10)))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete shopping item" },
      { status: 500 }
    );
  }
}
