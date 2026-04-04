import { query } from "@/db";

export const runtime = "nodejs";

export async function POST() {
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

  // For each checked item with a productId, upsert into stock_items
  for (const item of activeItems) {
    if (item.checked && item.product_id) {
      const existingResult = await query(
        "SELECT * FROM stock_items WHERE product_id = ?",
        [item.product_id as number]
      );

      if (existingResult.rows.length > 0) {
        const stock = existingResult.rows[0];
        // Recalculate avgFrequencyDays
        let newAvg = stock.avg_frequency_days as number | null;
        if (stock.last_purchased) {
          const lastDate = new Date(stock.last_purchased as string);
          const daysDiff = Math.floor(
            (new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (newAvg) {
            newAvg = Math.round(((newAvg + daysDiff) / 2) * 10) / 10;
          } else {
            newAvg = daysDiff;
          }
        }

        await query(
          "UPDATE stock_items SET last_purchased = ?, avg_frequency_days = ?, status = 'ok' WHERE id = ?",
          [today, newAvg, stock.id as number]
        );
      } else {
        await query(
          "INSERT INTO stock_items (product_id, last_purchased, status) VALUES (?, ?, 'ok')",
          [item.product_id as number, today]
        );
      }
      itemsProcessed++;
    }
  }

  return Response.json({ success: true, itemsProcessed });
}
