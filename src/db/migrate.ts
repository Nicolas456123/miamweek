import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log("Creating tables...");

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

    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT,
      name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      category TEXT,
      checked INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS house_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL,
      icon TEXT,
      last_done TEXT,
      assigned_to TEXT
    );
  `);

  console.log("Tables created successfully!");

  // Insert default house tasks
  const existing = await client.execute("SELECT COUNT(*) as count FROM house_tasks");
  if (Number(existing.rows[0].count) === 0) {
    await client.executeMultiple(`
      INSERT INTO house_tasks (name, frequency, icon) VALUES ('Passer l''aspirateur', 'weekly', 'vacuum');
      INSERT INTO house_tasks (name, frequency, icon) VALUES ('Nettoyer la salle de bain', 'weekly', 'bath');
      INSERT INTO house_tasks (name, frequency, icon) VALUES ('Faire la lessive', 'weekly', 'washing');
      INSERT INTO house_tasks (name, frequency, icon) VALUES ('Nettoyer la cuisine', 'daily', 'kitchen');
      INSERT INTO house_tasks (name, frequency, icon) VALUES ('Sortir les poubelles', 'weekly', 'trash');
      INSERT INTO house_tasks (name, frequency, icon) VALUES ('Changer les draps', 'monthly', 'bed');
      INSERT INTO house_tasks (name, frequency, icon) VALUES ('Nettoyer les vitres', 'monthly', 'window');
      INSERT INTO house_tasks (name, frequency, icon) VALUES ('Dépoussiérer', 'weekly', 'dust');
    `);
    console.log("Default house tasks inserted!");
  }
}

migrate().catch(console.error);
