// Script to seed entrée recipes directly into Turso DB
// Run with: npx tsx scripts/seed-entrees.ts

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { query } from "../src/db";

const entrees = [
  {
    name: "Salade verte", description: "Salade simple et fraîche avec vinaigrette maison",
    servings: 2, category: "Entrée", prepTime: 5, cookTime: 0, difficulty: "facile",
    steps: ["Laver et essorer la salade", "Préparer la vinaigrette", "Assaisonner et servir"],
    ingredients: [
      { name: "Mâche", quantity: 150, unit: "g", category: "Fruits & Légumes" },
      { name: "Huile d'olive", quantity: 2, unit: "cl", category: "Épices & Condiments" },
      { name: "Vinaigre balsamique", quantity: 1, unit: "cl", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Salade de tomates", description: "Tomates fraîches assaisonnées à l'huile d'olive et basilic",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 0, difficulty: "facile",
    steps: ["Couper les tomates en rondelles", "Ajouter l'oignon émincé", "Assaisonner"],
    ingredients: [
      { name: "Tomates", quantity: 4, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Oignon rouge", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Basilic frais", quantity: 5, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Huile d'olive", quantity: 2, unit: "cl", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Salade César", description: "Classique avec croûtons, parmesan et sauce César",
    servings: 2, category: "Entrée", prepTime: 15, cookTime: 5, difficulty: "facile",
    steps: ["Laver la romaine", "Préparer les croûtons", "Mélanger la sauce", "Assembler"],
    ingredients: [
      { name: "Laitue romaine", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Parmesan", quantity: 40, unit: "g", category: "Produits laitiers" },
      { name: "Pain de mie", quantity: 2, unit: "pcs", category: "Boulangerie" },
      { name: "Citron", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Huile d'olive", quantity: 3, unit: "cl", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Salade de chèvre chaud", description: "Salade mêlée avec toast de chèvre gratiné et miel",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 5, difficulty: "facile",
    steps: ["Couper le chèvre", "Toaster le pain", "Gratiner", "Dresser avec miel"],
    ingredients: [
      { name: "Mesclun", quantity: 100, unit: "g", category: "Fruits & Légumes" },
      { name: "Bûche de chèvre", quantity: 1, unit: "pcs", category: "Produits laitiers" },
      { name: "Pain de campagne", quantity: 4, unit: "pcs", category: "Boulangerie" },
      { name: "Miel", quantity: 2, unit: "cl", category: "Épices & Condiments" },
      { name: "Noix", quantity: 30, unit: "g", category: "Épicerie" },
    ],
  },
  {
    name: "Soupe à l'oignon", description: "Soupe française gratinée aux oignons caramélisés",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 30, difficulty: "facile",
    steps: ["Caraméliser les oignons", "Ajouter le bouillon", "Gratiner avec fromage"],
    ingredients: [
      { name: "Oignons", quantity: 4, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Beurre", quantity: 30, unit: "g", category: "Produits laitiers" },
      { name: "Bouillon cube", quantity: 1, unit: "pcs", category: "Épicerie" },
      { name: "Gruyère râpé", quantity: 80, unit: "g", category: "Produits laitiers" },
      { name: "Pain", quantity: 4, unit: "pcs", category: "Boulangerie" },
    ],
  },
  {
    name: "Velouté de potiron", description: "Soupe crémeuse au potiron",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 25, difficulty: "facile",
    steps: ["Couper le potiron", "Cuire avec bouillon", "Mixer", "Ajouter la crème"],
    ingredients: [
      { name: "Potiron", quantity: 500, unit: "g", category: "Fruits & Légumes" },
      { name: "Crème fraîche", quantity: 10, unit: "cl", category: "Produits laitiers" },
      { name: "Bouillon cube", quantity: 1, unit: "pcs", category: "Épicerie" },
      { name: "Oignon", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Velouté de carottes", description: "Soupe douce aux carottes et cumin",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 20, difficulty: "facile",
    steps: ["Éplucher les carottes", "Cuire avec l'oignon", "Mixer", "Assaisonner"],
    ingredients: [
      { name: "Carottes", quantity: 500, unit: "g", category: "Fruits & Légumes" },
      { name: "Oignon", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Crème fraîche", quantity: 5, unit: "cl", category: "Produits laitiers" },
      { name: "Cumin", quantity: 1, unit: "pcs", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Bruschetta", description: "Pain grillé garni de tomates, ail et basilic",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 5, difficulty: "facile",
    steps: ["Griller le pain", "Frotter avec l'ail", "Garnir de tomates", "Basilic et huile"],
    ingredients: [
      { name: "Pain ciabatta", quantity: 1, unit: "pcs", category: "Boulangerie" },
      { name: "Tomates", quantity: 3, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Ail", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Basilic frais", quantity: 5, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Œufs mimosa", description: "Œufs durs farcis à la mayonnaise",
    servings: 2, category: "Entrée", prepTime: 15, cookTime: 10, difficulty: "facile",
    steps: ["Cuire les œufs durs", "Couper en deux", "Écraser jaunes avec mayo", "Farcir"],
    ingredients: [
      { name: "Oeufs", quantity: 4, unit: "pcs", category: "Produits laitiers" },
      { name: "Mayonnaise", quantity: 3, unit: "cl", category: "Épices & Condiments" },
      { name: "Ciboulette", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Taboulé", description: "Salade fraîche de semoule à la menthe et citron",
    servings: 2, category: "Entrée", prepTime: 20, cookTime: 0, difficulty: "facile",
    steps: ["Hydrater la semoule", "Couper les légumes", "Hacher herbes", "Mélanger"],
    ingredients: [
      { name: "Semoule fine", quantity: 150, unit: "g", category: "Épicerie" },
      { name: "Tomates", quantity: 3, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Concombre", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Menthe fraîche", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Persil", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Citron", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Houmous maison", description: "Purée de pois chiches au tahini et citron",
    servings: 4, category: "Entrée", prepTime: 10, cookTime: 0, difficulty: "facile",
    steps: ["Égoutter les pois chiches", "Mixer tout", "Servir avec pain pita"],
    ingredients: [
      { name: "Pois chiches", quantity: 400, unit: "g", category: "Épicerie" },
      { name: "Tahini", quantity: 3, unit: "cl", category: "Épicerie" },
      { name: "Citron", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Ail", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Pain pita", quantity: 2, unit: "pcs", category: "Boulangerie" },
    ],
  },
  {
    name: "Gaspacho", description: "Soupe froide de tomates à l'espagnole",
    servings: 2, category: "Entrée", prepTime: 15, cookTime: 0, difficulty: "facile",
    steps: ["Couper les légumes", "Mixer", "Assaisonner", "Réfrigérer 1h"],
    ingredients: [
      { name: "Tomates", quantity: 5, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Concombre", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Poivron rouge", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Ail", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Huile d'olive", quantity: 3, unit: "cl", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Tartare de saumon", description: "Saumon frais en dés avec câpres et aneth",
    servings: 2, category: "Entrée", prepTime: 15, cookTime: 0, difficulty: "moyen",
    steps: ["Couper le saumon en dés", "Mélanger avec échalote et câpres", "Assaisonner"],
    ingredients: [
      { name: "Saumon frais", quantity: 200, unit: "g", category: "Viandes & Poissons" },
      { name: "Échalote", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Câpres", quantity: 1, unit: "cl", category: "Épices & Condiments" },
      { name: "Aneth", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Citron", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Carpaccio de bœuf", description: "Fines tranches de bœuf cru, roquette et parmesan",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 0, difficulty: "facile",
    steps: ["Trancher le bœuf fin", "Disposer sur assiette", "Roquette et parmesan"],
    ingredients: [
      { name: "Bœuf (filet)", quantity: 200, unit: "g", category: "Viandes & Poissons" },
      { name: "Roquette", quantity: 50, unit: "g", category: "Fruits & Légumes" },
      { name: "Parmesan", quantity: 40, unit: "g", category: "Produits laitiers" },
      { name: "Citron", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Salade de lentilles", description: "Salade tiède de lentilles avec vinaigrette",
    servings: 2, category: "Entrée", prepTime: 5, cookTime: 25, difficulty: "facile",
    steps: ["Cuire les lentilles", "Émincer échalotes", "Mélanger", "Servir tiède"],
    ingredients: [
      { name: "Lentilles vertes", quantity: 200, unit: "g", category: "Épicerie" },
      { name: "Échalote", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Moutarde", quantity: 1, unit: "cl", category: "Épices & Condiments" },
      { name: "Huile d'olive", quantity: 3, unit: "cl", category: "Épices & Condiments" },
      { name: "Persil", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Soupe miso", description: "Bouillon japonais au miso, tofu et algues",
    servings: 2, category: "Entrée", prepTime: 5, cookTime: 10, difficulty: "facile",
    steps: ["Chauffer l'eau", "Diluer le miso", "Ajouter tofu et algues"],
    ingredients: [
      { name: "Pâte miso", quantity: 2, unit: "cl", category: "Épicerie" },
      { name: "Tofu", quantity: 100, unit: "g", category: "Épicerie" },
      { name: "Algues wakame", quantity: 5, unit: "g", category: "Épicerie" },
      { name: "Oignon vert", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Melon au jambon", description: "Classique melon frais avec jambon cru",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 0, difficulty: "facile",
    steps: ["Couper le melon", "Enrouler le jambon", "Dresser"],
    ingredients: [
      { name: "Melon", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Jambon cru", quantity: 6, unit: "pcs", category: "Viandes & Poissons" },
    ],
  },
  {
    name: "Avocat aux crevettes", description: "Demi-avocat garni de crevettes et sauce cocktail",
    servings: 2, category: "Entrée", prepTime: 10, cookTime: 0, difficulty: "facile",
    steps: ["Couper les avocats", "Préparer sauce cocktail", "Garnir de crevettes"],
    ingredients: [
      { name: "Avocat", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Crevettes cuites", quantity: 150, unit: "g", category: "Viandes & Poissons" },
      { name: "Mayonnaise", quantity: 2, unit: "cl", category: "Épices & Condiments" },
      { name: "Ketchup", quantity: 1, unit: "cl", category: "Épices & Condiments" },
      { name: "Citron", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Quiche aux poireaux", description: "Tarte salée aux poireaux fondants",
    servings: 4, category: "Entrée", prepTime: 15, cookTime: 35, difficulty: "moyen",
    steps: ["Foncer la pâte", "Faire suer les poireaux", "Appareil crème-œufs", "Cuire au four"],
    ingredients: [
      { name: "Pâte brisée", quantity: 1, unit: "pcs", category: "Épicerie" },
      { name: "Poireaux", quantity: 3, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Crème fraîche", quantity: 20, unit: "cl", category: "Produits laitiers" },
      { name: "Oeufs", quantity: 3, unit: "pcs", category: "Produits laitiers" },
      { name: "Gruyère râpé", quantity: 60, unit: "g", category: "Produits laitiers" },
    ],
  },
  {
    name: "Soupe de poisson", description: "Soupe provençale avec croûtons et rouille",
    servings: 4, category: "Entrée", prepTime: 15, cookTime: 30, difficulty: "moyen",
    steps: ["Revenir les légumes", "Ajouter poisson et fumet", "Mixer", "Servir avec croûtons"],
    ingredients: [
      { name: "Poisson blanc", quantity: 400, unit: "g", category: "Viandes & Poissons" },
      { name: "Tomates", quantity: 3, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Oignon", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Ail", quantity: 3, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Fenouil", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
];

async function seed() {
  console.log(`Seeding ${entrees.length} entrée recipes...`);

  for (const e of entrees) {
    try {
      // Check if recipe already exists
      const existing = await query("SELECT id FROM recipes WHERE name = ?", [e.name]);
      if (existing.rows.length > 0) {
        console.log(`  → ${e.name} (déjà existant, ignoré)`);
        continue;
      }

      const result = await query(
        "INSERT INTO recipes (name, description, servings, category, prep_time, cook_time, difficulty, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
        [e.name, e.description, e.servings, e.category, e.prepTime, e.cookTime, e.difficulty, JSON.stringify(e.steps)]
      );
      const recipeId = result.rows[0].id as number;

      for (const ing of e.ingredients) {
        await query(
          "INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?)",
          [recipeId, ing.name, ing.quantity, ing.unit, ing.category]
        );
      }
      console.log(`  ✓ ${e.name} (id: ${recipeId}, ${e.ingredients.length} ingrédients)`);
    } catch (err) {
      console.log(`  ✗ ${e.name}: ${err}`);
    }
  }
  console.log("Done!");
}

seed();
