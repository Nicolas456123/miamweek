import { NextRequest } from "next/server";
import { db } from "@/db";
import { recipes, recipeIngredients } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);

    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId));

    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    const ingredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));

    return Response.json({ ...recipe, ingredients });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    const body = await request.json();
    const { name, description, servings, category, ingredients } = body;

    const [updated] = await db
      .update(recipes)
      .set({ name, description, servings, category })
      .where(eq(recipes.id, recipeId))
      .returning();

    if (!updated) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (ingredients && Array.isArray(ingredients)) {
      // Delete existing ingredients and replace with new ones
      await db
        .delete(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId));

      if (ingredients.length > 0) {
        await db.insert(recipeIngredients).values(
          ingredients.map(
            (ing: {
              name: string;
              quantity?: number;
              unit?: string;
              category?: string;
            }) => ({
              recipeId: recipeId,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              category: ing.category,
            })
          )
        );
      }
    }

    const savedIngredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));

    return Response.json({ ...updated, ingredients: savedIngredients });
  } catch (error) {
    return Response.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);

    const [deleted] = await db
      .delete(recipes)
      .where(eq(recipes.id, recipeId))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
