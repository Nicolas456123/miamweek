import { query } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const recipesResult = await query("SELECT * FROM recipes");

    const recipesWithIngredients = await Promise.all(
      recipesResult.rows.map(async (recipe) => {
        const ingredientsResult = await query(
          "SELECT * FROM recipe_ingredients WHERE recipe_id = ?",
          [recipe.id as number]
        );
        return { ...recipe, ingredients: ingredientsResult.rows };
      })
    );

    return Response.json(recipesWithIngredients);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, servings, category, ingredients } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const { prepTime, cookTime, difficulty, utensils, steps } = body;

    const recipeResult = await query(
      "INSERT INTO recipes (name, description, servings, category, prep_time, cook_time, difficulty, utensils, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
      [
        name, description || null, servings || null, category || null,
        prepTime || null, cookTime || null, difficulty || null,
        utensils ? JSON.stringify(utensils) : null,
        steps ? JSON.stringify(steps) : null,
      ]
    );
    const newRecipe = recipeResult.rows[0];

    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      for (const ing of ingredients as {
        name: string;
        quantity?: number;
        unit?: string;
        category?: string;
      }[]) {
        await query(
          "INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?)",
          [
            newRecipe.id as number,
            ing.name,
            ing.quantity ?? null,
            ing.unit || null,
            ing.category || null,
          ]
        );
      }
    }

    const savedIngredientsResult = await query(
      "SELECT * FROM recipe_ingredients WHERE recipe_id = ?",
      [newRecipe.id as number]
    );

    return Response.json(
      { ...newRecipe, ingredients: savedIngredientsResult.rows },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
