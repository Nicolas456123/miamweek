import { query } from "@/db";

export const runtime = "nodejs";

const MOCK_PHOTO_RESULT = [
  { name: "Lait", quantity: 1, unit: "L", expiry: null },
  { name: "Oeufs", quantity: 6, unit: "pcs", expiry: null },
  { name: "Beurre", quantity: 1, unit: "pcs", expiry: "2026-04-20" },
  { name: "Fromage râpé", quantity: 1, unit: "pcs", expiry: "2026-04-15" },
];

const MOCK_TEXT_RESULT = [
  { name: "Poivre", quantity: 1, unit: "pot", expiry: null },
  { name: "Oeufs", quantity: 2, unit: "pcs", expiry: null },
];

// Perishable categories that need expiry tracking
const PERISHABLE_KEYWORDS = [
  "lait", "crème", "yaourt", "fromage", "beurre", "oeuf", "viande", "poulet",
  "poisson", "saumon", "crevette", "jambon", "lardon", "steak", "salade",
  "champignon", "frais", "jus", "compote",
];

function isPershable(name: string): boolean {
  const lower = name.toLowerCase();
  return PERISHABLE_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, text } = body;

    if (!image && !text) {
      return Response.json({ error: "image or text required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    let items: { name: string; quantity: number; unit: string; expiry: string | null }[];

    if (!apiKey) {
      items = image ? MOCK_PHOTO_RESULT : MOCK_TEXT_RESULT;
    } else {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      let systemPrompt: string;
      let userContent: Parameters<typeof client.messages.create>[0]["messages"][0]["content"];

      if (image) {
        systemPrompt = `Tu analyses une photo de produits alimentaires/ménagers.
Identifie chaque produit visible avec sa quantité estimée.
Pour les produits périssables (lait, viande, fromage, oeufs, etc.), estime une date de péremption probable si visible ou raisonnable.
Réponds UNIQUEMENT en JSON valide (pas de markdown):
[{"name": "Produit", "quantity": 1, "unit": "pcs", "expiry": "2026-04-20"}]
expiry est null si non périssable ou non visible. Format date: YYYY-MM-DD.
Unités: pcs, kg, g, L, mL, pot, flacon, bout., lot, boîte, sachet, tube, roul.`;

        const base64 = image.replace(/^data:image\/\w+;base64,/, "");
        const mediaType = image.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";
        userContent = [
          {
            type: "image" as const,
            source: { type: "base64" as const, media_type: mediaType as "image/jpeg", data: base64 },
          },
          { type: "text" as const, text: "Quels produits vois-tu sur cette photo ? Liste-les en JSON." },
        ];
      } else {
        systemPrompt = `L'utilisateur décrit ce qu'il a chez lui (frigo, placard, etc.).
Extrais chaque produit mentionné avec sa quantité.
Pour les produits périssables, estime une date de péremption raisonnable (environ 1 semaine pour les frais, 1 mois pour les conserves).
Réponds UNIQUEMENT en JSON valide (pas de markdown):
[{"name": "Produit", "quantity": 1, "unit": "pcs", "expiry": "2026-04-20"}]
expiry est null si non périssable. Format date: YYYY-MM-DD.
Unités: pcs, kg, g, L, mL, pot, flacon, bout., lot, boîte, sachet, tube, roul.`;
        userContent = text;
      }

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      });

      const textContent = message.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        return Response.json({ error: "No AI response" }, { status: 500 });
      }

      try {
        items = JSON.parse(textContent.text);
      } catch {
        const match = textContent.text.match(/\[[\s\S]*\]/);
        if (match) {
          items = JSON.parse(match[0]);
        } else {
          return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
        }
      }
    }

    // Add perishable flag if not already set
    items = items.map((item) => ({
      ...item,
      expiry: item.expiry || (isPershable(item.name) ? null : null),
    }));

    // Save to inventory
    // Add expiry_date column if not exists
    try { await query("ALTER TABLE stock_items ADD COLUMN expiry_date TEXT"); } catch { /* exists */ }
    try { await query("ALTER TABLE stock_items ADD COLUMN quantity REAL"); } catch { /* exists */ }
    try { await query("ALTER TABLE stock_items ADD COLUMN unit TEXT"); } catch { /* exists */ }

    const saved = [];
    for (const item of items) {
      // Try to find matching product
      const productResult = await query(
        "SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1",
        [item.name]
      );
      const productId = productResult.rows.length > 0 ? productResult.rows[0].id as number : null;

      if (productId) {
        // Check if already tracked
        const existing = await query(
          "SELECT id FROM stock_items WHERE product_id = ?",
          [productId]
        );
        if (existing.rows.length > 0) {
          await query(
            "UPDATE stock_items SET status = 'ok', last_purchased = ?, quantity = ?, unit = ?, expiry_date = ? WHERE product_id = ?",
            [new Date().toISOString().split("T")[0], item.quantity, item.unit, item.expiry, productId]
          );
        } else {
          await query(
            "INSERT INTO stock_items (product_id, status, last_purchased, quantity, unit, expiry_date) VALUES (?, 'ok', ?, ?, ?, ?)",
            [productId, new Date().toISOString().split("T")[0], item.quantity, item.unit, item.expiry]
          );
        }
      }
      saved.push({ ...item, productId, matched: !!productId });
    }

    return Response.json({ items: saved, count: saved.length });
  } catch (error) {
    console.error("Inventory scan error:", error);
    return Response.json({ error: "Scan failed", details: String(error) }, { status: 500 });
  }
}
