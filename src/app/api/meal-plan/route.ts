import { NextRequest } from "next/server";
import { db } from "@/db";
import { mealPlan } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const weekStart = request.nextUrl.searchParams.get("weekStart");

    if (!weekStart) {
      return Response.json(
        { error: "weekStart query parameter is required" },
        { status: 400 }
      );
    }

    const meals = await db
      .select()
      .from(mealPlan)
      .where(eq(mealPlan.weekStart, weekStart));

    return Response.json(meals);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch meal plan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart, dayOfWeek, mealType, recipeId, customName } = body;

    if (!weekStart || dayOfWeek === undefined || !mealType) {
      return Response.json(
        { error: "weekStart, dayOfWeek, and mealType are required" },
        { status: 400 }
      );
    }

    const [meal] = await db
      .insert(mealPlan)
      .values({ weekStart, dayOfWeek, mealType, recipeId, customName })
      .returning();

    return Response.json(meal, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Failed to add meal to plan" },
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
      .delete(mealPlan)
      .where(eq(mealPlan.id, parseInt(id, 10)))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Meal not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to remove meal from plan" },
      { status: 500 }
    );
  }
}
