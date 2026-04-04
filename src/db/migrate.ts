import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface ProductSeed {
  name: string;
  category: string;
  defaultUnit: string;
  icon: string;
}

const PRODUCTS: ProductSeed[] = [
  // ── Fruits & Légumes (~25) ────────────────────────────────────────
  { name: "Pommes", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🍎" },
  { name: "Bananes", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🍌" },
  { name: "Oranges", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🍊" },
  { name: "Citrons", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🍋" },
  { name: "Fraises", category: "Fruits & Légumes", defaultUnit: "g", icon: "🍓" },
  { name: "Tomates", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🍅" },
  { name: "Carottes", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🥕" },
  { name: "Oignons", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🧅" },
  { name: "Ail", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🧄" },
  { name: "Pommes de terre", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🥔" },
  { name: "Courgettes", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥒" },
  { name: "Aubergines", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🍆" },
  { name: "Poivrons", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🫑" },
  { name: "Concombre", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥒" },
  { name: "Salade", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥬" },
  { name: "Champignons", category: "Fruits & Légumes", defaultUnit: "g", icon: "🍄" },
  { name: "Brocoli", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥦" },
  { name: "Haricots verts", category: "Fruits & Légumes", defaultUnit: "g", icon: "🫘" },
  { name: "Petits pois", category: "Fruits & Légumes", defaultUnit: "g", icon: "🫛" },
  { name: "Épinards", category: "Fruits & Légumes", defaultUnit: "g", icon: "🥬" },
  { name: "Avocat", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥑" },
  { name: "Mangue", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥭" },
  { name: "Ananas", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🍍" },
  { name: "Poireaux", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥬" },
  { name: "Chou", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥬" },

  // ── Viandes & Poissons (~15) ──────────────────────────────────────
  { name: "Poulet (filets)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🍗" },
  { name: "Poulet (entier)", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🍗" },
  { name: "Steak haché", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🥩" },
  { name: "Boeuf (bavette)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🥩" },
  { name: "Porc (côtes)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🥩" },
  { name: "Lardons", category: "Viandes & Poissons", defaultUnit: "g", icon: "🥓" },
  { name: "Jambon", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🍖" },
  { name: "Saucisses", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🌭" },
  { name: "Saumon", category: "Viandes & Poissons", defaultUnit: "g", icon: "🐟" },
  { name: "Cabillaud", category: "Viandes & Poissons", defaultUnit: "g", icon: "🐟" },
  { name: "Crevettes", category: "Viandes & Poissons", defaultUnit: "g", icon: "🦐" },
  { name: "Thon (frais)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🐟" },
  { name: "Dinde", category: "Viandes & Poissons", defaultUnit: "g", icon: "🍗" },
  { name: "Merguez", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🌭" },
  { name: "Agneau", category: "Viandes & Poissons", defaultUnit: "g", icon: "🍖" },

  // ── Produits laitiers (~15) ───────────────────────────────────────
  { name: "Lait", category: "Produits laitiers", defaultUnit: "L", icon: "🥛" },
  { name: "Beurre", category: "Produits laitiers", defaultUnit: "g", icon: "🧈" },
  { name: "Crème fraîche", category: "Produits laitiers", defaultUnit: "mL", icon: "🥛" },
  { name: "Yaourts nature", category: "Produits laitiers", defaultUnit: "lot", icon: "🥛" },
  { name: "Fromage râpé", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Comté", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Camembert", category: "Produits laitiers", defaultUnit: "pcs", icon: "🧀" },
  { name: "Mozzarella", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Parmesan", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Oeufs", category: "Produits laitiers", defaultUnit: "lot", icon: "🥚" },
  { name: "Crème liquide", category: "Produits laitiers", defaultUnit: "mL", icon: "🥛" },
  { name: "Fromage blanc", category: "Produits laitiers", defaultUnit: "g", icon: "🥛" },
  { name: "Chèvre frais", category: "Produits laitiers", defaultUnit: "pcs", icon: "🧀" },
  { name: "Mascarpone", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Ricotta", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },

  // ── Boulangerie (~8) ─────────────────────────────────────────────
  { name: "Pain de mie", category: "Boulangerie", defaultUnit: "pcs", icon: "🍞" },
  { name: "Baguette", category: "Boulangerie", defaultUnit: "pcs", icon: "🥖" },
  { name: "Croissants", category: "Boulangerie", defaultUnit: "pcs", icon: "🥐" },
  { name: "Pain complet", category: "Boulangerie", defaultUnit: "pcs", icon: "🍞" },
  { name: "Brioche", category: "Boulangerie", defaultUnit: "pcs", icon: "🍞" },
  { name: "Wraps/Tortillas", category: "Boulangerie", defaultUnit: "lot", icon: "🫓" },
  { name: "Pain burger", category: "Boulangerie", defaultUnit: "lot", icon: "🍔" },
  { name: "Biscottes", category: "Boulangerie", defaultUnit: "pcs", icon: "🍞" },

  // ── Épicerie (~25) ───────────────────────────────────────────────
  { name: "Pâtes", category: "Épicerie", defaultUnit: "g", icon: "🍝" },
  { name: "Riz", category: "Épicerie", defaultUnit: "g", icon: "🍚" },
  { name: "Semoule", category: "Épicerie", defaultUnit: "g", icon: "🌾" },
  { name: "Farine", category: "Épicerie", defaultUnit: "g", icon: "🌾" },
  { name: "Sucre", category: "Épicerie", defaultUnit: "g", icon: "🍬" },
  { name: "Sel", category: "Épicerie", defaultUnit: "g", icon: "🧂" },
  { name: "Poivre", category: "Épicerie", defaultUnit: "g", icon: "🌶️" },
  { name: "Huile d'olive", category: "Épicerie", defaultUnit: "L", icon: "🫒" },
  { name: "Huile tournesol", category: "Épicerie", defaultUnit: "L", icon: "🌻" },
  { name: "Vinaigre", category: "Épicerie", defaultUnit: "mL", icon: "🍶" },
  { name: "Moutarde", category: "Épicerie", defaultUnit: "pcs", icon: "🟡" },
  { name: "Ketchup", category: "Épicerie", defaultUnit: "pcs", icon: "🍅" },
  { name: "Mayonnaise", category: "Épicerie", defaultUnit: "pcs", icon: "🥚" },
  { name: "Sauce tomate", category: "Épicerie", defaultUnit: "boîte", icon: "🍅" },
  { name: "Concentré de tomates", category: "Épicerie", defaultUnit: "boîte", icon: "🍅" },
  { name: "Lentilles", category: "Épicerie", defaultUnit: "g", icon: "🫘" },
  { name: "Pois chiches", category: "Épicerie", defaultUnit: "boîte", icon: "🫘" },
  { name: "Conserves de thon", category: "Épicerie", defaultUnit: "boîte", icon: "🐟" },
  { name: "Conserves de maïs", category: "Épicerie", defaultUnit: "boîte", icon: "🌽" },
  { name: "Olives", category: "Épicerie", defaultUnit: "boîte", icon: "🫒" },
  { name: "Chocolat", category: "Épicerie", defaultUnit: "g", icon: "🍫" },
  { name: "Café", category: "Épicerie", defaultUnit: "g", icon: "☕" },
  { name: "Thé", category: "Épicerie", defaultUnit: "boîte", icon: "🍵" },
  { name: "Miel", category: "Épicerie", defaultUnit: "pcs", icon: "🍯" },
  { name: "Confiture", category: "Épicerie", defaultUnit: "pcs", icon: "🍓" },

  // ── Surgelés (~8) ────────────────────────────────────────────────
  { name: "Pizza surgelée", category: "Surgelés", defaultUnit: "pcs", icon: "🍕" },
  { name: "Légumes surgelés", category: "Surgelés", defaultUnit: "g", icon: "🥦" },
  { name: "Frites", category: "Surgelés", defaultUnit: "g", icon: "🍟" },
  { name: "Poisson pané", category: "Surgelés", defaultUnit: "pcs", icon: "🐟" },
  { name: "Glaces", category: "Surgelés", defaultUnit: "pcs", icon: "🍦" },
  { name: "Fruits surgelés", category: "Surgelés", defaultUnit: "g", icon: "🍓" },
  { name: "Nuggets", category: "Surgelés", defaultUnit: "g", icon: "🍗" },
  { name: "Épinards surgelés", category: "Surgelés", defaultUnit: "g", icon: "🥬" },

  // ── Boissons (~10) ───────────────────────────────────────────────
  { name: "Eau plate", category: "Boissons", defaultUnit: "L", icon: "💧" },
  { name: "Eau gazeuse", category: "Boissons", defaultUnit: "L", icon: "💧" },
  { name: "Jus d'orange", category: "Boissons", defaultUnit: "L", icon: "🍊" },
  { name: "Coca-Cola", category: "Boissons", defaultUnit: "L", icon: "🥤" },
  { name: "Bière", category: "Boissons", defaultUnit: "lot", icon: "🍺" },
  { name: "Vin rouge", category: "Boissons", defaultUnit: "pcs", icon: "🍷" },
  { name: "Vin blanc", category: "Boissons", defaultUnit: "pcs", icon: "🥂" },
  { name: "Lait d'amande", category: "Boissons", defaultUnit: "L", icon: "🥛" },
  { name: "Sirop", category: "Boissons", defaultUnit: "pcs", icon: "🍹" },
  { name: "Café moulu", category: "Boissons", defaultUnit: "g", icon: "☕" },

  // ── Hygiène & Beauté (~15) ───────────────────────────────────────
  { name: "Savon", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🧼" },
  { name: "Gel douche", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🚿" },
  { name: "Shampoing", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🧴" },
  { name: "Dentifrice", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🪥" },
  { name: "Brosse à dents", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🪥" },
  { name: "Déodorant", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🧴" },
  { name: "Cotons", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🩹" },
  { name: "Mouchoirs", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🤧" },
  { name: "Papier toilette", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🧻" },
  { name: "Rasoirs", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🪒" },
  { name: "Crème hydratante", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🧴" },
  { name: "Serviettes hygiéniques", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🩹" },
  { name: "Lessive (capsules)", category: "Hygiène & Beauté", defaultUnit: "boîte", icon: "🧺" },
  { name: "Lingettes bébé", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "👶" },
  { name: "Couches", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "👶" },

  // ── Entretien & Maison (~15) ─────────────────────────────────────
  { name: "Sopalin", category: "Entretien & Maison", defaultUnit: "lot", icon: "🧻" },
  { name: "Éponges", category: "Entretien & Maison", defaultUnit: "lot", icon: "🧽" },
  { name: "Liquide vaisselle", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🧴" },
  { name: "Produit multi-surfaces", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🧹" },
  { name: "Javel", category: "Entretien & Maison", defaultUnit: "L", icon: "🧪" },
  { name: "Sacs poubelle", category: "Entretien & Maison", defaultUnit: "lot", icon: "🗑️" },
  { name: "Film alimentaire", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🎞️" },
  { name: "Papier aluminium", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🔲" },
  { name: "Lessive", category: "Entretien & Maison", defaultUnit: "L", icon: "🧺" },
  { name: "Adoucissant", category: "Entretien & Maison", defaultUnit: "L", icon: "🌸" },
  { name: "Produit vitres", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🪟" },
  { name: "Balai/serpillère (recharge)", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🧹" },
  { name: "Désodorisant", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🌿" },
  { name: "Produit WC", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🚽" },
  { name: "Pastilles lave-vaisselle", category: "Entretien & Maison", defaultUnit: "boîte", icon: "💊" },

  // ── Épices & Condiments (~10) ────────────────────────────────────
  { name: "Herbes de Provence", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌿" },
  { name: "Curry", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🟡" },
  { name: "Paprika", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌶️" },
  { name: "Cumin", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🟤" },
  { name: "Cannelle", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🟤" },
  { name: "Basilic sec", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌿" },
  { name: "Persil sec", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌿" },
  { name: "Sauce soja", category: "Épices & Condiments", defaultUnit: "mL", icon: "🍶" },
  { name: "Bouillon cube", category: "Épices & Condiments", defaultUnit: "boîte", icon: "🧊" },
  { name: "Levure", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🍞" },
];

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

async function migrate() {
  console.log("Creating tables...");

  // Create all tables (old + new)
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      servings INTEGER DEFAULT 2,
      category TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS meal_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
      custom_name TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_unit TEXT NOT NULL,
      icon TEXT,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      category TEXT,
      checked INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manual',
      list_status TEXT DEFAULT 'prep',
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      checked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      last_purchased TEXT,
      avg_frequency_days REAL,
      status TEXT DEFAULT 'ok',
      next_estimated TEXT
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      store TEXT,
      total REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      store TEXT,
      receipt_id INTEGER REFERENCES receipts(id) ON DELETE SET NULL
    );
  `);

  console.log("Tables created successfully!");

  // Seed product catalog
  const existing = await client.execute("SELECT COUNT(*) as count FROM products");
  if (Number(existing.rows[0].count) === 0) {
    console.log(`Seeding ${PRODUCTS.length} products...`);

    for (const p of PRODUCTS) {
      await client.execute({
        sql: "INSERT INTO products (name, category, default_unit, icon, is_custom) VALUES (?, ?, ?, ?, 0)",
        args: [p.name, p.category, p.defaultUnit, p.icon],
      });
    }

    console.log("Product catalog seeded!");
  } else {
    console.log("Products already exist, skipping seed.");
  }

  // Step 2: Add sort_order column and fix units
  console.log("Updating sort_order and units...");

  // Add sort_order column if not exists
  try {
    await client.execute("ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 100");
  } catch { /* column already exists */ }

  // Fix inconsistent units
  const unitFixes = [
    // Épices: pcs → pot
    ["Herbes de Provence", "pot"], ["Curry", "pot"], ["Paprika", "pot"],
    ["Cumin", "pot"], ["Cannelle", "pot"], ["Basilic sec", "pot"], ["Persil sec", "pot"],
    // Levure
    ["Levure", "sachet"],
    // Condiments: pcs → flacon
    ["Moutarde", "flacon"], ["Ketchup", "flacon"], ["Mayonnaise", "flacon"],
    // Pots
    ["Miel", "pot"], ["Confiture", "pot"],
    // Bouteilles
    ["Vin rouge", "bout."], ["Vin blanc", "bout."], ["Sirop", "bout."],
    // Hygiène/Entretien: pcs → flacon
    ["Savon", "flacon"], ["Gel douche", "flacon"], ["Shampoing", "flacon"],
    ["Dentifrice", "tube"], ["Déodorant", "flacon"], ["Crème hydratante", "tube"],
    ["Liquide vaisselle", "flacon"], ["Produit multi-surfaces", "flacon"],
    ["Produit vitres", "flacon"], ["Désodorisant", "flacon"], ["Produit WC", "flacon"],
    // Rouleaux
    ["Film alimentaire", "roul."], ["Papier aluminium", "roul."],
  ];
  for (const [name, unit] of unitFixes) {
    await client.execute({ sql: "UPDATE products SET default_unit = ? WHERE name = ?", args: [unit, name] });
  }

  // Set sort_order by popularity (lower = more common)
  // Within each category, most frequently bought items first
  const sortOrders: Record<string, string[]> = {
    "Fruits & Légumes": ["Tomates", "Pommes de terre", "Oignons", "Carottes", "Bananes", "Pommes", "Salade", "Courgettes", "Poivrons", "Concombre", "Ail", "Champignons", "Citrons", "Haricots verts", "Épinards", "Brocoli", "Oranges", "Aubergines", "Avocat", "Poireaux", "Fraises", "Petits pois", "Chou", "Mangue", "Ananas"],
    "Viandes & Poissons": ["Poulet (filets)", "Steak haché", "Lardons", "Jambon", "Saucisses", "Saumon", "Poulet (entier)", "Dinde", "Boeuf (bavette)", "Crevettes", "Merguez", "Porc (côtes)", "Cabillaud", "Thon (frais)", "Agneau"],
    "Produits laitiers": ["Oeufs", "Lait", "Beurre", "Fromage râpé", "Crème fraîche", "Yaourts nature", "Mozzarella", "Crème liquide", "Parmesan", "Comté", "Camembert", "Fromage blanc", "Chèvre frais", "Mascarpone", "Ricotta"],
    "Boulangerie": ["Baguette", "Pain de mie", "Pain complet", "Croissants", "Wraps/Tortillas", "Brioche", "Pain burger", "Biscottes"],
    "Épicerie": ["Pâtes", "Riz", "Huile d'olive", "Sel", "Sucre", "Farine", "Sauce tomate", "Moutarde", "Poivre", "Conserves de thon", "Concentré de tomates", "Vinaigre", "Café", "Chocolat", "Ketchup", "Mayonnaise", "Lentilles", "Pois chiches", "Huile tournesol", "Conserves de maïs", "Olives", "Miel", "Thé", "Confiture", "Semoule"],
    "Surgelés": ["Frites", "Pizza surgelée", "Légumes surgelés", "Nuggets", "Poisson pané", "Glaces", "Épinards surgelés", "Fruits surgelés"],
    "Boissons": ["Eau plate", "Lait d'amande", "Jus d'orange", "Eau gazeuse", "Café moulu", "Coca-Cola", "Bière", "Vin rouge", "Vin blanc", "Sirop"],
    "Hygiène & Beauté": ["Papier toilette", "Gel douche", "Shampoing", "Dentifrice", "Mouchoirs", "Savon", "Déodorant", "Brosse à dents", "Cotons", "Rasoirs", "Crème hydratante", "Serviettes hygiéniques", "Lessive (capsules)", "Lingettes bébé", "Couches"],
    "Entretien & Maison": ["Sopalin", "Éponges", "Liquide vaisselle", "Sacs poubelle", "Lessive", "Pastilles lave-vaisselle", "Produit multi-surfaces", "Javel", "Film alimentaire", "Papier aluminium", "Adoucissant", "Produit vitres", "Produit WC", "Désodorisant", "Balai/serpillère (recharge)"],
    "Épices & Condiments": ["Herbes de Provence", "Bouillon cube", "Sauce soja", "Curry", "Paprika", "Basilic sec", "Persil sec", "Cumin", "Cannelle", "Levure"],
  };

  for (const [category, names] of Object.entries(sortOrders)) {
    for (let i = 0; i < names.length; i++) {
      await client.execute({ sql: "UPDATE products SET sort_order = ? WHERE name = ? AND category = ?", args: [i + 1, names[i], category] });
    }
  }
  console.log("Sort order and units updated!");

  // Step 3: Seed classic recipes
  const recipeCount = await client.execute("SELECT COUNT(*) as count FROM recipes");
  if (Number(recipeCount.rows[0].count) === 0) {
    console.log("Seeding classic recipes...");

    const recipes: { name: string; description: string; servings: number; category: string; ingredients: [string, number, string, string][] }[] = [
      {
        name: "Pâtes carbonara",
        description: "Pâtes crémeuses aux lardons et parmesan",
        servings: 2, category: "Italien",
        ingredients: [
          ["Pâtes", 200, "g", "Épicerie"],
          ["Lardons", 150, "g", "Viandes & Poissons"],
          ["Oeufs", 2, "pcs", "Produits laitiers"],
          ["Parmesan", 50, "g", "Produits laitiers"],
          ["Crème fraîche", 50, "mL", "Produits laitiers"],
          ["Poivre", 2, "g", "Épicerie"],
        ],
      },
      {
        name: "Pâtes bolognaise",
        description: "Pâtes sauce tomate à la viande hachée",
        servings: 2, category: "Italien",
        ingredients: [
          ["Pâtes", 200, "g", "Épicerie"],
          ["Steak haché", 2, "pcs", "Viandes & Poissons"],
          ["Sauce tomate", 1, "boîte", "Épicerie"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
          ["Ail", 1, "pcs", "Fruits & Légumes"],
          ["Huile d'olive", 15, "mL", "Épicerie"],
          ["Fromage râpé", 40, "g", "Produits laitiers"],
        ],
      },
      {
        name: "Croque-monsieur",
        description: "Sandwich grillé jambon-fromage fondant",
        servings: 2, category: "Français",
        ingredients: [
          ["Pain de mie", 4, "pcs", "Boulangerie"],
          ["Jambon", 2, "pcs", "Viandes & Poissons"],
          ["Fromage râpé", 80, "g", "Produits laitiers"],
          ["Beurre", 20, "g", "Produits laitiers"],
          ["Lait", 50, "mL", "Produits laitiers"],
        ],
      },
      {
        name: "Omelette aux champignons",
        description: "Omelette garnie de champignons poêlés",
        servings: 2, category: "Français",
        ingredients: [
          ["Oeufs", 4, "pcs", "Produits laitiers"],
          ["Champignons", 150, "g", "Fruits & Légumes"],
          ["Beurre", 15, "g", "Produits laitiers"],
          ["Sel", 2, "g", "Épicerie"],
          ["Poivre", 1, "g", "Épicerie"],
          ["Persil sec", 1, "pcs", "Épices & Condiments"],
        ],
      },
      {
        name: "Poulet rôti",
        description: "Poulet entier rôti aux herbes et pommes de terre",
        servings: 4, category: "Français",
        ingredients: [
          ["Poulet (entier)", 1, "pcs", "Viandes & Poissons"],
          ["Pommes de terre", 500, "g", "Fruits & Légumes"],
          ["Herbes de Provence", 1, "pot", "Épices & Condiments"],
          ["Beurre", 30, "g", "Produits laitiers"],
          ["Ail", 3, "pcs", "Fruits & Légumes"],
          ["Huile d'olive", 30, "mL", "Épicerie"],
        ],
      },
      {
        name: "Gratin dauphinois",
        description: "Gratin crémeux de pommes de terre au four",
        servings: 2, category: "Français",
        ingredients: [
          ["Pommes de terre", 400, "g", "Fruits & Légumes"],
          ["Crème liquide", 200, "mL", "Produits laitiers"],
          ["Lait", 100, "mL", "Produits laitiers"],
          ["Ail", 1, "pcs", "Fruits & Légumes"],
          ["Beurre", 15, "g", "Produits laitiers"],
          ["Fromage râpé", 50, "g", "Produits laitiers"],
        ],
      },
      {
        name: "Quiche lorraine",
        description: "Tarte salée aux lardons et crème",
        servings: 2, category: "Français",
        ingredients: [
          ["Oeufs", 3, "pcs", "Produits laitiers"],
          ["Lardons", 150, "g", "Viandes & Poissons"],
          ["Crème liquide", 200, "mL", "Produits laitiers"],
          ["Fromage râpé", 60, "g", "Produits laitiers"],
          ["Farine", 200, "g", "Épicerie"],
          ["Beurre", 100, "g", "Produits laitiers"],
        ],
      },
      {
        name: "Salade César",
        description: "Salade croquante poulet, croûtons et parmesan",
        servings: 2, category: "International",
        ingredients: [
          ["Salade", 1, "pcs", "Fruits & Légumes"],
          ["Poulet (filets)", 200, "g", "Viandes & Poissons"],
          ["Parmesan", 30, "g", "Produits laitiers"],
          ["Pain de mie", 2, "pcs", "Boulangerie"],
          ["Huile d'olive", 20, "mL", "Épicerie"],
          ["Moutarde", 1, "c.à.c", "Épicerie"],
        ],
      },
      {
        name: "Curry de poulet",
        description: "Poulet mijoté au curry et lait de coco",
        servings: 2, category: "Asiatique",
        ingredients: [
          ["Poulet (filets)", 250, "g", "Viandes & Poissons"],
          ["Curry", 1, "pot", "Épices & Condiments"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
          ["Riz", 150, "g", "Épicerie"],
          ["Crème liquide", 200, "mL", "Produits laitiers"],
          ["Tomates", 2, "pcs", "Fruits & Légumes"],
        ],
      },
      {
        name: "Risotto aux champignons",
        description: "Riz crémeux aux champignons et parmesan",
        servings: 2, category: "Italien",
        ingredients: [
          ["Riz", 200, "g", "Épicerie"],
          ["Champignons", 200, "g", "Fruits & Légumes"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
          ["Parmesan", 50, "g", "Produits laitiers"],
          ["Beurre", 20, "g", "Produits laitiers"],
          ["Bouillon cube", 1, "pcs", "Épices & Condiments"],
          ["Vin blanc", 50, "mL", "Boissons"],
        ],
      },
      {
        name: "Burger maison",
        description: "Burger boeuf avec crudités et sauce",
        servings: 2, category: "International",
        ingredients: [
          ["Steak haché", 2, "pcs", "Viandes & Poissons"],
          ["Pain burger", 2, "pcs", "Boulangerie"],
          ["Salade", 1, "pcs", "Fruits & Légumes"],
          ["Tomates", 1, "pcs", "Fruits & Légumes"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
          ["Fromage râpé", 40, "g", "Produits laitiers"],
          ["Ketchup", 1, "flacon", "Épicerie"],
        ],
      },
      {
        name: "Tacos poulet",
        description: "Wraps garnis de poulet épicé et crudités",
        servings: 2, category: "International",
        ingredients: [
          ["Wraps/Tortillas", 4, "pcs", "Boulangerie"],
          ["Poulet (filets)", 200, "g", "Viandes & Poissons"],
          ["Tomates", 2, "pcs", "Fruits & Légumes"],
          ["Salade", 1, "pcs", "Fruits & Légumes"],
          ["Fromage râpé", 50, "g", "Produits laitiers"],
          ["Crème fraîche", 50, "mL", "Produits laitiers"],
          ["Paprika", 1, "pot", "Épices & Condiments"],
        ],
      },
      {
        name: "Soupe de légumes",
        description: "Soupe maison aux légumes de saison",
        servings: 2, category: "Français",
        ingredients: [
          ["Carottes", 2, "pcs", "Fruits & Légumes"],
          ["Pommes de terre", 200, "g", "Fruits & Légumes"],
          ["Poireaux", 1, "pcs", "Fruits & Légumes"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
          ["Bouillon cube", 1, "pcs", "Épices & Condiments"],
          ["Beurre", 15, "g", "Produits laitiers"],
        ],
      },
      {
        name: "Ratatouille",
        description: "Mélange de légumes du soleil mijotés",
        servings: 2, category: "Français",
        ingredients: [
          ["Courgettes", 2, "pcs", "Fruits & Légumes"],
          ["Aubergines", 1, "pcs", "Fruits & Légumes"],
          ["Poivrons", 2, "pcs", "Fruits & Légumes"],
          ["Tomates", 3, "pcs", "Fruits & Légumes"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
          ["Ail", 2, "pcs", "Fruits & Légumes"],
          ["Herbes de Provence", 1, "pot", "Épices & Condiments"],
          ["Huile d'olive", 30, "mL", "Épicerie"],
        ],
      },
      {
        name: "Blanquette de veau",
        description: "Ragoût de veau crémeux aux légumes",
        servings: 4, category: "Français",
        ingredients: [
          ["Boeuf (bavette)", 500, "g", "Viandes & Poissons"],
          ["Carottes", 3, "pcs", "Fruits & Légumes"],
          ["Champignons", 200, "g", "Fruits & Légumes"],
          ["Oignons", 2, "pcs", "Fruits & Légumes"],
          ["Crème fraîche", 150, "mL", "Produits laitiers"],
          ["Bouillon cube", 2, "pcs", "Épices & Condiments"],
          ["Beurre", 30, "g", "Produits laitiers"],
          ["Farine", 30, "g", "Épicerie"],
        ],
      },
      {
        name: "Crêpes",
        description: "Crêpes fines sucrées à garnir",
        servings: 2, category: "Dessert",
        ingredients: [
          ["Farine", 125, "g", "Épicerie"],
          ["Oeufs", 2, "pcs", "Produits laitiers"],
          ["Lait", 250, "mL", "Produits laitiers"],
          ["Sucre", 30, "g", "Épicerie"],
          ["Beurre", 20, "g", "Produits laitiers"],
        ],
      },
      {
        name: "Gâteau au chocolat",
        description: "Moelleux au chocolat fondant",
        servings: 6, category: "Dessert",
        ingredients: [
          ["Chocolat", 200, "g", "Épicerie"],
          ["Beurre", 100, "g", "Produits laitiers"],
          ["Oeufs", 3, "pcs", "Produits laitiers"],
          ["Sucre", 100, "g", "Épicerie"],
          ["Farine", 50, "g", "Épicerie"],
        ],
      },
      {
        name: "Tarte aux pommes",
        description: "Tarte classique aux pommes caramélisées",
        servings: 6, category: "Dessert",
        ingredients: [
          ["Pommes", 4, "pcs", "Fruits & Légumes"],
          ["Farine", 200, "g", "Épicerie"],
          ["Beurre", 100, "g", "Produits laitiers"],
          ["Sucre", 80, "g", "Épicerie"],
          ["Oeufs", 1, "pcs", "Produits laitiers"],
          ["Cannelle", 1, "pot", "Épices & Condiments"],
        ],
      },
      {
        name: "Pizza maison",
        description: "Pizza maison avec garniture au choix",
        servings: 2, category: "Italien",
        ingredients: [
          ["Farine", 250, "g", "Épicerie"],
          ["Levure", 1, "sachet", "Épices & Condiments"],
          ["Sauce tomate", 1, "boîte", "Épicerie"],
          ["Mozzarella", 125, "g", "Produits laitiers"],
          ["Jambon", 2, "pcs", "Viandes & Poissons"],
          ["Champignons", 100, "g", "Fruits & Légumes"],
          ["Huile d'olive", 15, "mL", "Épicerie"],
        ],
      },
      {
        name: "Lasagnes",
        description: "Lasagnes bolognaise gratinées au four",
        servings: 4, category: "Italien",
        ingredients: [
          ["Pâtes", 250, "g", "Épicerie"],
          ["Steak haché", 4, "pcs", "Viandes & Poissons"],
          ["Sauce tomate", 2, "boîte", "Épicerie"],
          ["Fromage râpé", 150, "g", "Produits laitiers"],
          ["Lait", 500, "mL", "Produits laitiers"],
          ["Beurre", 40, "g", "Produits laitiers"],
          ["Farine", 40, "g", "Épicerie"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
        ],
      },
      {
        name: "Couscous",
        description: "Couscous aux légumes et viande",
        servings: 4, category: "International",
        ingredients: [
          ["Semoule", 300, "g", "Épicerie"],
          ["Poulet (filets)", 400, "g", "Viandes & Poissons"],
          ["Carottes", 3, "pcs", "Fruits & Légumes"],
          ["Courgettes", 2, "pcs", "Fruits & Légumes"],
          ["Pois chiches", 1, "boîte", "Épicerie"],
          ["Tomates", 2, "pcs", "Fruits & Légumes"],
          ["Oignons", 2, "pcs", "Fruits & Légumes"],
          ["Bouillon cube", 2, "pcs", "Épices & Condiments"],
        ],
      },
      {
        name: "Chili con carne",
        description: "Haché épicé aux haricots rouges et tomates",
        servings: 2, category: "International",
        ingredients: [
          ["Steak haché", 2, "pcs", "Viandes & Poissons"],
          ["Sauce tomate", 1, "boîte", "Épicerie"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
          ["Poivrons", 1, "pcs", "Fruits & Légumes"],
          ["Riz", 150, "g", "Épicerie"],
          ["Cumin", 1, "pot", "Épices & Condiments"],
          ["Concentré de tomates", 1, "boîte", "Épicerie"],
        ],
      },
      {
        name: "Saumon grillé légumes",
        description: "Pavé de saumon avec légumes grillés",
        servings: 2, category: "International",
        ingredients: [
          ["Saumon", 250, "g", "Viandes & Poissons"],
          ["Courgettes", 1, "pcs", "Fruits & Légumes"],
          ["Poivrons", 1, "pcs", "Fruits & Légumes"],
          ["Huile d'olive", 20, "mL", "Épicerie"],
          ["Citrons", 1, "pcs", "Fruits & Légumes"],
          ["Herbes de Provence", 1, "pot", "Épices & Condiments"],
        ],
      },
      {
        name: "Pad thaï",
        description: "Nouilles sautées aux crevettes et cacahuètes",
        servings: 2, category: "Asiatique",
        ingredients: [
          ["Pâtes", 200, "g", "Épicerie"],
          ["Crevettes", 150, "g", "Viandes & Poissons"],
          ["Oeufs", 2, "pcs", "Produits laitiers"],
          ["Sauce soja", 30, "mL", "Épices & Condiments"],
          ["Citrons", 1, "pcs", "Fruits & Légumes"],
          ["Oignons", 1, "pcs", "Fruits & Légumes"],
        ],
      },
      {
        name: "Wok de légumes",
        description: "Légumes croquants sautés au wok",
        servings: 2, category: "Asiatique",
        ingredients: [
          ["Poivrons", 2, "pcs", "Fruits & Légumes"],
          ["Courgettes", 1, "pcs", "Fruits & Légumes"],
          ["Carottes", 2, "pcs", "Fruits & Légumes"],
          ["Champignons", 100, "g", "Fruits & Légumes"],
          ["Sauce soja", 30, "mL", "Épices & Condiments"],
          ["Riz", 150, "g", "Épicerie"],
          ["Huile tournesol", 15, "mL", "Épicerie"],
        ],
      },
      {
        name: "Steak frites",
        description: "Steak grillé accompagné de frites maison",
        servings: 2, category: "Français",
        ingredients: [
          ["Boeuf (bavette)", 300, "g", "Viandes & Poissons"],
          ["Pommes de terre", 400, "g", "Fruits & Légumes"],
          ["Huile tournesol", 50, "mL", "Épicerie"],
          ["Beurre", 20, "g", "Produits laitiers"],
          ["Sel", 2, "g", "Épicerie"],
          ["Poivre", 1, "g", "Épicerie"],
        ],
      },
      {
        name: "Poulet tikka masala",
        description: "Poulet mariné dans une sauce tomate épicée",
        servings: 4, category: "Asiatique",
        ingredients: [
          ["Poulet (filets)", 400, "g", "Viandes & Poissons"],
          ["Sauce tomate", 1, "boîte", "Épicerie"],
          ["Crème liquide", 200, "mL", "Produits laitiers"],
          ["Oignons", 2, "pcs", "Fruits & Légumes"],
          ["Curry", 1, "pot", "Épices & Condiments"],
          ["Riz", 200, "g", "Épicerie"],
          ["Ail", 2, "pcs", "Fruits & Légumes"],
          ["Paprika", 1, "pot", "Épices & Condiments"],
        ],
      },
      {
        name: "Salade niçoise",
        description: "Salade composée aux tomates, thon et olives",
        servings: 2, category: "Français",
        ingredients: [
          ["Salade", 1, "pcs", "Fruits & Légumes"],
          ["Tomates", 2, "pcs", "Fruits & Légumes"],
          ["Oeufs", 2, "pcs", "Produits laitiers"],
          ["Conserves de thon", 1, "boîte", "Épicerie"],
          ["Olives", 50, "g", "Épicerie"],
          ["Haricots verts", 100, "g", "Fruits & Légumes"],
          ["Huile d'olive", 20, "mL", "Épicerie"],
        ],
      },
      {
        name: "Taboulé",
        description: "Salade fraîche de semoule aux herbes et légumes",
        servings: 2, category: "International",
        ingredients: [
          ["Semoule", 150, "g", "Épicerie"],
          ["Tomates", 2, "pcs", "Fruits & Légumes"],
          ["Concombre", 1, "pcs", "Fruits & Légumes"],
          ["Citrons", 2, "pcs", "Fruits & Légumes"],
          ["Huile d'olive", 30, "mL", "Épicerie"],
          ["Persil sec", 1, "pot", "Épices & Condiments"],
        ],
      },
      {
        name: "Croque madame",
        description: "Croque-monsieur avec oeuf sur le plat",
        servings: 2, category: "Français",
        ingredients: [
          ["Pain de mie", 4, "pcs", "Boulangerie"],
          ["Jambon", 2, "pcs", "Viandes & Poissons"],
          ["Fromage râpé", 80, "g", "Produits laitiers"],
          ["Oeufs", 2, "pcs", "Produits laitiers"],
          ["Beurre", 20, "g", "Produits laitiers"],
          ["Lait", 50, "mL", "Produits laitiers"],
        ],
      },
    ];

    for (const recipe of recipes) {
      const result = await client.execute({
        sql: "INSERT INTO recipes (name, description, servings, category) VALUES (?, ?, ?, ?)",
        args: [recipe.name, recipe.description, recipe.servings, recipe.category],
      });
      const recipeId = Number(result.lastInsertRowid);

      for (const [ingName, qty, unit, cat] of recipe.ingredients) {
        await client.execute({
          sql: "INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?)",
          args: [recipeId, ingName, qty, unit, cat],
        });
      }
    }

    console.log(`${recipes.length} recipes seeded with ingredients!`);
  } else {
    console.log("Recipes already exist, skipping seed.");
  }
}

migrate().catch(console.error);
