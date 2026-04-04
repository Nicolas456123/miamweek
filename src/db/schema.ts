import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── Existing tables (recipes, meal planning) ──────────────────────────

export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").default(2),
  category: text("category"),
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  difficulty: text("difficulty"), // "facile" | "moyen" | "difficile"
  utensils: text("utensils"), // JSON array: ["poêle", "casserole"]
  steps: text("steps"), // JSON array: ["Étape 1...", "Étape 2..."]
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  category: text("category"), // rayon: fruits, viandes, etc.
});

export const mealPlan = sqliteTable("meal_plan", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStart: text("week_start").notNull(), // ISO date string (monday)
  dayOfWeek: integer("day_of_week").notNull(), // 0=lundi ... 6=dimanche
  mealType: text("meal_type").notNull(), // "lunch" | "dinner"
  recipeId: integer("recipe_id").references(() => recipes.id, {
    onDelete: "set null",
  }),
  customName: text("custom_name"), // if no recipe, just a name
});

// ── Product catalog ───────────────────────────────────────────────────

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  defaultUnit: text("default_unit").notNull(),
  icon: text("icon"),
  isCustom: integer("is_custom", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ── Shopping list items (2-phase: prep -> active -> done) ─────────────

export const listItems = sqliteTable("list_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  category: text("category"),
  checked: integer("checked", { mode: "boolean" }).default(false),
  source: text("source").default("manual"), // "manual" | "auto" | "recipe"
  listStatus: text("list_status").default("prep"), // "prep" | "active" | "done"
  addedAt: text("added_at").default("CURRENT_TIMESTAMP"),
  checkedAt: text("checked_at"),
});

// ── Stock tracking for consumables ────────────────────────────────────

export const stockItems = sqliteTable("stock_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  lastPurchased: text("last_purchased"),
  avgFrequencyDays: real("avg_frequency_days"),
  status: text("status").default("ok"), // "ok" | "low" | "out"
  nextEstimated: text("next_estimated"),
});

// ── Receipts from store ───────────────────────────────────────────────

export const receipts = sqliteTable("receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  store: text("store"),
  total: real("total"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ── Pantry / Inventaire maison ────────────────────────────────────────

export const pantryItems = sqliteTable("pantry_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  category: text("category"),
  location: text("location"), // "frigo" | "placard" | "congélateur" | "autre"
  addedAt: text("added_at").default("CURRENT_TIMESTAMP"),
  expiresAt: text("expires_at"),
});

// ── Food preferences ─────────────────────────────────────────────────

export const foodPreferences = sqliteTable("food_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "cascade",
  }),
  productName: text("product_name").notNull(),
  status: text("status").notNull(), // "dislike" | "allergy" | "love"
  note: text("note"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ── Price history ─────────────────────────────────────────────────────

export const priceHistory = sqliteTable("price_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  price: real("price").notNull(),
  date: text("date").notNull(),
  store: text("store"),
  receiptId: integer("receipt_id").references(() => receipts.id, {
    onDelete: "set null",
  }),
});
