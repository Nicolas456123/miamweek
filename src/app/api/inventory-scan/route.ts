import { query } from "@/db";

export const runtime = "nodejs";

type ScannedItem = {
  name: string;
  quantity: number;
  unit: string;
  expiry: string | null;
  packageSize?: number | null; // en g ou ml
  brand?: string | null;
  openedAt?: string | null; // ISO local "YYYY-MM-DDTHH:mm:ss" — null si fermé
  shelfLifeAfterOpenDays?: number | null;
  category?: string | null;
  location?: string | null;
};

const MOCK_PHOTO_RESULT: ScannedItem[] = [
  { name: "Lait", quantity: 1, unit: "L", expiry: null },
  { name: "Oeufs", quantity: 6, unit: "pcs", expiry: null },
  { name: "Beurre", quantity: 1, unit: "pcs", expiry: "2026-04-20" },
  { name: "Fromage râpé", quantity: 1, unit: "pcs", expiry: "2026-04-15" },
];

function buildMockTextResult(todayISO: string): ScannedItem[] {
  // Démo : "3 briques de crème fraîche semi-épaisse de 20 cl dont une ouverte aujourd'hui à 12h30"
  // Unité volumétrique (cl) préférée au contenant (brique). quantity = volume total du groupe.
  return [
    {
      name: "Crème fraîche semi-épaisse",
      quantity: 40, // 2 briques × 20 cl fermées
      unit: "cl",
      packageSize: 200,
      brand: null,
      expiry: null,
      openedAt: null,
      shelfLifeAfterOpenDays: null,
      category: "Produits laitiers",
      location: "frigo",
    },
    {
      name: "Crème fraîche semi-épaisse",
      quantity: 20, // 1 brique × 20 cl ouverte
      unit: "cl",
      packageSize: 200,
      brand: null,
      expiry: null,
      openedAt: `${todayISO}T12:30:00`,
      shelfLifeAfterOpenDays: 3,
      category: "Produits laitiers",
      location: "frigo",
    },
  ];
}

const PERISHABLE_KEYWORDS = [
  "lait", "crème", "yaourt", "fromage", "beurre", "oeuf", "viande", "poulet",
  "poisson", "saumon", "crevette", "jambon", "lardon", "steak", "salade",
  "champignon", "frais", "jus", "compote",
];

