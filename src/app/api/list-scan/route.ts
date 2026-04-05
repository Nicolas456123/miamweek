import { query } from "@/db";

export const runtime = "nodejs";

const MOCK_RESULT = [
  { name: "Lait", quantity: 1, unit: "L", category: "Produits laitiers" },
  { name: "Oeufs", quantity: 6, unit: "pcs", category: "Produits laitiers" },
  { name: "Beurre", quantity: 1, unit: "pcs", category: "Produits laitiers" },
  { name: "Pain", quantity: 1, unit: "pcs", category: "Boulangerie" },
];

const CATEGORIES = [
  "Fruits & Légumes", "Viandes & Poissons", "Produits laitiers",
  "Boulangerie", "Épicerie", "Surgelés", "Boissons",
  "Hygiène & Beauté", "Entretien & Maison", "Épices & Condiments", "Autre",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, text } = body;

    if (!image && !text) {
      return Response.json({ error: "image or text required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    let items: { name: string; quantity: number; unit: string; category: string }[];

    if (!apiKey) {
      items = MOCK_RESULT;
    } else {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      let systemPrompt: string;
      let userContent: Parameters<typeof client.messages.create>[0]["messages"][0]["content"];

      if (image) {
        systemPrompt = `Tu analyses une photo (ticket de caisse, liste manuscrite, produits, frigo, etc.).
Identifie chaque produit à acheter avec sa quantité.
Catégories possibles: ${CATEGORIES.join(", ")}.
Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de \`\`\`):
[{"name": "Produit", "quantity": 1, "unit": "pcs", "category": "Catégorie"}]
Unités: pcs, kg, g, L, mL, cl, lot, bout., boîte, sachet.
Si c'est un ticket de caisse, extrais les noms des produits achetés.
Si c'est une photo de frigo/placard, liste ce que tu vois.
Si c'est une liste manuscrite, lis les éléments.`;

        const base64 = image.replace(/^data:image\/\w+;base64,/, "");
        const mediaType = image.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";
        userContent = [
          {
            type: "image" as const,
            source: { type: "base64" as const, media_type: mediaType as "image/jpeg", data: base64 },
          },
          { type: "text" as const, text: "Quels produits dois-je ajouter à ma liste de courses ? Liste-les en JSON." },
        ];
      } else {
        systemPrompt = `L'utilisateur dicte ou tape des produits à ajouter à sa liste de courses.
Extrais chaque produit avec sa quantité et unité.
Catégories possibles: ${CATEGORIES.join(", ")}.
Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de \`\`\`):
[{"name": "Produit", "quantity": 1, "unit": "pcs", "category": "Catégorie"}]
Unités: pcs, kg, g, L, mL, cl, lot, bout., boîte, sachet.
Si l'utilisateur dit "du lait", mets quantity: 1, unit: "L".
Si "6 oeufs", mets quantity: 6, unit: "pcs".
Si "500g de farine", mets quantity: 500, unit: "g".`;
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

    // Add items to shopping list
    const added = [];
    for (const item of items) {
      // Try to match with product catalog
      const productResult = await query(
        "SELECT id, name, category, default_unit, default_quantity FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1",
        [item.name]
      );
      const product = productResult.rows.length > 0 ? productResult.rows[0] : null;

      const productId = product ? product.id as number : null;
      const productName = product ? product.name as string : item.name;
      const category = product ? product.category as string : (item.category || "Autre");
      const unit = item.unit || (product ? product.default_unit as string : "pcs");
      const quantity = item.quantity || (product ? product.default_quantity as number : 1);

      // Check if already in list (merge quantities)
      const existing = await query(
        "SELECT id, quantity FROM list_items WHERE LOWER(product_name) = LOWER(?) AND list_status = 'prep'",
        [productName]
      );

      if (existing.rows.length > 0) {
        const existingQty = existing.rows[0].quantity as number || 0;
        await query(
          "UPDATE list_items SET quantity = ? WHERE id = ?",
          [existingQty + quantity, existing.rows[0].id as number]
        );
        added.push({ ...item, productId, merged: true });
      } else {
        await query(
          "INSERT INTO list_items (product_id, product_name, quantity, unit, category, source, list_status) VALUES (?, ?, ?, ?, ?, 'scan', 'prep')",
          [productId, productName, quantity, unit, category]
        );
        added.push({ ...item, productId, merged: false });
      }
    }

    return Response.json({ items: added, count: added.length });
  } catch (error) {
    console.error("List scan error:", error);
    return Response.json({ error: "Scan failed", details: String(error) }, { status: 500 });
  }
}
