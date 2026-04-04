import { NextRequest } from "next/server";
import { db } from "@/db";
import { mealPlan, recipeIngredients, shoppingItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart } = body;

    if (!weekStart) {
      return Response.json(
        { error: "weekStart is required" },
        { status: 400 }
      );
    }

    // Get all meals for the week that have a recipeId
    const meals = await db
      .select()
      .from(mealPlan)
      .where(eq(mealPlan.weekStart, weekStart));

    const recipeIds = meals
      .map((m) => m.recipeId)
      .filter((id): id is number => id !== null);

    if (recipeIds.length === 0) {
      return Response.json({
        message: "No recipes in meal plan for this week",
        items: [],
      });
    }

    // Fetch all ingredients for those recipes
    const allIngredients: {
      name: string;
      quantity: number | null;
      unit: string | null;
      category: string | null;
    }[] = [];

    for (const recipeId of recipeIds) {
      const ingredients = await db
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId));
      allIngredients.push(...ingredients);
    }

    // Aggregate ingredients by name + unit
    const aggregated = new Map<
      string,
      { name: string; quantity: number; unit: string | null; category: string | null }
    >();

    for (const ing of allIngredients) {
      const key = `${ing.name.toLowerCase()}||${(ing.unit ?? "").toLowerCase()}`;
      const existing = aggregated.get(key);
      if (existing) {
        existing.quantity += ing.quantity ?? 0;
      } else {
        aggregated.set(key, {
          name: ing.name,
          quantity: ing.quantity ?? 0,
          unit: ing.unit,
          category: ing.category,
        });
      }
    }

    // Delete existing auto-generated items for this week
    const existingAutoItems = await db
      .select()
      .from(shoppingItems)
      .where(
        and(
          eq(shoppingItems.weekStart, weekStart),
          eq(shoppingItems.source, "auto")
        )
      );

    for (const item of existingAutoItems) {
      await db.delete(shoppingItems).where(eq(shoppingItems.id, item.id));
    }

    // Insert aggregated ingredients as shopping items
    const newItems = Array.from(aggregated.values());

    if (newItems.length > 0) {
      await db.insert(shoppingItems).values(
        newItems.map((item) => ({
          weekStart,
          name: item.name,
          quantity: item.quantity || null,
          unit: item.unit,
          category: item.category,
          checked: false,
          source: "auto" as const,
        }))
      );
    }

    // Return the full shopping list for the week
    const items = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.weekStart, weekStart));

    return Response.json({ items });
  } catch (error) {
    return Response.json(
      { error: "Failed to generate shopping list" },
      { status: 500 }
    );
  }
}
