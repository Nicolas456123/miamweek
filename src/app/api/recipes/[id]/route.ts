import { NextRequest } from "next/server";
import { query } from "@/db";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);

    const recipeResult = await query(
      "SELECT * FROM recipes WHERE id = ?",
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    const recipe = recipeResult.rows[0];
    const ingredientsResult = await query(
      "SELECT * FROM recipe_ingredients WHERE recipe_id = ?",
      [recipeId]
    );

    return Response.json({ ...recipe, ingredients: ingredientsResult.rows });
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
    const { name, description, servings, category, ingredients, prepTime, cookTime, difficulty, utensils, steps } = body;

    const updateResult = await query(
      "UPDATE recipes SET name = ?, description = ?, servings = ?, category = ?, prep_time = ?, cook_time = ?, difficulty = ?, utensils = ?, steps = ? WHERE id = ? RETURNING *",
      [
        name, description || null, servings || null, category || null,
        prepTime || null, cookTime || null, difficulty || null,
        utensils ? JSON.stringify(utensils) : null,
        steps ? JSON.stringify(steps) : null,
        recipeId,
      ]
    );

    if (updateResult.rows.length === 0) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    const updated = updateResult.rows[0];

    if (ingredients && Array.isArray(ingredients)) {
      // Delete existing ingredients and replace with new ones
      await query(
        "DELETE FROM recipe_ingredients WHERE recipe_id = ?",
        [recipeId]
      );

      if (ingredients.length > 0) {
        for (const ing of ingredients as {
          name: string;
          quantity?: number;
          unit?: string;
          category?: string;
        }[]) {
          await query(
            "INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?)",
            [
              recipeId,
              ing.name,
              ing.quantity ?? null,
              ing.unit || null,
              ing.category || null,
            ]
          );
        }
      }
    }

    const savedIngredientsResult = await query(
      "SELECT * FROM recipe_ingredients WHERE recipe_id = ?",
      [recipeId]
    );

    return Response.json({ ...updated, ingredients: savedIngredientsResult.rows });
  } catch (error) {
    return Response.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    const body = await request.json();
    const { photo_url, photo_credit } = body;

    const updateResult = await query(
      "UPDATE recipes SET photo_url = ?, photo_credit = ? WHERE id = ? RETURNING *",
      [photo_url || null, photo_credit || null, recipeId]
    );

    if (updateResult.rows.length === 0) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    return Response.json(updateResult.rows[0]);
  } catch {
    return Response.json(
      { error: "Failed to patch recipe" },
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

    const deleteResult = await query(
      "DELETE FROM recipes WHERE id = ? RETURNING *",
      [recipeId]
    );

    if (deleteResult.rows.length === 0) {
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
