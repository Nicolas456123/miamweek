import { query } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { text } = body;

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  let parsed: { store?: string; date: string; items: { name: string; price: number }[]; total?: number };

  if (!process.env.ANTHROPIC_API_KEY) {
    // Mock response when no API key
    parsed = {
      store: "Supermarche",
      date: new Date().toISOString().split("T")[0],
      items: [
        { name: "Produit exemple 1", price: 2.99 },
        { name: "Produit exemple 2", price: 1.50 },
      ],
      total: 4.49,
    };
  } else {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        'Tu es un assistant qui extrait les donn\u00e9es d\'un ticket de caisse. R\u00e9ponds UNIQUEMENT avec du JSON valide (pas de markdown). Format: {"store": "nom", "date": "YYYY-MM-DD", "items": [{"name": "produit", "price": 1.99}], "total": 10.50}',
      messages: [{ role: "user", content: text }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";
    parsed = JSON.parse(responseText);
  }

  // Create receipt and price entries
  const receiptResult = await query(
    "INSERT INTO receipts (date, store, total) VALUES (?, ?, ?) RETURNING *",
    [parsed.date, parsed.store || null, parsed.total || null]
  );
  const receipt = receiptResult.rows[0];

  const priceEntries = [];
  for (const item of parsed.items) {
    const entryResult = await query(
      "INSERT INTO price_history (product_name, price, date, store, receipt_id) VALUES (?, ?, ?, ?, ?) RETURNING *",
      [item.name, item.price, parsed.date, parsed.store || null, receipt.id as number]
    );
    priceEntries.push(entryResult.rows[0]);
  }

  return Response.json({ receipt, items: priceEntries }, { status: 201 });
}
