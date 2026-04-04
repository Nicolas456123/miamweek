import { db } from "@/db";
import { listItems, stockItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST() {
  // Get all active items
  const activeItems = await db
    .select()
    .from(listItems)
    .where(eq(listItems.listStatus, "active"));

  // Mark all active items as done
  await db
    .update(listItems)
    .set({ listStatus: "done" })
    .where(eq(listItems.listStatus, "active"));

  const today = new Date().toISOString().split("T")[0];
  let itemsProcessed = 0;

  // For each checked item with a productId, upsert into stockItems
  for (const item of activeItems) {
    if (item.checked && item.productId) {
      const existing = await db
        .select()
        .from(stockItems)
        .where(eq(stockItems.productId, item.productId));

      if (existing.length > 0) {
        const stock = existing[0];
        // Recalculate avgFrequencyDays
        let newAvg = stock.avgFrequencyDays;
        if (stock.lastPurchased) {
          const lastDate = new Date(stock.lastPurchased);
          const daysDiff = Math.floor(
            (new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (newAvg) {
            newAvg = Math.round(((newAvg + daysDiff) / 2) * 10) / 10;
          } else {
            newAvg = daysDiff;
          }
        }

        await db
          .update(stockItems)
          .set({
            lastPurchased: today,
            avgFrequencyDays: newAvg,
            status: "ok",
          })
          .where(eq(stockItems.id, stock.id));
      } else {
        await db.insert(stockItems).values({
          productId: item.productId,
          lastPurchased: today,
          status: "ok",
        });
      }
      itemsProcessed++;
    }
  }

  return Response.json({ success: true, itemsProcessed });
}
