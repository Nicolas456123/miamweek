import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").default(2),
  category: text("category"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
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

export const shoppingItems = sqliteTable("shopping_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStart: text("week_start"),
  name: text("name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  category: text("category"),
  checked: integer("checked", { mode: "boolean" }).default(false),
  source: text("source").default("manual"), // "auto" | "manual"
});

export const houseTasks = sqliteTable("house_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  frequency: text("frequency").notNull(), // "daily" | "weekly" | "monthly"
  icon: text("icon"),
  lastDone: text("last_done"),
  assignedTo: text("assigned_to"),
});
