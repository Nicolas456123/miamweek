import { query } from "@/db";

export const runtime = "nodejs";

const MOCK_SUGGESTION = {
  entree: { name: "Salade verte", description: "Mâche, tomates cerises, vinaigrette" },
  dessert: { name: "Mousse au chocolat", description: "Légère et onctueuse" },
  boisson: { name: "Vin rouge", description: "Un côtes-du-rhône pour accompagner" },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platName, wantEntree, wantDessert, wantBoisson } = body;

    if (!platName) {
      return Response.json({ error: "platName is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const result: Record<string, unknown> = {};
      if (wantEntree) result.entree = MOCK_SUGGESTION.entree;
      if (wantDessert) result.dessert = MOCK_SUGGESTION.dessert;
      if (wantBoisson) result.boisson = MOCK_SUGGESTION.boisson;
      return Response.json({ suggestions: result, mock: true });
    }

    // Get inventory to suggest based on what's available
    let inventoryContext = "";
    try {
      const inv = await query(
        "SELECT p.name FROM stock_items s JOIN products p ON s.product_id = p.id WHERE s.status = 'ok'"
      );
      if (inv.rows.length > 0) {
        inventoryContext = `\nProduits disponibles en stock: ${inv.rows.map((r) => r.name).join(", ")}. Privilégie des suggestions utilisant ces produits si possible.`;
      }
    } catch { /* ignore */ }

    // Get food preferences
    let prefsContext = "";
    try {
      const prefs = await query("SELECT * FROM food_preferences");
      if (prefs.rows.length > 0) {
        const allergies = prefs.rows.filter((r) => r.type === "allergy").map((r) => r.name as string);
        const dislikes = prefs.rows.filter((r) => r.type === "dislike").map((r) => r.name as string);
        const loves = prefs.rows.filter((r) => r.type === "love").map((r) => r.name as string);
        const parts2: string[] = [];
        if (allergies.length > 0) parts2.push(`ALLERGIES (NE JAMAIS PROPOSER): ${allergies.join(", ")}`);
        if (dislikes.length > 0) parts2.push(`N'aime pas: ${dislikes.join(", ")}`);
        if (loves.length > 0) parts2.push(`Adore: ${loves.join(", ")}`);
        if (parts2.length > 0) prefsContext = `\n${parts2.join("\n")}`;
      }
    } catch { /* ignore */ }

    const parts = [];
    if (wantEntree) parts.push('"entree": {"name": "...", "description": "..."}');
    if (wantDessert) parts.push('"dessert": {"name": "...", "description": "..."}');
    if (wantBoisson) parts.push('"boisson": {"name": "...", "description": "..."}');

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `Tu es un chef cuisinier expert en accords mets.
Suggère des accompagnements pour un repas.
Réponds UNIQUEMENT en JSON valide (pas de markdown):
{${parts.join(", ")}}
Chaque suggestion doit avoir "name" (nom court) et "description" (1 ligne).
Les suggestions doivent bien s'accorder avec le plat principal.${inventoryContext}${prefsContext}`,
      messages: [{ role: "user", content: `Plat principal: ${platName}` }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return Response.json({ error: "No AI response" }, { status: 500 });
    }

    let suggestions;
    try {
      suggestions = JSON.parse(textContent.text);
    } catch {
      const match = textContent.text.match(/\{[\s\S]*\}/);
      if (match) suggestions = JSON.parse(match[0]);
      else return Response.json({ error: "Parse error" }, { status: 500 });
    }

    return Response.json({ suggestions, mock: false });
  } catch (error) {
    console.error("Menu suggest error:", error);
    return Response.json({ error: "Suggestion failed", details: String(error) }, { status: 500 });
  }
}
