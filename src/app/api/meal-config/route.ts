import { query } from "@/db";

export const runtime = "nodejs";

async function ensureTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS meal_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_of_week INTEGER NOT NULL,
        meal TEXT NOT NULL,
        mode TEXT DEFAULT 'cook',
        persons INTEGER DEFAULT 2,
        UNIQUE(day_of_week, meal)
      )`
    );
  } catch { /* ignore */ }
}

export async function GET() {
  try {
    await ensureTable();
    const result = await query("SELECT * FROM meal_configs");
    return Response.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch meal configs:", error);
    return Response.json({ error: "Failed to fetch meal configs" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureTable();
    const { dayOfWeek, meal, mode, persons } = await request.json();
    if (dayOfWeek === undefined || !meal) {
      return Response.json({ error: "dayOfWeek and meal are required" }, { status: 400 });
    }
    await query(
      `INSERT INTO meal_configs (day_of_week, meal, mode, persons) VALUES (?, ?, ?, ?)
       ON CONFLICT(day_of_week, meal) DO UPDATE SET mode = excluded.mode, persons = excluded.persons`,
      [dayOfWeek, meal, mode || "cook", persons ?? 2]
    );
    const result = await query(
      "SELECT * FROM meal_configs WHERE day_of_week = ? AND meal = ?",
      [dayOfWeek, meal]
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to save meal config:", error);
    return Response.json({ error: "Failed to save meal config" }, { status: 500 });
  }
}
