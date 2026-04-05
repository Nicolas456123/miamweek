import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { query } from "../src/db";

const INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id)",
  "CREATE INDEX IF NOT EXISTS idx_list_items_status ON list_items(list_status)",
  "CREATE INDEX IF NOT EXISTS idx_list_items_product_id ON list_items(product_id)",
  "CREATE INDEX IF NOT EXISTS idx_stock_items_product_id ON stock_items(product_id)",
  "CREATE INDEX IF NOT EXISTS idx_pantry_items_product_id ON pantry_items(product_id)",
  "CREATE INDEX IF NOT EXISTS idx_food_prefs_product_id ON food_preferences(product_id)",
  "CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id)",
  "CREATE INDEX IF NOT EXISTS idx_meal_plan_week ON meal_plan(week_start, day_of_week)",
];

async function run() {
  console.log("Adding database indexes...");
  for (const sql of INDEXES) {
    try {
      await query(sql);
      const name = sql.match(/idx_\w+/)?.[0] || "?";
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.log(`  ✗ ${sql}: ${err}`);
    }
  }
  console.log("Done!");
}
run();
