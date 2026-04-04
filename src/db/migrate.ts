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
}

migrate().catch(console.error);
