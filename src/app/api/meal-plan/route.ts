import { NextRequest } from "next/server";
import { query } from "@/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const weekStart = request.nextUrl.searchParams.get("weekStart");

    if (!weekStart) {
      return Response.json(
        { error: "weekStart query parameter is required" },
        { status: 400 }
      );
    }

    const result = await query(
      "SELECT * FROM meal_plan WHERE week_start = ?",
      [weekStart]
    );

    return Response.json(result.rows);
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

    const result = await query(
      "INSERT INTO meal_plan (week_start, day_of_week, meal_type, recipe_id, custom_name) VALUES (?, ?, ?, ?, ?) RETURNING *",
      [weekStart, dayOfWeek, mealType, recipeId || null, customName || null]
    );

    return Response.json(result.rows[0], { status: 201 });
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

    const result = await query(
      "DELETE FROM meal_plan WHERE id = ? RETURNING *",
      [parseInt(id, 10)]
    );

    if (result.rows.length === 0) {
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
