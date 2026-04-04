import { query } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { text, image } = body; // image = base64 data URL or raw base64

  if (!text && !image) {
    return Response.json(
      { error: "text or image is required" },
      { status: 400 }
    );
  }

  let parsed: {
    store?: string;
    date: string;
    items: { name: string; price: number }[];
    total?: number;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    // Mock response when no API key
    parsed = {
      store: "Supermarché",
      date: new Date().toISOString().split("T")[0],
      items: [
        { name: "Produit exemple 1", price: 2.99 },
        { name: "Produit exemple 2", price: 1.5 },
      ],
      total: 4.49,
    };
  } else {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt =
      'Tu es un assistant qui extrait les données d\'un ticket de caisse. Réponds UNIQUEMENT avec du JSON valide (pas de markdown). Format: {"store": "nom", "date": "YYYY-MM-DD", "items": [{"name": "produit", "price": 1.99}], "total": 10.50}';

    type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = [];

    if (image) {
      // Extract base64 data and media type from data URL
      let mediaType: MediaType = "image/jpeg";
      let base64Data = image;

      if (image.startsWith("data:")) {
        const match = image.match(
          /^data:(image\/[a-zA-Z+]+);base64,(.+)$/
        );
        if (match) {
          const detected = match[1];
          if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(detected)) {
            mediaType = detected as MediaType;
          }
          base64Data = match[2];
        }
      }

      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Data,
        },
      });
      content.push({
        type: "text",
        text: "Extrais toutes les informations de ce ticket de caisse : magasin, date, liste des produits avec prix, et total.",
      });
    } else {
      content.push({ type: "text", text: text });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content }],
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
      [
        item.name,
        item.price,
        parsed.date,
        parsed.store || null,
        receipt.id as number,
      ]
    );
    priceEntries.push(entryResult.rows[0]);
  }

  return Response.json({ receipt, items: priceEntries }, { status: 201 });
}
