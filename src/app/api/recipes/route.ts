import { NextRequest } from "next/server";
import { db } from "@/db";
import { recipes, recipeIngredients } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allRecipes = await db.select().from(recipes);

    const recipesWithIngredients = await Promise.all(
      allRecipes.map(async (recipe) => {
        const ingredients = await db
          .select()
          .from(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, recipe.id));
        return { ...recipe, ingredients };
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, servings, category, ingredients } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const [newRecipe] = await db
      .insert(recipes)
      .values({ name, description, servings, category })
      .returning();

    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        ingredients.map(
          (ing: {
            name: string;
            quantity?: number;
            unit?: string;
            category?: string;
          }) => ({
            recipeId: newRecipe.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
          })
        )
      );
    }

    const savedIngredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, newRecipe.id));

    return Response.json(
      { ...newRecipe, ingredients: savedIngredients },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
