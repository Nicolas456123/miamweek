import { NextRequest } from "next/server";
import { query } from "@/db";

export const runtime = "nodejs";

async function getPreferences(): Promise<string> {
  try {
    const result = await query("SELECT * FROM food_preferences");
    if (result.rows.length === 0) return "";
    const dislikes = result.rows.filter((r) => r.type === "dislike").map((r) => r.name as string);
    const allergies = result.rows.filter((r) => r.type === "allergy").map((r) => r.name as string);
    const loves = result.rows.filter((r) => r.type === "love").map((r) => r.name as string);
    const parts: string[] = [];
    if (allergies.length > 0) parts.push(`ALLERGIES (NE JAMAIS PROPOSER): ${allergies.join(", ")}`);
    if (dislikes.length > 0) parts.push(`N'aime pas: ${dislikes.join(", ")}`);
    if (loves.length > 0) parts.push(`Adore: ${loves.join(", ")}`);
    return parts.length > 0 ? `\n\nPréférences alimentaires:\n${parts.join("\n")}` : "";
  } catch { return ""; }
}

const MOCK_RECIPES = [
  {
    name: "Poulet rôti aux herbes",
    description: "Un classique familial avec du poulet rôti accompagné de pommes de terre.",
    servings: 2,
    category: "Français",
    ingredients: [
      { name: "Poulet", quantity: 800, unit: "g", category: "Viandes & Poissons" },
      { name: "Pommes de terre", quantity: 500, unit: "g", category: "Fruits & Légumes" },
      { name: "Thym frais", quantity: 4, unit: "branches", category: "Fruits & Légumes" },
      { name: "Huile d'olive", quantity: 3, unit: "cs", category: "Épicerie" },
    ],
  },
  {
    name: "Pâtes carbonara",
    description: "La recette italienne authentique.",
    servings: 2,
    category: "Italien",
    ingredients: [
      { name: "Spaghetti", quantity: 200, unit: "g", category: "Épicerie" },
      { name: "Lardons", quantity: 150, unit: "g", category: "Viandes & Poissons" },
      { name: "Oeufs", quantity: 3, unit: "pcs", category: "Produits laitiers" },
      { name: "Parmesan", quantity: 80, unit: "g", category: "Produits laitiers" },
    ],
  },
];

const MOCK_MEALS = [
  { dayOfWeek: 0, mealType: "lunch", name: "Salade César" },
  { dayOfWeek: 0, mealType: "dinner", name: "Poulet rôti aux légumes" },
  { dayOfWeek: 1, mealType: "lunch", name: "Pâtes carbonara" },
  { dayOfWeek: 1, mealType: "dinner", name: "Soupe de légumes" },
  { dayOfWeek: 2, mealType: "lunch", name: "Quiche lorraine" },
  { dayOfWeek: 2, mealType: "dinner", name: "Saumon grillé, riz" },
  { dayOfWeek: 3, mealType: "lunch", name: "Wrap poulet avocat" },
  { dayOfWeek: 3, mealType: "dinner", name: "Risotto aux champignons" },
  { dayOfWeek: 4, mealType: "lunch", name: "Croque-monsieur" },
  { dayOfWeek: 4, mealType: "dinner", name: "Curry de légumes, riz" },
  { dayOfWeek: 5, mealType: "lunch", name: "Burger maison" },
  { dayOfWeek: 5, mealType: "dinner", name: "Pizza maison" },
  { dayOfWeek: 6, mealType: "lunch", name: "Brunch eggs benedict" },
  { dayOfWeek: 6, mealType: "dinner", name: "Ratatouille" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    const isMealPlan = prompt.toLowerCase().includes("planning") || prompt.toLowerCase().includes("semaine complète");
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const prefs = apiKey ? await getPreferences() : "";

    if (!apiKey) {
      if (isMealPlan) {
        return Response.json({ meals: MOCK_MEALS, mock: true });
      }
      return Response.json({ recipes: MOCK_RECIPES, mock: true });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    let systemPrompt: string;

    if (isMealPlan) {
      systemPrompt = `Tu es un chef cuisinier expert en planification de repas.
Génère un planning de repas pour une semaine (lundi=0 à dimanche=6, midi=lunch et soir=dinner).
Réponds UNIQUEMENT avec un JSON valide (sans markdown) de cette forme:
[
  { "dayOfWeek": 0, "mealType": "lunch", "name": "Nom du plat" },
  { "dayOfWeek": 0, "mealType": "dinner", "name": "Nom du plat" }
]
Propose des plats variés, équilibrés, faciles. 14 repas au total.${prefs}`;
    } else {
      systemPrompt = `Tu es un chef cuisinier expert.
Réponds UNIQUEMENT avec un JSON valide (sans markdown) contenant des recettes:
[
  {
    "name": "Nom",
    "description": "Description courte",
    "servings": 2,
    "category": "Type de cuisine",
    "ingredients": [
      { "name": "Ingrédient", "quantity": 100, "unit": "g", "category": "Fruits & Légumes" }
    ]
  }
]
Catégories d'ingrédients: Fruits & Légumes, Viandes & Poissons, Produits laitiers, Boulangerie, Épicerie, Surgelés, Boissons, Hygiène & Maison.
Propose 1 à 3 recettes. Ne réponds qu'avec le JSON.${prefs}`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
      system: systemPrompt,
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return Response.json({ error: "No text response from AI" }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(textContent.text);
    } catch {
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
      }
    }

    if (isMealPlan) {
      return Response.json({ meals: parsed, mock: false });
    }
    return Response.json({ recipes: parsed, mock: false });
  } catch (error) {
    console.error("AI suggest error:", error);
    return Response.json({ error: "Failed to get AI suggestions" }, { status: 500 });
  }
}