function isPerishable(name: string): boolean {
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
    let items: ScannedItem[];

    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const nowLocalISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19); // YYYY-MM-DDTHH:mm:ss en heure locale

    if (!apiKey) {
      items = image ? MOCK_PHOTO_RESULT : buildMockTextResult(todayISO);
    } else {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      const jsonSchema = `[{
  "name": "Nom normalisé du produit (ex: Crème fraîche semi-épaisse)",
  "quantity": 40,                        // quantité du groupe dans "unit" (pour 2 briques de 20 cl → 40 si unit=cl)
  "unit": "cl",                          // PRIORITÉ à l'unité de mesure (cl, ml, L, g, kg). Contenant (pcs, brique, pot, bout., boîte, sachet, tube, flacon, lot, roul.) seulement si aucune mesure donnée.
  "packageSize": 200,                    // taille d'UN exemplaire EN g OU ml (1 cl = 10 ml, 1 L = 1000 ml, 1 kg = 1000 g). null si inconnu.
  "brand": null,                         // marque si explicitement mentionnée, sinon null
  "expiry": null,                        // DLC format YYYY-MM-DD, null si non mentionnée
  "openedAt": null,                      // date+heure d'ouverture ISO locale pour CE groupe, ou null si fermé
  "shelfLifeAfterOpenDays": null,        // jours après ouverture (estime), null si groupe fermé ou non pertinent
  "category": "Produits laitiers",       // Fruits & Légumes, Viandes & Poissons, Produits laitiers, Épicerie, Boissons, Surgelés, Épices & Condiments, Autre
  "location": "frigo"                    // frigo, placard, congélateur
}]`;

      let systemPrompt: string;
      let userContent: Parameters<typeof client.messages.create>[0]["messages"][0]["content"];

      if (image) {
        systemPrompt = `Tu analyses une photo de produits alimentaires.
Identifie chaque produit visible et ses propriétés.
Date actuelle: ${todayISO}. Heure locale actuelle: ${nowLocalISO}.

Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de texte avant/après):
${jsonSchema}

Règles strictes:
- UNITÉ PRIORITAIRE: si la photo indique un volume/poids (cl, ml, L, g, kg), utilise CETTE unité et NON le type de contenant.
- quantity = total du groupe. Ex: 2 bouteilles de 1 L visibles → {quantity:2000, unit:"ml"} ou {quantity:2, unit:"L"}.
- packageSize = taille d'UN contenant EN g OU ml (1 cl = 10 ml, 1 L = 1000 ml, 1 kg = 1000 g).
- Si rien n'est ouvert, openedCount=0 et openedAt=null.
- Estime shelfLifeAfterOpenDays seulement pour produits périssables ouverts (lait ouvert: 3j, crème fraîche: 3-5j, jus: 5j, yaourt: ne se garde pas ouvert).`;

        const base64 = image.replace(/^data:image\/\w+;base64,/, "");
        const mediaType = image.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";
        userContent = [
          {
            type: "image" as const,
            source: { type: "base64" as const, media_type: mediaType as "image/jpeg", data: base64 },
          },
          { type: "text" as const, text: "Quels produits vois-tu ? Liste-les en JSON suivant le schéma." },
        ];
      } else {
        systemPrompt = `L'utilisateur décrit en langage naturel ce qu'il a chez lui.
Extrais chaque produit et ses propriétés détaillées.
Date actuelle: ${todayISO}. Heure locale actuelle: ${nowLocalISO}.

Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de texte avant/après):
${jsonSchema}

Règles strictes:
- UNITÉ PRIORITAIRE: quand une mesure (cl, ml, L, g, kg) est donnée, utilise CETTE unité et NON le contenant ("brique", "pot", etc.). Le contenant n'est utilisé QUE si aucune mesure n'est donnée.
- UN OBJET PAR GROUPE OUVERT/FERMÉ. Pour "3 briques de 20 cl dont 1 ouverte aujourd'hui à 12h30" → renvoie 2 objets :
  1. Groupe fermé : {"quantity":40,"unit":"cl","packageSize":200,"openedAt":null}
  2. Groupe ouvert : {"quantity":20,"unit":"cl","packageSize":200,"openedAt":"${todayISO}T12:30:00","shelfLifeAfterOpenDays":3}
- Si rien n'est ouvert → UN SEUL objet avec openedAt=null.
- packageSize = taille d'UN seul contenant EN g OU ml (1 cl = 10 ml, 1 L = 1000 ml, 1 kg = 1000 g, 1 dl = 100 ml).
- "aujourd'hui" = ${todayISO}. "hier" = date d'hier. "12h30", "14h", "à 8 heures" → HH:mm:ss.
- Estime shelfLifeAfterOpenDays seulement pour les groupes ouverts (lait/crème: 3-5j, jus: 5j, etc.).
- Si plusieurs produits différents sont mentionnés, renvoie un objet par groupe par produit.`;
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

    // Sauvegarde dans pantry_items : chaque item IA = une ligne (déjà splittée par groupe)
    const saved: Array<Record<string, unknown>> = [];
    for (const item of items) {
      const productResult = await query(
        "SELECT id, category FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1",
        [item.name]
      );
      const productId = productResult.rows.length > 0 ? (productResult.rows[0].id as number) : null;
      const productCategory = productResult.rows.length > 0
        ? (productResult.rows[0].category as string)
        : null;

      const category = item.category || productCategory || "Autre";
      const location = item.location || (isPerishable(item.name) ? "frigo" : "placard");

      await query(
        `INSERT INTO pantry_items
          (product_id, product_name, quantity, unit, category, location,
           expires_at, opened_at, shelf_life_after_open_days, package_size, brand)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          item.name,
          item.quantity,
          item.unit,
          category,
          location,
          item.expiry || null,
          item.openedAt ?? null,
          item.shelfLifeAfterOpenDays ?? null,
          item.packageSize ?? null,
          item.brand ?? null,
        ]
      );
      saved.push({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        openedAt: item.openedAt ?? null,
        packageSize: item.packageSize ?? null,
        brand: item.brand ?? null,
      });
    }

    return Response.json({ items: saved, count: saved.length });
  } catch (error) {
    console.error("Inventory scan error:", error);
    return Response.json({ error: "Scan failed", details: String(error) }, { status: 500 });
  }
}
