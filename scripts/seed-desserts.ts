import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { query } from "../src/db";

const desserts = [
  {
    name: "Mousse au chocolat", description: "Mousse légère et aérienne au chocolat noir",
    servings: 4, category: "Dessert", prepTime: 20, cookTime: 0, difficulty: "moyen",
    steps: ["Fondre le chocolat", "Séparer blancs et jaunes", "Mélanger jaunes au chocolat", "Monter blancs en neige", "Incorporer délicatement", "Réfrigérer 4h"],
    ingredients: [
      { name: "Chocolat noir", quantity: 200, unit: "g", category: "Épicerie" },
      { name: "Oeufs", quantity: 6, unit: "pcs", category: "Produits laitiers" },
      { name: "Sucre", quantity: 30, unit: "g", category: "Épicerie" },
    ],
  },
  {
    name: "Crème brûlée", description: "Crème vanillée avec croûte de sucre caramélisé",
    servings: 4, category: "Dessert", prepTime: 15, cookTime: 40, difficulty: "moyen",
    steps: ["Chauffer la crème avec vanille", "Mélanger jaunes et sucre", "Verser la crème", "Cuire au bain-marie", "Réfrigérer", "Caraméliser au chalumeau"],
    ingredients: [
      { name: "Crème fraîche", quantity: 50, unit: "cl", category: "Produits laitiers" },
      { name: "Oeufs", quantity: 4, unit: "pcs", category: "Produits laitiers" },
      { name: "Sucre", quantity: 80, unit: "g", category: "Épicerie" },
      { name: "Vanille", quantity: 1, unit: "pcs", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Tarte aux pommes", description: "Tarte classique aux pommes fondantes",
    servings: 6, category: "Dessert", prepTime: 20, cookTime: 35, difficulty: "facile",
    steps: ["Foncer la pâte", "Éplucher et couper les pommes", "Disposer sur la pâte", "Saupoudrer de sucre", "Cuire au four 180°C"],
    ingredients: [
      { name: "Pâte brisée", quantity: 1, unit: "pcs", category: "Épicerie" },
      { name: "Pommes", quantity: 6, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Sucre", quantity: 60, unit: "g", category: "Épicerie" },
      { name: "Beurre", quantity: 30, unit: "g", category: "Produits laitiers" },
      { name: "Cannelle", quantity: 1, unit: "pcs", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Fondant au chocolat", description: "Gâteau au chocolat au cœur coulant",
    servings: 4, category: "Dessert", prepTime: 15, cookTime: 12, difficulty: "moyen",
    steps: ["Fondre chocolat et beurre", "Mélanger oeufs et sucre", "Incorporer farine", "Cuire 12 min à 200°C"],
    ingredients: [
      { name: "Chocolat noir", quantity: 200, unit: "g", category: "Épicerie" },
      { name: "Beurre", quantity: 100, unit: "g", category: "Produits laitiers" },
      { name: "Oeufs", quantity: 3, unit: "pcs", category: "Produits laitiers" },
      { name: "Sucre", quantity: 80, unit: "g", category: "Épicerie" },
      { name: "Farine", quantity: 30, unit: "g", category: "Épicerie" },
    ],
  },
  {
    name: "Panna cotta", description: "Crème italienne à la vanille avec coulis de fruits rouges",
    servings: 4, category: "Dessert", prepTime: 10, cookTime: 5, difficulty: "facile",
    steps: ["Chauffer la crème avec vanille", "Ajouter la gélatine", "Verser dans les ramequins", "Réfrigérer 4h", "Servir avec coulis"],
    ingredients: [
      { name: "Crème fraîche", quantity: 40, unit: "cl", category: "Produits laitiers" },
      { name: "Lait", quantity: 10, unit: "cl", category: "Produits laitiers" },
      { name: "Sucre", quantity: 50, unit: "g", category: "Épicerie" },
      { name: "Gélatine", quantity: 2, unit: "pcs", category: "Épicerie" },
      { name: "Fruits rouges", quantity: 150, unit: "g", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Tiramisu", description: "Dessert italien café-mascarpone",
    servings: 6, category: "Dessert", prepTime: 25, cookTime: 0, difficulty: "moyen",
    steps: ["Préparer le café", "Mélanger jaunes, sucre et mascarpone", "Monter les blancs", "Incorporer", "Tremper les biscuits", "Alterner couches", "Réfrigérer 6h"],
    ingredients: [
      { name: "Mascarpone", quantity: 500, unit: "g", category: "Produits laitiers" },
      { name: "Oeufs", quantity: 4, unit: "pcs", category: "Produits laitiers" },
      { name: "Sucre", quantity: 100, unit: "g", category: "Épicerie" },
      { name: "Café moulu", quantity: 3, unit: "cl", category: "Boissons" },
      { name: "Biscuits cuillère", quantity: 24, unit: "pcs", category: "Épicerie" },
      { name: "Cacao en poudre", quantity: 20, unit: "g", category: "Épicerie" },
    ],
  },
  {
    name: "Salade de fruits", description: "Mélange de fruits frais de saison",
    servings: 4, category: "Dessert", prepTime: 15, cookTime: 0, difficulty: "facile",
    steps: ["Laver et couper les fruits", "Ajouter le jus de citron", "Sucrer légèrement", "Réfrigérer"],
    ingredients: [
      { name: "Pommes", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Banane", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Orange", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Kiwi", quantity: 2, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Citron", quantity: 1, unit: "pcs", category: "Fruits & Légumes" },
    ],
  },
  {
    name: "Crêpes", description: "Crêpes fines sucrées à garnir",
    servings: 4, category: "Dessert", prepTime: 10, cookTime: 15, difficulty: "facile",
    steps: ["Mélanger farine, oeufs, lait", "Laisser reposer 30 min", "Cuire les crêpes une par une", "Garnir au choix"],
    ingredients: [
      { name: "Farine", quantity: 250, unit: "g", category: "Épicerie" },
      { name: "Oeufs", quantity: 3, unit: "pcs", category: "Produits laitiers" },
      { name: "Lait", quantity: 50, unit: "cl", category: "Produits laitiers" },
      { name: "Beurre", quantity: 30, unit: "g", category: "Produits laitiers" },
      { name: "Sucre", quantity: 30, unit: "g", category: "Épicerie" },
    ],
  },
  {
    name: "Compote de pommes", description: "Compote maison simple et douce",
    servings: 4, category: "Dessert", prepTime: 10, cookTime: 20, difficulty: "facile",
    steps: ["Éplucher les pommes", "Couper en morceaux", "Cuire avec sucre et cannelle", "Écraser ou mixer"],
    ingredients: [
      { name: "Pommes", quantity: 6, unit: "pcs", category: "Fruits & Légumes" },
      { name: "Sucre", quantity: 40, unit: "g", category: "Épicerie" },
      { name: "Cannelle", quantity: 1, unit: "pcs", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Gâteau au yaourt", description: "Le classique gâteau simple et moelleux",
    servings: 6, category: "Dessert", prepTime: 10, cookTime: 30, difficulty: "facile",
    steps: ["Mélanger yaourt, sucre, oeufs", "Ajouter farine et levure", "Verser dans un moule", "Cuire 30 min à 180°C"],
    ingredients: [
      { name: "Yaourt nature", quantity: 1, unit: "pcs", category: "Produits laitiers" },
      { name: "Oeufs", quantity: 3, unit: "pcs", category: "Produits laitiers" },
      { name: "Sucre", quantity: 150, unit: "g", category: "Épicerie" },
      { name: "Farine", quantity: 250, unit: "g", category: "Épicerie" },
      { name: "Levure chimique", quantity: 1, unit: "pcs", category: "Épicerie" },
      { name: "Huile", quantity: 5, unit: "cl", category: "Épicerie" },
    ],
  },
  {
    name: "Île flottante", description: "Blancs en neige pochés sur crème anglaise",
    servings: 4, category: "Dessert", prepTime: 20, cookTime: 15, difficulty: "moyen",
    steps: ["Préparer la crème anglaise", "Monter les blancs en neige", "Pocher les blancs", "Dresser", "Napper de caramel"],
    ingredients: [
      { name: "Oeufs", quantity: 4, unit: "pcs", category: "Produits laitiers" },
      { name: "Lait", quantity: 50, unit: "cl", category: "Produits laitiers" },
      { name: "Sucre", quantity: 120, unit: "g", category: "Épicerie" },
      { name: "Vanille", quantity: 1, unit: "pcs", category: "Épices & Condiments" },
    ],
  },
  {
    name: "Clafoutis aux cerises", description: "Flan aux cerises du Limousin",
    servings: 6, category: "Dessert", prepTime: 15, cookTime: 35, difficulty: "facile",
    steps: ["Beurrer le moule", "Disposer les cerises", "Préparer la pâte", "Verser et cuire"],
    ingredients: [
      { name: "Cerises", quantity: 500, unit: "g", category: "Fruits & Légumes" },
      { name: "Oeufs", quantity: 3, unit: "pcs", category: "Produits laitiers" },
      { name: "Farine", quantity: 80, unit: "g", category: "Épicerie" },
      { name: "Lait", quantity: 25, unit: "cl", category: "Produits laitiers" },
      { name: "Sucre", quantity: 80, unit: "g", category: "Épicerie" },
      { name: "Beurre", quantity: 20, unit: "g", category: "Produits laitiers" },
    ],
  },
];

async function seed() {
  console.log(`Seeding ${desserts.length} dessert recipes...`);
  for (const e of desserts) {
    try {
      const existing = await query("SELECT id FROM recipes WHERE name = ?", [e.name]);
      if (existing.rows.length > 0) { console.log(`  → ${e.name} (existe déjà)`); continue; }
      const result = await query(
        "INSERT INTO recipes (name, description, servings, category, prep_time, cook_time, difficulty, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
        [e.name, e.description, e.servings, e.category, e.prepTime, e.cookTime, e.difficulty, JSON.stringify(e.steps)]
      );
      const id = result.rows[0].id as number;
      for (const ing of e.ingredients) {
        await query("INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?)",
          [id, ing.name, ing.quantity, ing.unit, ing.category]);
      }
      console.log(`  ✓ ${e.name} (id: ${id})`);
    } catch (err) { console.log(`  ✗ ${e.name}: ${err}`); }
  }
  console.log("Done!");
}
seed();
