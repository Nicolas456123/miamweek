import { query } from "@/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    // Ensure pantry table exists
    try {
      await query(`CREATE TABLE IF NOT EXISTS pantry_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        quantity REAL,
        unit TEXT,
        category TEXT,
        location TEXT DEFAULT 'placard',
        added_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT
      )`);
    } catch { /* already exists */ }

    // Get all active items
    const activeResult = await query(
      "SELECT * FROM list_items WHERE list_status = 'active'"
    );
    const activeItems = activeResult.rows;

    // Mark all active items as done
    await query(
      "UPDATE list_items SET list_status = 'done' WHERE list_status = 'active'"
    );

    const today = new Date().toISOString().split("T")[0];
    let itemsProcessed = 0;

    // Perishable keywords for auto-setting location and expiry
    const FRIGO_KEYWORDS = [
      "lait", "crème", "yaourt", "fromage", "beurre", "oeuf", "jambon",
      "lardon", "saumon", "crevette", "poulet", "steak", "viande",
      "salade", "champignon", "jus", "compote", "mascarpone", "ricotta",
      "mozzarella", "chèvre", "camembert", "brie", "feta",
    ];
    const CONGEL_KEYWORDS = ["surgelé", "surgelée", "surgelés", "glace", "glacé"];

    for (const item of activeItems) {
      if (!item.checked) continue;

      const productId = item.product_id as number | null;
      const productName = item.product_name as string;
      const nameLower = productName.toLowerCase();

      // 1. Update stock tracking
      if (productId) {
        const existingResult = await query(
          "SELECT * FROM stock_items WHERE product_id = ?",
          [productId]
        );

        if (existingResult.rows.length > 0) {
          const stock = existingResult.rows[0];
          let newAvg = stock.avg_frequency_days as number | null;
          if (stock.last_purchased) {
            const lastDate = new Date(stock.last_purchased as string);
            const daysDiff = Math.floor(
              (new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            newAvg = newAvg ? Math.round(((newAvg + daysDiff) / 2) * 10) / 10 : daysDiff;
          }

          await query(
            "UPDATE stock_items SET last_purchased = ?, avg_frequency_days = ?, status = 'ok' WHERE id = ?",
            [today, newAvg, stock.id as number]
          );
        } else {
          await query(
            "INSERT INTO stock_items (product_id, last_purchased, status) VALUES (?, ?, 'ok')",
            [productId, today]
          );
        }
      }

      // 2. Add to pantry/inventory
      // Determine location based on product type
      let location = "placard";
      if (CONGEL_KEYWORDS.some((kw) => nameLower.includes(kw))) {
        location = "congélateur";
      } else if (FRIGO_KEYWORDS.some((kw) => nameLower.includes(kw))) {
        location = "frigo";
      }

      // Determine expiry (rough estimate)
      let expiresAt: string | null = null;
      if (location === "frigo") {
        const d = new Date();
        d.setDate(d.getDate() + 7); // 1 week for fresh
        expiresAt = d.toISOString().split("T")[0];
      } else if (location === "congélateur") {
        const d = new Date();
        d.setMonth(d.getMonth() + 3); // 3 months frozen
        expiresAt = d.toISOString().split("T")[0];
      }

      // Check if already in pantry (same product)
      if (productId) {
        const existingPantry = await query(
          "SELECT id, quantity FROM pantry_items WHERE product_id = ?",
          [productId]
        );
        if (existingPantry.rows.length > 0) {
          // Update quantity (add to existing)
          const existingQty = (existingPantry.rows[0].quantity as number) || 0;
          const addQty = (item.quantity as number) || 1;
          await query(
            "UPDATE pantry_items SET quantity = ?, added_at = ? WHERE id = ?",
            [existingQty + addQty, today, existingPantry.rows[0].id as number]
          );
          itemsProcessed++;
          continue;
        }
      }

      await query(
        "INSERT INTO pantry_items (product_id, product_name, quantity, unit, category, location, added_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          productId,
          productName,
          item.quantity || 1,
          item.unit || "pcs",
          item.category || null,
          location,
          today,
          expiresAt,
        ]
      );
      itemsProcessed++;
    }

    return Response.json({ success: true, itemsProcessed });
  } catch (error) {
    return Response.json(
      { error: "Failed to finish shopping", details: String(error) },
      { status: 500 }
    );
  }
}
