import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface ProductSeed {
  name: string;
  category: string;
  defaultUnit: string;
  icon: string;
}

const PRODUCTS: ProductSeed[] = [
  // ── Fruits & Légumes (~25) ────────────────────────────────────────
  { name: "Pommes", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🍎" },
  { name: "Bananes", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🍌" },
  { name: "Oranges", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🍊" },
  { name: "Citrons", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🍋" },
  { name: "Fraises", category: "Fruits & Légumes", defaultUnit: "g", icon: "🍓" },
  { name: "Tomates", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🍅" },
  { name: "Carottes", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🥕" },
  { name: "Oignons", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🧅" },
  { name: "Ail", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🧄" },
  { name: "Pommes de terre", category: "Fruits & Légumes", defaultUnit: "kg", icon: "🥔" },
  { name: "Courgettes", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥒" },
  { name: "Aubergines", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🍆" },
  { name: "Poivrons", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🫑" },
  { name: "Concombre", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥒" },
  { name: "Salade", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥬" },
  { name: "Champignons", category: "Fruits & Légumes", defaultUnit: "g", icon: "🍄" },
  { name: "Brocoli", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥦" },
  { name: "Haricots verts", category: "Fruits & Légumes", defaultUnit: "g", icon: "🫘" },
  { name: "Petits pois", category: "Fruits & Légumes", defaultUnit: "g", icon: "🫛" },
  { name: "Épinards", category: "Fruits & Légumes", defaultUnit: "g", icon: "🥬" },
  { name: "Avocat", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥑" },
  { name: "Mangue", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥭" },
  { name: "Ananas", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🍍" },
  { name: "Poireaux", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥬" },
  { name: "Chou", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥬" },
  { name: "Échalotes", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🧅" },
  { name: "Gingembre", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🫚" },
  { name: "Céleri", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🥬" },
  { name: "Betteraves", category: "Fruits & Légumes", defaultUnit: "pcs", icon: "🟣" },
  { name: "Radis", category: "Fruits & Légumes", defaultUnit: "botte", icon: "🔴" },
  { name: "Coriandre fraîche", category: "Fruits & Légumes", defaultUnit: "botte", icon: "🌿" },
  { name: "Persil frais", category: "Fruits & Légumes", defaultUnit: "botte", icon: "🌿" },
  { name: "Menthe fraîche", category: "Fruits & Légumes", defaultUnit: "botte", icon: "🌿" },

  // ── Viandes & Poissons (~15) ──────────────────────────────────────
  { name: "Poulet (filets)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🍗" },
  { name: "Poulet (entier)", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🍗" },
  { name: "Steak haché", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🥩" },
  { name: "Boeuf (bavette)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🥩" },
  { name: "Porc (côtes)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🥩" },
  { name: "Lardons", category: "Viandes & Poissons", defaultUnit: "g", icon: "🥓" },
  { name: "Jambon", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🍖" },
  { name: "Saucisses", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🌭" },
  { name: "Saumon", category: "Viandes & Poissons", defaultUnit: "g", icon: "🐟" },
  { name: "Cabillaud", category: "Viandes & Poissons", defaultUnit: "g", icon: "🐟" },
  { name: "Crevettes", category: "Viandes & Poissons", defaultUnit: "g", icon: "🦐" },
  { name: "Thon (frais)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🐟" },
  { name: "Dinde", category: "Viandes & Poissons", defaultUnit: "g", icon: "🍗" },
  { name: "Merguez", category: "Viandes & Poissons", defaultUnit: "pcs", icon: "🌭" },
  { name: "Agneau", category: "Viandes & Poissons", defaultUnit: "g", icon: "🍖" },
  { name: "Porc (échine)", category: "Viandes & Poissons", defaultUnit: "g", icon: "🥩" },

  // ── Produits laitiers (~15) ───────────────────────────────────────
  { name: "Lait", category: "Produits laitiers", defaultUnit: "L", icon: "🥛" },
  { name: "Beurre", category: "Produits laitiers", defaultUnit: "g", icon: "🧈" },
  { name: "Crème fraîche", category: "Produits laitiers", defaultUnit: "mL", icon: "🥛" },
  { name: "Yaourts nature", category: "Produits laitiers", defaultUnit: "lot", icon: "🥛" },
  { name: "Fromage râpé", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Comté", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Camembert", category: "Produits laitiers", defaultUnit: "pcs", icon: "🧀" },
  { name: "Mozzarella", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Parmesan", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Oeufs", category: "Produits laitiers", defaultUnit: "lot", icon: "🥚" },
  { name: "Crème liquide", category: "Produits laitiers", defaultUnit: "mL", icon: "🥛" },
  { name: "Fromage blanc", category: "Produits laitiers", defaultUnit: "g", icon: "🥛" },
  { name: "Chèvre frais", category: "Produits laitiers", defaultUnit: "pcs", icon: "🧀" },
  { name: "Mascarpone", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Ricotta", category: "Produits laitiers", defaultUnit: "g", icon: "🧀" },
  { name: "Lait de coco", category: "Produits laitiers", defaultUnit: "mL", icon: "🥥" },

  // ── Boulangerie (~8) ─────────────────────────────────────────────
  { name: "Pain de mie", category: "Boulangerie", defaultUnit: "pcs", icon: "🍞" },
  { name: "Baguette", category: "Boulangerie", defaultUnit: "pcs", icon: "🥖" },
  { name: "Croissants", category: "Boulangerie", defaultUnit: "pcs", icon: "🥐" },
  { name: "Pain complet", category: "Boulangerie", defaultUnit: "pcs", icon: "🍞" },
  { name: "Brioche", category: "Boulangerie", defaultUnit: "pcs", icon: "🍞" },
  { name: "Wraps/Tortillas", category: "Boulangerie", defaultUnit: "lot", icon: "🫓" },
  { name: "Pain burger", category: "Boulangerie", defaultUnit: "lot", icon: "🍔" },
  { name: "Biscottes", category: "Boulangerie", defaultUnit: "pcs", icon: "🍞" },
  { name: "Pâte feuilletée", category: "Boulangerie", defaultUnit: "pcs", icon: "🥧" },
  { name: "Pâte brisée", category: "Boulangerie", defaultUnit: "pcs", icon: "🥧" },

  // ── Épicerie (~25) ───────────────────────────────────────────────
  { name: "Pâtes", category: "Épicerie", defaultUnit: "g", icon: "🍝" },
  { name: "Riz", category: "Épicerie", defaultUnit: "g", icon: "🍚" },
  { name: "Semoule", category: "Épicerie", defaultUnit: "g", icon: "🌾" },
  { name: "Farine", category: "Épicerie", defaultUnit: "g", icon: "🌾" },
  { name: "Sucre", category: "Épicerie", defaultUnit: "g", icon: "🍬" },
  { name: "Sel", category: "Épicerie", defaultUnit: "g", icon: "🧂" },
  { name: "Poivre", category: "Épicerie", defaultUnit: "g", icon: "🌶️" },
  { name: "Huile d'olive", category: "Épicerie", defaultUnit: "L", icon: "🫒" },
  { name: "Huile tournesol", category: "Épicerie", defaultUnit: "L", icon: "🌻" },
  { name: "Vinaigre", category: "Épicerie", defaultUnit: "mL", icon: "🍶" },
  { name: "Moutarde", category: "Épicerie", defaultUnit: "pcs", icon: "🟡" },
  { name: "Ketchup", category: "Épicerie", defaultUnit: "pcs", icon: "🍅" },
  { name: "Mayonnaise", category: "Épicerie", defaultUnit: "pcs", icon: "🥚" },
  { name: "Sauce tomate", category: "Épicerie", defaultUnit: "boîte", icon: "🍅" },
  { name: "Concentré de tomates", category: "Épicerie", defaultUnit: "boîte", icon: "🍅" },
  { name: "Lentilles", category: "Épicerie", defaultUnit: "g", icon: "🫘" },
  { name: "Pois chiches", category: "Épicerie", defaultUnit: "boîte", icon: "🫘" },
  { name: "Conserves de thon", category: "Épicerie", defaultUnit: "boîte", icon: "🐟" },
  { name: "Conserves de maïs", category: "Épicerie", defaultUnit: "boîte", icon: "🌽" },
  { name: "Olives", category: "Épicerie", defaultUnit: "boîte", icon: "🫒" },
  { name: "Chocolat", category: "Épicerie", defaultUnit: "g", icon: "🍫" },
  { name: "Café", category: "Épicerie", defaultUnit: "g", icon: "☕" },
  { name: "Thé", category: "Épicerie", defaultUnit: "boîte", icon: "🍵" },
  { name: "Miel", category: "Épicerie", defaultUnit: "pcs", icon: "🍯" },
  { name: "Confiture", category: "Épicerie", defaultUnit: "pcs", icon: "🍓" },
  { name: "Nouilles chinoises", category: "Épicerie", defaultUnit: "g", icon: "🍜" },
  { name: "Haricots rouges", category: "Épicerie", defaultUnit: "boîte", icon: "🫘" },
  { name: "Chapelure", category: "Épicerie", defaultUnit: "g", icon: "🍞" },
  { name: "Maïzena", category: "Épicerie", defaultUnit: "g", icon: "🌾" },
  { name: "Vinaigre balsamique", category: "Épicerie", defaultUnit: "mL", icon: "🍶" },

  // ── Surgelés (~8) ────────────────────────────────────────────────
  { name: "Pizza surgelée", category: "Surgelés", defaultUnit: "pcs", icon: "🍕" },
  { name: "Légumes surgelés", category: "Surgelés", defaultUnit: "g", icon: "🥦" },
  { name: "Frites", category: "Surgelés", defaultUnit: "g", icon: "🍟" },
  { name: "Poisson pané", category: "Surgelés", defaultUnit: "pcs", icon: "🐟" },
  { name: "Glaces", category: "Surgelés", defaultUnit: "pcs", icon: "🍦" },
  { name: "Fruits surgelés", category: "Surgelés", defaultUnit: "g", icon: "🍓" },
  { name: "Nuggets", category: "Surgelés", defaultUnit: "g", icon: "🍗" },
  { name: "Épinards surgelés", category: "Surgelés", defaultUnit: "g", icon: "🥬" },

  // ── Boissons (~10) ───────────────────────────────────────────────
  { name: "Eau plate", category: "Boissons", defaultUnit: "L", icon: "💧" },
  { name: "Eau gazeuse", category: "Boissons", defaultUnit: "L", icon: "💧" },
  { name: "Jus d'orange", category: "Boissons", defaultUnit: "L", icon: "🍊" },
  { name: "Coca-Cola", category: "Boissons", defaultUnit: "L", icon: "🥤" },
  { name: "Bière", category: "Boissons", defaultUnit: "lot", icon: "🍺" },
  { name: "Vin rouge", category: "Boissons", defaultUnit: "pcs", icon: "🍷" },
  { name: "Vin blanc", category: "Boissons", defaultUnit: "pcs", icon: "🥂" },
  { name: "Lait d'amande", category: "Boissons", defaultUnit: "L", icon: "🥛" },
  { name: "Sirop", category: "Boissons", defaultUnit: "pcs", icon: "🍹" },
  { name: "Café moulu", category: "Boissons", defaultUnit: "g", icon: "☕" },

  // ── Hygiène & Beauté (~15) ───────────────────────────────────────
  { name: "Savon", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🧼" },
  { name: "Gel douche", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🚿" },
  { name: "Shampoing", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🧴" },
  { name: "Dentifrice", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🪥" },
  { name: "Brosse à dents", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🪥" },
  { name: "Déodorant", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🧴" },
  { name: "Cotons", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🩹" },
  { name: "Mouchoirs", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🤧" },
  { name: "Papier toilette", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🧻" },
  { name: "Rasoirs", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🪒" },
  { name: "Crème hydratante", category: "Hygiène & Beauté", defaultUnit: "pcs", icon: "🧴" },
  { name: "Serviettes hygiéniques", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "🩹" },
  { name: "Lessive (capsules)", category: "Hygiène & Beauté", defaultUnit: "boîte", icon: "🧺" },
  { name: "Lingettes bébé", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "👶" },
  { name: "Couches", category: "Hygiène & Beauté", defaultUnit: "lot", icon: "👶" },

  // ── Entretien & Maison (~15) ─────────────────────────────────────
  { name: "Sopalin", category: "Entretien & Maison", defaultUnit: "lot", icon: "🧻" },
  { name: "Éponges", category: "Entretien & Maison", defaultUnit: "lot", icon: "🧽" },
  { name: "Liquide vaisselle", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🧴" },
  { name: "Produit multi-surfaces", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🧹" },
  { name: "Javel", category: "Entretien & Maison", defaultUnit: "L", icon: "🧪" },
  { name: "Sacs poubelle", category: "Entretien & Maison", defaultUnit: "lot", icon: "🗑️" },
  { name: "Film alimentaire", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🎞️" },
  { name: "Papier aluminium", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🔲" },
  { name: "Lessive", category: "Entretien & Maison", defaultUnit: "L", icon: "🧺" },
  { name: "Adoucissant", category: "Entretien & Maison", defaultUnit: "L", icon: "🌸" },
  { name: "Produit vitres", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🪟" },
  { name: "Balai/serpillère (recharge)", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🧹" },
  { name: "Désodorisant", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🌿" },
  { name: "Produit WC", category: "Entretien & Maison", defaultUnit: "pcs", icon: "🚽" },
  { name: "Pastilles lave-vaisselle", category: "Entretien & Maison", defaultUnit: "boîte", icon: "💊" },

  // ── Épices & Condiments (~10) ────────────────────────────────────
  { name: "Herbes de Provence", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌿" },
  { name: "Curry", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🟡" },
  { name: "Paprika", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌶️" },
  { name: "Cumin", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🟤" },
  { name: "Cannelle", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🟤" },
  { name: "Basilic sec", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌿" },
  { name: "Persil sec", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌿" },
  { name: "Sauce soja", category: "Épices & Condiments", defaultUnit: "mL", icon: "🍶" },
  { name: "Bouillon cube", category: "Épices & Condiments", defaultUnit: "boîte", icon: "🧊" },
  { name: "Levure", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🍞" },
  { name: "Piment d'Espelette", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🌶️" },
  { name: "Nuoc-mâm", category: "Épices & Condiments", defaultUnit: "mL", icon: "🍶" },
  { name: "Huile de sésame", category: "Épices & Condiments", defaultUnit: "mL", icon: "🫒" },
  { name: "Pâte de curry", category: "Épices & Condiments", defaultUnit: "pcs", icon: "🟡" },
];

// ── Types for detailed recipes ──────────────────────────────────────

interface RecipeSeed {
  name: string;
  description: string;
  servings: number;
  category: string;
  prepTime: number;
  cookTime: number;
  difficulty: "facile" | "moyen" | "difficile";
  utensils: string[];
  steps: string[];
  ingredients: [string, number, string, string][]; // [name, qty, unit, category]
}

const RECIPES: RecipeSeed[] = [
  // ═══════════════ FRANÇAIS ═══════════════
  {
    name: "Pâtes carbonara",
    description: "Les vraies pâtes carbonara crémeuses aux lardons, oeufs et parmesan. Un classique italien rapide et réconfortant.",
    servings: 2, category: "Italien", prepTime: 10, cookTime: 15, difficulty: "facile",
    utensils: ["casserole", "poêle", "saladier", "fouet"],
    steps: [
      "Faire bouillir un grand volume d'eau salée dans la casserole.",
      "Cuire les pâtes selon le temps indiqué sur le paquet, les égoutter en gardant un peu d'eau de cuisson.",
      "Pendant ce temps, faire revenir les lardons dans la poêle sans matière grasse pendant 5 minutes jusqu'à ce qu'ils soient dorés.",
      "Dans le saladier, fouetter les oeufs entiers avec le parmesan râpé et le poivre.",
      "Hors du feu, verser les pâtes chaudes sur les lardons, puis ajouter le mélange oeufs-parmesan.",
      "Mélanger vigoureusement en ajoutant un peu d'eau de cuisson pour obtenir une sauce crémeuse. Servir immédiatement."
    ],
    ingredients: [
      ["Pâtes", 200, "g", "Épicerie"],
      ["Lardons", 150, "g", "Viandes & Poissons"],
      ["Oeufs", 2, "pcs", "Produits laitiers"],
      ["Parmesan", 50, "g", "Produits laitiers"],
      ["Poivre", 2, "g", "Épicerie"],
    ],
  },
  {
    name: "Pâtes bolognaise",
    description: "Pâtes nappées d'une sauce tomate mijotée à la viande hachée, un plat familial par excellence.",
    servings: 2, category: "Italien", prepTime: 10, cookTime: 30, difficulty: "facile",
    utensils: ["casserole", "grande poêle", "planche à découper", "couteau"],
    steps: [
      "Émincer finement l'oignon et l'ail.",
      "Faire chauffer l'huile d'olive dans la grande poêle et faire revenir l'oignon 3 minutes.",
      "Ajouter la viande hachée, la faire dorer en l'émiettant à la spatule pendant 5 minutes.",
      "Ajouter l'ail, la sauce tomate, saler et poivrer. Laisser mijoter 20 minutes à feu doux.",
      "Pendant ce temps, cuire les pâtes dans un grand volume d'eau bouillante salée.",
      "Égoutter les pâtes, les servir nappées de sauce bolognaise et parsemer de fromage râpé."
    ],
    ingredients: [
      ["Pâtes", 200, "g", "Épicerie"],
      ["Steak haché", 2, "pcs", "Viandes & Poissons"],
      ["Sauce tomate", 1, "boîte", "Épicerie"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Ail", 1, "pcs", "Fruits & Légumes"],
      ["Huile d'olive", 15, "mL", "Épicerie"],
      ["Fromage râpé", 40, "g", "Produits laitiers"],
    ],
  },
  {
    name: "Croque-monsieur",
    description: "Sandwich grillé au jambon et fromage fondant, croustillant à l'extérieur et moelleux à l'intérieur.",
    servings: 2, category: "Français", prepTime: 5, cookTime: 10, difficulty: "facile",
    utensils: ["poêle ou appareil à croque", "couteau"],
    steps: [
      "Beurrer les tranches de pain de mie sur un côté.",
      "Disposer le jambon et le fromage râpé entre deux tranches (beurre à l'extérieur).",
      "Faire cuire dans la poêle ou l'appareil à croque-monsieur 3-4 min par face jusqu'à ce que le pain soit doré et le fromage fondu.",
      "Servir chaud avec une salade verte si désiré."
    ],
    ingredients: [
      ["Pain de mie", 4, "pcs", "Boulangerie"],
      ["Jambon", 2, "pcs", "Viandes & Poissons"],
      ["Fromage râpé", 80, "g", "Produits laitiers"],
      ["Beurre", 20, "g", "Produits laitiers"],
    ],
  },
  {
    name: "Omelette aux champignons",
    description: "Omelette baveuse garnie de champignons poêlés au beurre et persil, un classique rapide.",
    servings: 2, category: "Français", prepTime: 5, cookTime: 10, difficulty: "facile",
    utensils: ["poêle antiadhésive", "saladier", "fouet", "spatule"],
    steps: [
      "Nettoyer et émincer les champignons.",
      "Faire fondre la moitié du beurre dans la poêle et faire sauter les champignons 5 min à feu vif.",
      "Battre les oeufs dans le saladier avec sel, poivre et persil.",
      "Retirer les champignons, ajouter le reste du beurre dans la poêle.",
      "Verser les oeufs battus, cuire 2 min à feu moyen puis ajouter les champignons sur une moitié.",
      "Replier l'omelette et servir immédiatement."
    ],
    ingredients: [
      ["Oeufs", 4, "pcs", "Produits laitiers"],
      ["Champignons", 150, "g", "Fruits & Légumes"],
      ["Beurre", 15, "g", "Produits laitiers"],
      ["Sel", 2, "g", "Épicerie"],
      ["Poivre", 1, "g", "Épicerie"],
      ["Persil sec", 1, "pcs", "Épices & Condiments"],
    ],
  },
  {
    name: "Poulet rôti",
    description: "Poulet entier rôti au four avec pommes de terre fondantes, herbes de Provence et ail. Le repas du dimanche.",
    servings: 4, category: "Français", prepTime: 15, cookTime: 75, difficulty: "moyen",
    utensils: ["plat à four", "four", "couteau", "pinceau de cuisine"],
    steps: [
      "Préchauffer le four à 200°C.",
      "Frotter le poulet avec l'huile d'olive, le beurre ramolli, les herbes de Provence, sel et poivre.",
      "Glisser les gousses d'ail épluchées à l'intérieur du poulet.",
      "Couper les pommes de terre en quartiers et les disposer autour du poulet dans le plat.",
      "Enfourner pour 1h15, en arrosant le poulet avec son jus toutes les 20 minutes.",
      "Le poulet est cuit quand le jus qui s'écoule de la cuisse est clair.",
      "Laisser reposer 10 minutes avant de découper et servir."
    ],
    ingredients: [
      ["Poulet (entier)", 1, "pcs", "Viandes & Poissons"],
      ["Pommes de terre", 500, "g", "Fruits & Légumes"],
      ["Herbes de Provence", 1, "pot", "Épices & Condiments"],
      ["Beurre", 30, "g", "Produits laitiers"],
      ["Ail", 3, "pcs", "Fruits & Légumes"],
      ["Huile d'olive", 30, "mL", "Épicerie"],
    ],
  },
  {
    name: "Gratin dauphinois",
    description: "Gratin crémeux de pommes de terre tranché finement, cuit au four avec crème et lait. Fondant et réconfortant.",
    servings: 4, category: "Français", prepTime: 20, cookTime: 60, difficulty: "facile",
    utensils: ["plat à gratin", "four", "mandoline ou couteau", "casserole"],
    steps: [
      "Préchauffer le four à 180°C.",
      "Éplucher et couper les pommes de terre en fines rondelles (2-3mm).",
      "Frotter le plat à gratin avec l'ail coupé en deux puis le beurrer.",
      "Disposer les rondelles de pommes de terre en couches dans le plat.",
      "Mélanger la crème et le lait, saler, poivrer et muscader, verser sur les pommes de terre.",
      "Parsemer de fromage râpé et enfourner 1h jusqu'à ce que le dessus soit doré.",
      "Laisser reposer 5 min avant de servir."
    ],
    ingredients: [
      ["Pommes de terre", 800, "g", "Fruits & Légumes"],
      ["Crème liquide", 300, "mL", "Produits laitiers"],
      ["Lait", 200, "mL", "Produits laitiers"],
      ["Ail", 1, "pcs", "Fruits & Légumes"],
      ["Beurre", 15, "g", "Produits laitiers"],
      ["Fromage râpé", 50, "g", "Produits laitiers"],
    ],
  },
  {
    name: "Quiche lorraine",
    description: "Tarte salée traditionnelle aux lardons et crème, sur une pâte brisée croustillante.",
    servings: 4, category: "Français", prepTime: 15, cookTime: 35, difficulty: "moyen",
    utensils: ["moule à tarte", "four", "saladier", "fouet", "poêle"],
    steps: [
      "Préchauffer le four à 190°C.",
      "Étaler la pâte brisée dans le moule à tarte et piquer le fond avec une fourchette.",
      "Faire revenir les lardons à sec dans la poêle pendant 3 minutes.",
      "Répartir les lardons sur la pâte.",
      "Dans le saladier, fouetter les oeufs avec la crème, saler légèrement et poivrer.",
      "Verser l'appareil sur les lardons, parsemer de fromage râpé.",
      "Enfourner 30-35 min jusqu'à ce que la quiche soit dorée et gonflée.",
      "Laisser tiédir 5 min avant de servir."
    ],
    ingredients: [
      ["Pâte brisée", 1, "pcs", "Boulangerie"],
      ["Oeufs", 3, "pcs", "Produits laitiers"],
      ["Lardons", 150, "g", "Viandes & Poissons"],
      ["Crème liquide", 200, "mL", "Produits laitiers"],
      ["Fromage râpé", 60, "g", "Produits laitiers"],
    ],
  },
  {
    name: "Ratatouille",
    description: "Mélange de légumes du soleil mijotés à l'huile d'olive avec ail et herbes de Provence.",
    servings: 4, category: "Français", prepTime: 20, cookTime: 40, difficulty: "facile",
    utensils: ["grande cocotte ou faitout", "planche à découper", "couteau"],
    steps: [
      "Laver et couper tous les légumes en cubes de taille similaire (2cm).",
      "Faire chauffer l'huile d'olive dans la cocotte à feu moyen.",
      "Faire revenir les oignons et l'ail 3 minutes.",
      "Ajouter les aubergines et les poivrons, cuire 5 min en remuant.",
      "Ajouter les courgettes et les tomates, mélanger.",
      "Ajouter les herbes de Provence, saler et poivrer.",
      "Couvrir et laisser mijoter 30 min à feu doux en remuant de temps en temps.",
      "Servir chaud en accompagnement ou froid en entrée."
    ],
    ingredients: [
      ["Courgettes", 2, "pcs", "Fruits & Légumes"],
      ["Aubergines", 1, "pcs", "Fruits & Légumes"],
      ["Poivrons", 2, "pcs", "Fruits & Légumes"],
      ["Tomates", 4, "pcs", "Fruits & Légumes"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Ail", 2, "pcs", "Fruits & Légumes"],
      ["Herbes de Provence", 1, "pot", "Épices & Condiments"],
      ["Huile d'olive", 30, "mL", "Épicerie"],
    ],
  },
  {
    name: "Blanquette de veau",
    description: "Ragoût de viande crémeux avec carottes et champignons dans une sauce blanche onctueuse.",
    servings: 4, category: "Français", prepTime: 20, cookTime: 90, difficulty: "moyen",
    utensils: ["grande cocotte", "casserole", "fouet", "couteau", "passoire"],
    steps: [
      "Couper la viande en cubes de 3cm, les mettre dans la cocotte couverts d'eau froide.",
      "Porter à ébullition, écumer, puis ajouter les oignons coupés et les carottes en rondelles.",
      "Ajouter le bouillon cube, couvrir et laisser mijoter 1h à feu doux.",
      "Pendant ce temps, faire sauter les champignons dans du beurre.",
      "Préparer un roux : faire fondre le beurre dans la casserole, ajouter la farine, mélanger 2 min.",
      "Prélever du bouillon de cuisson et l'incorporer au roux en fouettant pour obtenir une sauce lisse.",
      "Ajouter la crème fraîche, les champignons à la sauce. Verser sur la viande.",
      "Servir avec du riz blanc."
    ],
    ingredients: [
      ["Boeuf (bavette)", 500, "g", "Viandes & Poissons"],
      ["Carottes", 3, "pcs", "Fruits & Légumes"],
      ["Champignons", 200, "g", "Fruits & Légumes"],
      ["Oignons", 2, "pcs", "Fruits & Légumes"],
      ["Crème fraîche", 150, "mL", "Produits laitiers"],
      ["Bouillon cube", 2, "pcs", "Épices & Condiments"],
      ["Beurre", 30, "g", "Produits laitiers"],
      ["Farine", 30, "g", "Épicerie"],
    ],
  },
  {
    name: "Soupe de légumes",
    description: "Soupe maison aux légumes de saison, veloutée et réconfortante pour les soirées fraîches.",
    servings: 4, category: "Français", prepTime: 15, cookTime: 30, difficulty: "facile",
    utensils: ["grande casserole", "mixeur plongeant", "couteau", "planche à découper"],
    steps: [
      "Éplucher et couper tous les légumes en morceaux.",
      "Faire fondre le beurre dans la casserole et faire revenir les oignons 3 min.",
      "Ajouter tous les légumes et le bouillon cube émietté.",
      "Couvrir d'eau (environ 1L) et porter à ébullition.",
      "Laisser cuire 25 min à feu moyen jusqu'à ce que les légumes soient tendres.",
      "Mixer avec le mixeur plongeant jusqu'à obtenir une consistance veloutée.",
      "Assaisonner, servir avec des croûtons ou une tranche de pain."
    ],
    ingredients: [
      ["Carottes", 3, "pcs", "Fruits & Légumes"],
      ["Pommes de terre", 200, "g", "Fruits & Légumes"],
      ["Poireaux", 1, "pcs", "Fruits & Légumes"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Bouillon cube", 1, "pcs", "Épices & Condiments"],
      ["Beurre", 15, "g", "Produits laitiers"],
    ],
  },
  {
    name: "Steak frites",
    description: "Bavette de boeuf grillée accompagnée de frites dorées maison. Simple et efficace.",
    servings: 2, category: "Français", prepTime: 15, cookTime: 25, difficulty: "moyen",
    utensils: ["friteuse ou grande poêle profonde", "poêle en fonte", "couteau", "économe"],
    steps: [
      "Éplucher les pommes de terre et les couper en bâtonnets de 1cm.",
      "Rincer et bien sécher les frites avec un torchon.",
      "Faire chauffer l'huile à 170°C et cuire les frites une première fois 5 min. Les égoutter.",
      "Monter l'huile à 180°C et replonger les frites 3 min pour les rendre croustillantes.",
      "Pendant ce temps, saler et poivrer les steaks, faire chauffer la poêle en fonte très chaude avec le beurre.",
      "Cuire les steaks 2-3 min par face (à ajuster selon la cuisson souhaitée).",
      "Servir immédiatement avec les frites bien chaudes."
    ],
    ingredients: [
      ["Boeuf (bavette)", 300, "g", "Viandes & Poissons"],
      ["Pommes de terre", 400, "g", "Fruits & Légumes"],
      ["Huile tournesol", 50, "mL", "Épicerie"],
      ["Beurre", 20, "g", "Produits laitiers"],
      ["Sel", 2, "g", "Épicerie"],
      ["Poivre", 1, "g", "Épicerie"],
    ],
  },
  {
    name: "Salade niçoise",
    description: "Salade composée du sud de la France avec thon, oeufs durs, olives, haricots verts et tomates.",
    servings: 2, category: "Français", prepTime: 15, cookTime: 15, difficulty: "facile",
    utensils: ["casserole", "saladier", "couteau", "planche à découper"],
    steps: [
      "Cuire les oeufs durs 10 min dans l'eau bouillante, les refroidir et les écaler.",
      "Cuire les haricots verts à l'eau bouillante salée 8 min, les passer sous l'eau froide.",
      "Laver et couper les tomates en quartiers.",
      "Dans le saladier, disposer la salade lavée et essorée.",
      "Ajouter les tomates, les haricots verts, les oeufs coupés en quartiers, le thon émietté et les olives.",
      "Assaisonner avec l'huile d'olive, un filet de vinaigre, sel et poivre. Servir frais."
    ],
    ingredients: [
      ["Salade", 1, "pcs", "Fruits & Légumes"],
      ["Tomates", 2, "pcs", "Fruits & Légumes"],
      ["Oeufs", 2, "pcs", "Produits laitiers"],
      ["Conserves de thon", 1, "boîte", "Épicerie"],
      ["Olives", 50, "g", "Épicerie"],
      ["Haricots verts", 100, "g", "Fruits & Légumes"],
      ["Huile d'olive", 20, "mL", "Épicerie"],
    ],
  },
  {
    name: "Croque madame",
    description: "Version gourmande du croque-monsieur avec un oeuf au plat sur le dessus.",
    servings: 2, category: "Français", prepTime: 5, cookTime: 10, difficulty: "facile",
    utensils: ["poêle", "spatule"],
    steps: [
      "Beurrer les tranches de pain de mie.",
      "Garnir de jambon et fromage râpé, fermer les sandwiches.",
      "Faire dorer dans la poêle 3 min de chaque côté.",
      "Dans la même poêle, cuire les oeufs au plat.",
      "Déposer un oeuf sur chaque croque et servir immédiatement."
    ],
    ingredients: [
      ["Pain de mie", 4, "pcs", "Boulangerie"],
      ["Jambon", 2, "pcs", "Viandes & Poissons"],
      ["Fromage râpé", 80, "g", "Produits laitiers"],
      ["Oeufs", 2, "pcs", "Produits laitiers"],
      ["Beurre", 20, "g", "Produits laitiers"],
    ],
  },

  // ═══════════════ ITALIEN ═══════════════
  {
    name: "Risotto aux champignons",
    description: "Riz crémeux cuit lentement au bouillon avec des champignons poêlés et du parmesan.",
    servings: 2, category: "Italien", prepTime: 10, cookTime: 25, difficulty: "moyen",
    utensils: ["casserole", "poêle", "louche", "cuillère en bois"],
    steps: [
      "Préparer le bouillon chaud dans la casserole avec les cubes de bouillon.",
      "Émincer l'oignon et faire revenir dans la poêle avec du beurre 3 min.",
      "Ajouter le riz et faire nacrer 2 min en remuant.",
      "Ajouter le vin blanc et remuer jusqu'à absorption.",
      "Ajouter le bouillon chaud louche par louche en remuant régulièrement (18-20 min).",
      "Pendant ce temps, faire sauter les champignons à part dans du beurre.",
      "Quand le riz est al dente et crémeux, incorporer le parmesan, les champignons et un peu de beurre.",
      "Servir immédiatement dans des assiettes creuses."
    ],
    ingredients: [
      ["Riz", 200, "g", "Épicerie"],
      ["Champignons", 200, "g", "Fruits & Légumes"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Parmesan", 50, "g", "Produits laitiers"],
      ["Beurre", 20, "g", "Produits laitiers"],
      ["Bouillon cube", 1, "pcs", "Épices & Condiments"],
      ["Vin blanc", 50, "mL", "Boissons"],
    ],
  },
  {
    name: "Pizza maison",
    description: "Pizza faite maison avec une pâte moelleuse et croustillante, garnie de sauce tomate, mozzarella et jambon.",
    servings: 2, category: "Italien", prepTime: 90, cookTime: 15, difficulty: "moyen",
    utensils: ["saladier", "rouleau à pâtisserie", "plaque de four", "four"],
    steps: [
      "Mélanger la farine, la levure, une pincée de sel et l'huile d'olive. Ajouter 150mL d'eau tiède.",
      "Pétrir 10 min jusqu'à obtenir une pâte souple et élastique.",
      "Laisser reposer 1h sous un torchon dans un endroit tiède.",
      "Préchauffer le four au maximum (240-250°C).",
      "Étaler la pâte sur la plaque farinée en un cercle fin.",
      "Étaler la sauce tomate, répartir la mozzarella en morceaux et le jambon.",
      "Enfourner 12-15 min jusqu'à ce que la pâte soit dorée et le fromage bullant.",
      "Sortir, ajouter un filet d'huile d'olive et servir."
    ],
    ingredients: [
      ["Farine", 250, "g", "Épicerie"],
      ["Levure", 1, "sachet", "Épices & Condiments"],
      ["Sauce tomate", 1, "boîte", "Épicerie"],
      ["Mozzarella", 125, "g", "Produits laitiers"],
      ["Jambon", 2, "pcs", "Viandes & Poissons"],
      ["Champignons", 100, "g", "Fruits & Légumes"],
      ["Huile d'olive", 15, "mL", "Épicerie"],
    ],
  },
  {
    name: "Lasagnes",
    description: "Lasagnes bolognaise gratinées au four avec béchamel maison, un plat généreux pour toute la famille.",
    servings: 4, category: "Italien", prepTime: 25, cookTime: 45, difficulty: "moyen",
    utensils: ["plat à gratin", "2 casseroles", "grande poêle", "four", "fouet"],
    steps: [
      "Préparer la bolognaise : faire revenir l'oignon émincé, ajouter la viande hachée, puis la sauce tomate. Mijoter 15 min.",
      "Préparer la béchamel : faire fondre le beurre, ajouter la farine, mélanger. Verser le lait progressivement en fouettant.",
      "Cuire la béchamel 5 min en remuant jusqu'à épaississement.",
      "Préchauffer le four à 180°C.",
      "Dans le plat à gratin, alterner les couches : sauce bolognaise, feuilles de lasagne, béchamel.",
      "Terminer par la béchamel et parsemer généreusement de fromage râpé.",
      "Enfourner 35-40 min jusqu'à ce que le dessus soit bien doré.",
      "Laisser reposer 10 min avant de servir."
    ],
    ingredients: [
      ["Pâtes", 250, "g", "Épicerie"],
      ["Steak haché", 4, "pcs", "Viandes & Poissons"],
      ["Sauce tomate", 2, "boîte", "Épicerie"],
      ["Fromage râpé", 150, "g", "Produits laitiers"],
      ["Lait", 500, "mL", "Produits laitiers"],
      ["Beurre", 40, "g", "Produits laitiers"],
      ["Farine", 40, "g", "Épicerie"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
    ],
  },
  {
    name: "Pâtes au pesto",
    description: "Pâtes simples et parfumées au pesto de basilic, pignons et parmesan.",
    servings: 2, category: "Italien", prepTime: 5, cookTime: 12, difficulty: "facile",
    utensils: ["casserole", "passoire"],
    steps: [
      "Cuire les pâtes dans un grand volume d'eau bouillante salée selon les indications du paquet.",
      "Garder une louche d'eau de cuisson avant d'égoutter.",
      "Dans la casserole encore chaude, mélanger les pâtes avec le pesto et un peu d'eau de cuisson pour lier.",
      "Servir avec du parmesan râpé et un filet d'huile d'olive."
    ],
    ingredients: [
      ["Pâtes", 200, "g", "Épicerie"],
      ["Basilic sec", 1, "pcs", "Épices & Condiments"],
      ["Parmesan", 40, "g", "Produits laitiers"],
      ["Huile d'olive", 30, "mL", "Épicerie"],
    ],
  },

  // ═══════════════ ASIATIQUE ═══════════════
  {
    name: "Curry de poulet",
    description: "Poulet mijoté dans une sauce curry onctueuse au lait de coco, servi avec du riz basmati.",
    servings: 2, category: "Asiatique", prepTime: 10, cookTime: 25, difficulty: "facile",
    utensils: ["grande poêle ou wok", "casserole", "couteau", "planche à découper"],
    steps: [
      "Couper le poulet en cubes de 2cm.",
      "Émincer l'oignon et couper les tomates en dés.",
      "Faire chauffer un peu d'huile dans la poêle et faire dorer le poulet 5 min. Réserver.",
      "Dans la même poêle, faire revenir l'oignon 3 min, ajouter le curry et remuer 1 min.",
      "Ajouter les tomates, la crème et le poulet. Laisser mijoter 15 min à feu doux.",
      "Pendant ce temps, cuire le riz dans la casserole.",
      "Servir le curry sur le riz, avec de la coriandre fraîche si disponible."
    ],
    ingredients: [
      ["Poulet (filets)", 250, "g", "Viandes & Poissons"],
      ["Curry", 1, "pot", "Épices & Condiments"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Riz", 150, "g", "Épicerie"],
      ["Crème liquide", 200, "mL", "Produits laitiers"],
      ["Tomates", 2, "pcs", "Fruits & Légumes"],
    ],
  },
  {
    name: "Pad thaï",
    description: "Nouilles sautées aux crevettes, oeufs, citron vert et sauce soja. Le street food thaïlandais par excellence.",
    servings: 2, category: "Asiatique", prepTime: 15, cookTime: 10, difficulty: "moyen",
    utensils: ["wok ou grande poêle", "casserole", "couteau"],
    steps: [
      "Faire tremper les nouilles dans de l'eau chaude 5 min (ou cuire selon les indications).",
      "Battre les oeufs dans un bol.",
      "Chauffer le wok à feu vif avec un peu d'huile.",
      "Faire sauter les crevettes 2 min, puis les pousser sur le côté.",
      "Verser les oeufs battus, brouiller rapidement.",
      "Ajouter les nouilles égouttées, la sauce soja et l'oignon émincé. Sauter 3 min.",
      "Presser le jus de citron, mélanger et servir immédiatement."
    ],
    ingredients: [
      ["Nouilles chinoises", 200, "g", "Épicerie"],
      ["Crevettes", 150, "g", "Viandes & Poissons"],
      ["Oeufs", 2, "pcs", "Produits laitiers"],
      ["Sauce soja", 30, "mL", "Épices & Condiments"],
      ["Citrons", 1, "pcs", "Fruits & Légumes"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
    ],
  },
  {
    name: "Wok de légumes au tofu",
    description: "Légumes croquants sautés au wok avec sauce soja et sésame, option végétarienne.",
    servings: 2, category: "Asiatique", prepTime: 15, cookTime: 10, difficulty: "facile",
    utensils: ["wok ou grande poêle", "casserole", "couteau", "planche à découper"],
    steps: [
      "Laver et couper tous les légumes en lamelles fines ou julienne.",
      "Cuire le riz dans la casserole.",
      "Chauffer le wok à feu vif avec l'huile.",
      "Faire sauter les carottes 2 min (elles sont les plus dures).",
      "Ajouter les poivrons et les courgettes, sauter 2 min.",
      "Ajouter les champignons et la sauce soja, sauter encore 2 min.",
      "Les légumes doivent rester croquants. Servir sur le riz."
    ],
    ingredients: [
      ["Poivrons", 2, "pcs", "Fruits & Légumes"],
      ["Courgettes", 1, "pcs", "Fruits & Légumes"],
      ["Carottes", 2, "pcs", "Fruits & Légumes"],
      ["Champignons", 100, "g", "Fruits & Légumes"],
      ["Sauce soja", 30, "mL", "Épices & Condiments"],
      ["Riz", 150, "g", "Épicerie"],
      ["Huile tournesol", 15, "mL", "Épicerie"],
    ],
  },
  {
    name: "Poulet tikka masala",
    description: "Poulet mariné dans une sauce tomate épicée et crémeuse, un classique des restaurants indiens.",
    servings: 4, category: "Asiatique", prepTime: 15, cookTime: 30, difficulty: "moyen",
    utensils: ["grande poêle", "casserole", "saladier", "couteau"],
    steps: [
      "Couper le poulet en morceaux et le mélanger avec le curry et le paprika dans le saladier.",
      "Émincer les oignons et l'ail.",
      "Faire chauffer l'huile dans la poêle et dorer le poulet mariné 5 min. Réserver.",
      "Faire revenir les oignons et l'ail 3 min dans la même poêle.",
      "Ajouter la sauce tomate, la crème, le poulet. Mélanger.",
      "Laisser mijoter 20 min à feu doux, la sauce doit épaissir.",
      "Cuire le riz dans la casserole.",
      "Servir le tikka masala sur le riz."
    ],
    ingredients: [
      ["Poulet (filets)", 400, "g", "Viandes & Poissons"],
      ["Sauce tomate", 1, "boîte", "Épicerie"],
      ["Crème liquide", 200, "mL", "Produits laitiers"],
      ["Oignons", 2, "pcs", "Fruits & Légumes"],
      ["Curry", 1, "pot", "Épices & Condiments"],
      ["Riz", 200, "g", "Épicerie"],
      ["Ail", 2, "pcs", "Fruits & Légumes"],
      ["Paprika", 1, "pot", "Épices & Condiments"],
    ],
  },
  {
    name: "Riz sauté aux crevettes",
    description: "Riz sauté à la façon cantonaise avec crevettes, oeufs et légumes croquants.",
    servings: 2, category: "Asiatique", prepTime: 10, cookTime: 10, difficulty: "facile",
    utensils: ["wok ou grande poêle", "couteau"],
    steps: [
      "Idéalement utiliser du riz cuit de la veille (froid).",
      "Battre les oeufs dans un bol.",
      "Chauffer le wok à feu très vif avec l'huile.",
      "Faire sauter les crevettes 2 min, réserver.",
      "Verser les oeufs battus, brouiller 30 sec.",
      "Ajouter le riz froid, sauter vigoureusement 3-4 min en cassant les grumeaux.",
      "Ajouter la sauce soja, les petits pois et les crevettes. Sauter 1 min.",
      "Servir immédiatement bien chaud."
    ],
    ingredients: [
      ["Riz", 200, "g", "Épicerie"],
      ["Crevettes", 150, "g", "Viandes & Poissons"],
      ["Oeufs", 2, "pcs", "Produits laitiers"],
      ["Petits pois", 80, "g", "Fruits & Légumes"],
      ["Sauce soja", 20, "mL", "Épices & Condiments"],
      ["Huile tournesol", 15, "mL", "Épicerie"],
    ],
  },
  {
    name: "Curry vert thaï aux crevettes",
    description: "Curry vert onctueux au lait de coco avec crevettes et légumes, parfumé et épicé.",
    servings: 2, category: "Asiatique", prepTime: 10, cookTime: 15, difficulty: "facile",
    utensils: ["wok ou casserole", "casserole pour le riz"],
    steps: [
      "Cuire le riz dans la casserole.",
      "Faire chauffer un peu d'huile dans le wok et faire revenir la pâte de curry 1 min.",
      "Ajouter le lait de coco et porter à ébullition douce.",
      "Ajouter les courgettes coupées en rondelles, cuire 5 min.",
      "Ajouter les crevettes et la sauce soja, cuire 3-4 min.",
      "Ajouter les épinards, cuire 1 min jusqu'à ce qu'ils soient flétris.",
      "Servir sur le riz avec quelques feuilles de coriandre."
    ],
    ingredients: [
      ["Crevettes", 200, "g", "Viandes & Poissons"],
      ["Lait de coco", 400, "mL", "Produits laitiers"],
      ["Pâte de curry", 1, "pcs", "Épices & Condiments"],
      ["Courgettes", 1, "pcs", "Fruits & Légumes"],
      ["Épinards", 100, "g", "Fruits & Légumes"],
      ["Riz", 150, "g", "Épicerie"],
      ["Sauce soja", 15, "mL", "Épices & Condiments"],
    ],
  },

  // ═══════════════ INTERNATIONAL ═══════════════
  {
    name: "Salade César",
    description: "Salade croquante avec poulet grillé, croûtons dorés, parmesan et sa sauce crémeuse.",
    servings: 2, category: "International", prepTime: 15, cookTime: 10, difficulty: "facile",
    utensils: ["poêle", "saladier", "couteau", "planche à découper"],
    steps: [
      "Couper le pain de mie en petits cubes pour les croûtons.",
      "Faire dorer les croûtons à la poêle avec un peu d'huile d'olive. Réserver.",
      "Couper le poulet en lanières et le faire griller 5 min à la poêle avec un filet d'huile.",
      "Préparer la sauce : mélanger la moutarde, l'huile d'olive, un peu de jus de citron.",
      "Laver et essorer la salade, la déchirer en morceaux dans le saladier.",
      "Ajouter le poulet, les croûtons, la sauce et le parmesan en copeaux.",
      "Mélanger délicatement et servir immédiatement."
    ],
    ingredients: [
      ["Salade", 1, "pcs", "Fruits & Légumes"],
      ["Poulet (filets)", 200, "g", "Viandes & Poissons"],
      ["Parmesan", 30, "g", "Produits laitiers"],
      ["Pain de mie", 2, "pcs", "Boulangerie"],
      ["Huile d'olive", 20, "mL", "Épicerie"],
      ["Moutarde", 1, "c.à.c", "Épicerie"],
    ],
  },
  {
    name: "Burger maison",
    description: "Burger boeuf juteux avec crudités fraîches, fromage fondant et sauce maison.",
    servings: 2, category: "International", prepTime: 15, cookTime: 10, difficulty: "facile",
    utensils: ["poêle ou plancha", "couteau", "planche à découper"],
    steps: [
      "Laver et couper les tomates en rondelles, l'oignon en anneaux, préparer la salade.",
      "Assaisonner les steaks hachés avec sel et poivre.",
      "Chauffer la poêle à feu vif et cuire les steaks 3-4 min par face.",
      "À la fin de la cuisson, déposer le fromage sur les steaks pour qu'il fonde.",
      "Toaster les pains burger légèrement dans la poêle ou au grille-pain.",
      "Assembler : pain, sauce, salade, tomate, steak au fromage, oignon, sauce, pain.",
      "Servir avec des frites ou une salade."
    ],
    ingredients: [
      ["Steak haché", 2, "pcs", "Viandes & Poissons"],
      ["Pain burger", 2, "pcs", "Boulangerie"],
      ["Salade", 1, "pcs", "Fruits & Légumes"],
      ["Tomates", 1, "pcs", "Fruits & Légumes"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Fromage râpé", 40, "g", "Produits laitiers"],
      ["Ketchup", 1, "flacon", "Épicerie"],
    ],
  },
  {
    name: "Tacos poulet",
    description: "Wraps garnis de poulet épicé au paprika, crudités fraîches et crème.",
    servings: 2, category: "International", prepTime: 10, cookTime: 10, difficulty: "facile",
    utensils: ["poêle", "couteau", "planche à découper"],
    steps: [
      "Couper le poulet en fines lanières.",
      "Saupoudrer de paprika, sel et poivre.",
      "Faire chauffer la poêle et cuire le poulet épicé 6-7 min.",
      "Pendant ce temps, couper les tomates en dés et préparer la salade.",
      "Réchauffer les wraps 30 sec à la poêle ou au micro-ondes.",
      "Garnir chaque wrap de poulet, salade, tomates, fromage râpé et crème fraîche.",
      "Rouler et servir immédiatement."
    ],
    ingredients: [
      ["Wraps/Tortillas", 4, "pcs", "Boulangerie"],
      ["Poulet (filets)", 200, "g", "Viandes & Poissons"],
      ["Tomates", 2, "pcs", "Fruits & Légumes"],
      ["Salade", 1, "pcs", "Fruits & Légumes"],
      ["Fromage râpé", 50, "g", "Produits laitiers"],
      ["Crème fraîche", 50, "mL", "Produits laitiers"],
      ["Paprika", 1, "pot", "Épices & Condiments"],
    ],
  },
  {
    name: "Couscous",
    description: "Couscous complet aux légumes et poulet avec bouillon parfumé, un plat convivial.",
    servings: 4, category: "International", prepTime: 20, cookTime: 40, difficulty: "moyen",
    utensils: ["grande cocotte", "casserole", "couteau", "planche à découper"],
    steps: [
      "Couper le poulet en morceaux, les carottes en rondelles, les courgettes en tronçons, les oignons en quartiers.",
      "Faire dorer le poulet dans la cocotte avec un peu d'huile. Réserver.",
      "Faire revenir les oignons 3 min, ajouter les carottes et les tomates coupées.",
      "Ajouter le bouillon, les pois chiches égouttés et le poulet. Couvrir d'eau.",
      "Porter à ébullition puis mijoter 30 min à feu doux.",
      "Ajouter les courgettes les 10 dernières minutes.",
      "Préparer la semoule : verser de l'eau bouillante dessus (même volume), couvrir 5 min, égrener à la fourchette.",
      "Servir la semoule avec les légumes, le poulet et le bouillon."
    ],
    ingredients: [
      ["Semoule", 300, "g", "Épicerie"],
      ["Poulet (filets)", 400, "g", "Viandes & Poissons"],
      ["Carottes", 3, "pcs", "Fruits & Légumes"],
      ["Courgettes", 2, "pcs", "Fruits & Légumes"],
      ["Pois chiches", 1, "boîte", "Épicerie"],
      ["Tomates", 2, "pcs", "Fruits & Légumes"],
      ["Oignons", 2, "pcs", "Fruits & Légumes"],
      ["Bouillon cube", 2, "pcs", "Épices & Condiments"],
    ],
  },
  {
    name: "Chili con carne",
    description: "Haché épicé aux haricots rouges, tomates et cumin. Réconfortant et relevé.",
    servings: 2, category: "International", prepTime: 10, cookTime: 30, difficulty: "facile",
    utensils: ["grande poêle ou cocotte", "casserole", "couteau"],
    steps: [
      "Émincer l'oignon et couper le poivron en dés.",
      "Faire dorer la viande hachée dans la cocotte 5 min en l'émiettant.",
      "Ajouter l'oignon et le poivron, cuire 3 min.",
      "Ajouter la sauce tomate, le concentré de tomates, le cumin, les haricots rouges égouttés.",
      "Saler, poivrer et laisser mijoter 20 min à couvert à feu doux.",
      "Cuire le riz dans la casserole.",
      "Servir le chili sur le riz, avec de la crème fraîche si désiré."
    ],
    ingredients: [
      ["Steak haché", 2, "pcs", "Viandes & Poissons"],
      ["Haricots rouges", 1, "boîte", "Épicerie"],
      ["Sauce tomate", 1, "boîte", "Épicerie"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Poivrons", 1, "pcs", "Fruits & Légumes"],
      ["Riz", 150, "g", "Épicerie"],
      ["Cumin", 1, "pot", "Épices & Condiments"],
      ["Concentré de tomates", 1, "boîte", "Épicerie"],
    ],
  },
  {
    name: "Saumon grillé aux légumes",
    description: "Pavé de saumon grillé accompagné de légumes de saison rôtis au four avec un filet de citron.",
    servings: 2, category: "International", prepTime: 10, cookTime: 20, difficulty: "facile",
    utensils: ["plaque de four", "four", "poêle", "couteau"],
    steps: [
      "Préchauffer le four à 200°C.",
      "Couper les courgettes et les poivrons en lanières, les huiler et assaisonner.",
      "Disposer les légumes sur la plaque et enfourner 10 min.",
      "Pendant ce temps, assaisonner les pavés de saumon avec sel, poivre et herbes.",
      "Faire chauffer la poêle à feu vif et saisir le saumon 3 min côté peau.",
      "Retourner et cuire 2-3 min (le saumon doit rester rosé au centre).",
      "Servir le saumon sur les légumes avec un filet de citron."
    ],
    ingredients: [
      ["Saumon", 250, "g", "Viandes & Poissons"],
      ["Courgettes", 1, "pcs", "Fruits & Légumes"],
      ["Poivrons", 1, "pcs", "Fruits & Légumes"],
      ["Huile d'olive", 20, "mL", "Épicerie"],
      ["Citrons", 1, "pcs", "Fruits & Légumes"],
      ["Herbes de Provence", 1, "pot", "Épices & Condiments"],
    ],
  },
  {
    name: "Taboulé",
    description: "Salade fraîche de semoule aux herbes, tomates, concombre et jus de citron. Parfait en été.",
    servings: 2, category: "International", prepTime: 15, cookTime: 0, difficulty: "facile",
    utensils: ["saladier", "couteau", "planche à découper"],
    steps: [
      "Verser la semoule dans le saladier, couvrir d'eau bouillante (même volume), couvrir 5 min.",
      "Égrener la semoule à la fourchette et laisser refroidir.",
      "Couper les tomates en petits dés et le concombre en dés.",
      "Ajouter les légumes à la semoule refroidie.",
      "Arroser généreusement de jus de citron et d'huile d'olive.",
      "Ajouter le persil, saler et poivrer.",
      "Mélanger et réfrigérer au moins 30 min avant de servir bien frais."
    ],
    ingredients: [
      ["Semoule", 150, "g", "Épicerie"],
      ["Tomates", 2, "pcs", "Fruits & Légumes"],
      ["Concombre", 1, "pcs", "Fruits & Légumes"],
      ["Citrons", 2, "pcs", "Fruits & Légumes"],
      ["Huile d'olive", 30, "mL", "Épicerie"],
      ["Persil sec", 1, "pot", "Épices & Condiments"],
    ],
  },
  {
    name: "Fajitas boeuf",
    description: "Tortillas garnies de lanières de boeuf grillé, poivrons, oignons et guacamole maison.",
    servings: 2, category: "International", prepTime: 15, cookTime: 10, difficulty: "facile",
    utensils: ["poêle ou plancha", "couteau", "planche à découper"],
    steps: [
      "Couper le boeuf en fines lanières, les poivrons et l'oignon en lamelles.",
      "Mélanger le boeuf avec le paprika, le cumin, sel et poivre.",
      "Écraser l'avocat à la fourchette avec un peu de jus de citron pour le guacamole.",
      "Chauffer la poêle à feu vif et saisir le boeuf 3 min. Réserver.",
      "Dans la même poêle, faire sauter les poivrons et oignons 4-5 min.",
      "Réchauffer les tortillas 30 sec à la poêle.",
      "Garnir les tortillas de viande, légumes, guacamole et crème fraîche."
    ],
    ingredients: [
      ["Boeuf (bavette)", 250, "g", "Viandes & Poissons"],
      ["Wraps/Tortillas", 4, "pcs", "Boulangerie"],
      ["Poivrons", 2, "pcs", "Fruits & Légumes"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Avocat", 1, "pcs", "Fruits & Légumes"],
      ["Crème fraîche", 50, "mL", "Produits laitiers"],
      ["Paprika", 1, "pot", "Épices & Condiments"],
      ["Cumin", 1, "pot", "Épices & Condiments"],
      ["Citrons", 1, "pcs", "Fruits & Légumes"],
    ],
  },

  // ═══════════════ RAPIDE (<20 min) ═══════════════
  {
    name: "Tartine chèvre-miel",
    description: "Tartines croustillantes au chèvre fondant, miel et noix. Parfait pour un dîner léger.",
    servings: 2, category: "Rapide", prepTime: 5, cookTime: 8, difficulty: "facile",
    utensils: ["four ou grille-pain", "couteau"],
    steps: [
      "Préchauffer le four en mode grill.",
      "Trancher la baguette en deux dans la longueur.",
      "Répartir des rondelles de chèvre sur les tartines.",
      "Enfourner 5-8 min sous le grill jusqu'à ce que le chèvre soit fondant et doré.",
      "Sortir et arroser d'un filet de miel.",
      "Servir avec une salade verte."
    ],
    ingredients: [
      ["Baguette", 1, "pcs", "Boulangerie"],
      ["Chèvre frais", 1, "pcs", "Produits laitiers"],
      ["Miel", 1, "pcs", "Épicerie"],
      ["Salade", 1, "pcs", "Fruits & Légumes"],
    ],
  },
  {
    name: "Oeufs brouillés saumon",
    description: "Oeufs brouillés crémeux au saumon fumé sur toast, un brunch express.",
    servings: 2, category: "Rapide", prepTime: 5, cookTime: 5, difficulty: "facile",
    utensils: ["poêle antiadhésive", "grille-pain", "spatule"],
    steps: [
      "Toaster les tranches de pain.",
      "Battre les oeufs avec la crème, saler légèrement et poivrer.",
      "Faire fondre le beurre dans la poêle à feu doux.",
      "Verser les oeufs et remuer doucement avec la spatule sans arrêt pendant 3-4 min.",
      "Les oeufs doivent rester crémeux et légèrement baveux.",
      "Servir sur les toasts avec le saumon et un tour de moulin à poivre."
    ],
    ingredients: [
      ["Oeufs", 4, "pcs", "Produits laitiers"],
      ["Saumon", 80, "g", "Viandes & Poissons"],
      ["Pain de mie", 2, "pcs", "Boulangerie"],
      ["Crème fraîche", 30, "mL", "Produits laitiers"],
      ["Beurre", 10, "g", "Produits laitiers"],
    ],
  },
  {
    name: "Salade avocat-crevettes",
    description: "Salade fraîche et légère avec avocat crémeux, crevettes et vinaigrette citronnée.",
    servings: 2, category: "Rapide", prepTime: 10, cookTime: 0, difficulty: "facile",
    utensils: ["saladier", "couteau", "planche à découper"],
    steps: [
      "Couper l'avocat en cubes et les tomates en quartiers.",
      "Laver et essorer la salade, la disposer dans le saladier.",
      "Ajouter l'avocat, les tomates et les crevettes.",
      "Préparer la vinaigrette : huile d'olive, jus de citron, sel et poivre.",
      "Verser la vinaigrette et mélanger délicatement.",
      "Servir immédiatement."
    ],
    ingredients: [
      ["Crevettes", 150, "g", "Viandes & Poissons"],
      ["Avocat", 1, "pcs", "Fruits & Légumes"],
      ["Salade", 1, "pcs", "Fruits & Légumes"],
      ["Tomates", 2, "pcs", "Fruits & Légumes"],
      ["Citrons", 1, "pcs", "Fruits & Légumes"],
      ["Huile d'olive", 20, "mL", "Épicerie"],
    ],
  },

  // ═══════════════ VÉGÉTARIEN ═══════════════
  {
    name: "Gratin de courgettes",
    description: "Gratin léger de courgettes à la crème et au fromage, fondant et doré.",
    servings: 2, category: "Végétarien", prepTime: 15, cookTime: 30, difficulty: "facile",
    utensils: ["plat à gratin", "four", "couteau", "poêle"],
    steps: [
      "Préchauffer le four à 190°C.",
      "Couper les courgettes en rondelles de 5mm.",
      "Les faire revenir 5 min à la poêle avec un peu d'huile d'olive.",
      "Disposer les courgettes dans le plat à gratin.",
      "Mélanger les oeufs avec la crème, saler, poivrer.",
      "Verser l'appareil sur les courgettes, parsemer de fromage râpé.",
      "Enfourner 25-30 min jusqu'à ce que le dessus soit doré."
    ],
    ingredients: [
      ["Courgettes", 3, "pcs", "Fruits & Légumes"],
      ["Oeufs", 2, "pcs", "Produits laitiers"],
      ["Crème fraîche", 100, "mL", "Produits laitiers"],
      ["Fromage râpé", 80, "g", "Produits laitiers"],
      ["Huile d'olive", 10, "mL", "Épicerie"],
    ],
  },
  {
    name: "Dahl de lentilles",
    description: "Curry indien de lentilles au lait de coco, épicé et réconfortant. 100% végétarien.",
    servings: 2, category: "Végétarien", prepTime: 10, cookTime: 25, difficulty: "facile",
    utensils: ["casserole", "poêle", "couteau"],
    steps: [
      "Rincer les lentilles sous l'eau froide.",
      "Émincer l'oignon et l'ail.",
      "Faire revenir l'oignon et l'ail dans l'huile 3 min.",
      "Ajouter le curry, le cumin, le paprika, remuer 1 min.",
      "Ajouter les lentilles, la sauce tomate et le lait de coco.",
      "Couvrir d'eau si nécessaire, porter à ébullition puis mijoter 20 min.",
      "Les lentilles doivent être tendres et la sauce épaisse.",
      "Servir avec du riz ou du pain naan."
    ],
    ingredients: [
      ["Lentilles", 200, "g", "Épicerie"],
      ["Lait de coco", 200, "mL", "Produits laitiers"],
      ["Oignons", 1, "pcs", "Fruits & Légumes"],
      ["Ail", 2, "pcs", "Fruits & Légumes"],
      ["Sauce tomate", 1, "boîte", "Épicerie"],
      ["Curry", 1, "pot", "Épices & Condiments"],
      ["Cumin", 1, "pot", "Épices & Condiments"],
      ["Riz", 150, "g", "Épicerie"],
    ],
  },
  {
    name: "Galettes de légumes",
    description: "Galettes croustillantes à base de courgettes et carottes râpées, légères et savoureuses.",
    servings: 2, category: "Végétarien", prepTime: 15, cookTime: 10, difficulty: "facile",
    utensils: ["râpe", "saladier", "poêle", "spatule"],
    steps: [
      "Râper les courgettes et les carottes.",
      "Les presser dans un torchon pour retirer l'excès d'eau.",
      "Mélanger avec les oeufs, la farine, sel, poivre et un peu de fromage râpé.",
      "Former des galettes avec les mains.",
      "Faire chauffer l'huile dans la poêle à feu moyen.",
      "Cuire les galettes 3-4 min par face jusqu'à ce qu'elles soient bien dorées.",
      "Servir avec une salade et de la crème fraîche."
    ],
    ingredients: [
      ["Courgettes", 2, "pcs", "Fruits & Légumes"],
      ["Carottes", 2, "pcs", "Fruits & Légumes"],
      ["Oeufs", 2, "pcs", "Produits laitiers"],
      ["Farine", 50, "g", "Épicerie"],
      ["Fromage râpé", 30, "g", "Produits laitiers"],
      ["Huile tournesol", 15, "mL", "Épicerie"],
    ],
  },

  // ═══════════════ DESSERTS ═══════════════
  {
    name: "Crêpes",
    description: "Crêpes fines et moelleuses à garnir au sucre, Nutella, confiture ou citron.",
    servings: 4, category: "Dessert", prepTime: 10, cookTime: 20, difficulty: "facile",
    utensils: ["saladier", "fouet", "poêle à crêpes ou antiadhésive", "louche"],
    steps: [
      "Dans le saladier, mélanger la farine et le sucre.",
      "Creuser un puits, ajouter les oeufs et mélanger.",
      "Ajouter le lait progressivement en fouettant pour éviter les grumeaux.",
      "Ajouter le beurre fondu et mélanger. La pâte doit être fluide.",
      "Laisser reposer 30 min (optionnel mais recommandé).",
      "Chauffer la poêle, la graisser légèrement avec du beurre.",
      "Verser une louche de pâte, étaler en tournant la poêle et cuire 1-2 min par face.",
      "Garnir à votre goût et servir."
    ],
    ingredients: [
      ["Farine", 125, "g", "Épicerie"],
      ["Oeufs", 2, "pcs", "Produits laitiers"],
      ["Lait", 250, "mL", "Produits laitiers"],
      ["Sucre", 30, "g", "Épicerie"],
      ["Beurre", 20, "g", "Produits laitiers"],
    ],
  },
  {
    name: "Gâteau au chocolat",
    description: "Moelleux au chocolat fondant à coeur, un classique indémodable et facile à réaliser.",
    servings: 6, category: "Dessert", prepTime: 15, cookTime: 25, difficulty: "facile",
    utensils: ["casserole", "saladier", "fouet", "moule à gâteau", "four"],
    steps: [
      "Préchauffer le four à 180°C. Beurrer et fariner le moule.",
      "Faire fondre le chocolat cassé en morceaux avec le beurre au bain-marie ou micro-ondes.",
      "Dans le saladier, fouetter les oeufs avec le sucre jusqu'à ce que le mélange blanchisse.",
      "Ajouter le chocolat fondu tiédi, mélanger.",
      "Incorporer la farine en pluie en mélangeant délicatement.",
      "Verser dans le moule et enfourner 20-25 min.",
      "Le gâteau est cuit quand un couteau planté au centre ressort légèrement humide.",
      "Laisser tiédir 10 min avant de démouler."
    ],
    ingredients: [
      ["Chocolat", 200, "g", "Épicerie"],
      ["Beurre", 100, "g", "Produits laitiers"],
      ["Oeufs", 3, "pcs", "Produits laitiers"],
      ["Sucre", 100, "g", "Épicerie"],
      ["Farine", 50, "g", "Épicerie"],
    ],
  },
  {
    name: "Tarte aux pommes",
    description: "Tarte classique aux pommes caramélisées sur pâte croustillante, un dessert familial.",
    servings: 6, category: "Dessert", prepTime: 20, cookTime: 35, difficulty: "facile",
    utensils: ["moule à tarte", "four", "couteau", "économe"],
    steps: [
      "Préchauffer le four à 190°C.",
      "Étaler la pâte dans le moule et piquer le fond à la fourchette.",
      "Éplucher les pommes et les couper en fines lamelles.",
      "Disposer les lamelles en rosace sur la pâte.",
      "Parsemer de sucre et de petits morceaux de beurre.",
      "Saupoudrer de cannelle.",
      "Enfourner 30-35 min jusqu'à ce que les pommes soient dorées et la pâte croustillante.",
      "Servir tiède avec une boule de glace vanille si désiré."
    ],
    ingredients: [
      ["Pâte brisée", 1, "pcs", "Boulangerie"],
      ["Pommes", 4, "pcs", "Fruits & Légumes"],
      ["Sucre", 60, "g", "Épicerie"],
      ["Beurre", 30, "g", "Produits laitiers"],
      ["Cannelle", 1, "pot", "Épices & Condiments"],
    ],
  },
  {
    name: "Mousse au chocolat",
    description: "Mousse au chocolat aérienne et intense, le dessert chouchou des français.",
    servings: 4, category: "Dessert", prepTime: 20, cookTime: 5, difficulty: "moyen",
    utensils: ["casserole", "2 saladiers", "fouet ou batteur électrique", "spatule"],
    steps: [
      "Faire fondre le chocolat avec le beurre au bain-marie. Laisser tiédir.",
      "Séparer les blancs des jaunes d'oeufs.",
      "Mélanger les jaunes avec le chocolat fondu.",
      "Monter les blancs en neige ferme avec une pincée de sel.",
      "Incorporer délicatement les blancs au mélange chocolat en 3 fois avec la spatule.",
      "Ne pas trop mélanger pour garder la mousse aérée.",
      "Répartir dans des verrines ou ramequins.",
      "Réfrigérer au moins 4h avant de déguster."
    ],
    ingredients: [
      ["Chocolat", 150, "g", "Épicerie"],
      ["Oeufs", 4, "pcs", "Produits laitiers"],
      ["Beurre", 20, "g", "Produits laitiers"],
      ["Sucre", 30, "g", "Épicerie"],
    ],
  },
];

async function migrate() {
  console.log("Creating tables...");

  // Create all tables (old + new)
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      servings INTEGER DEFAULT 2,
      category TEXT,
      prep_time INTEGER,
      cook_time INTEGER,
      difficulty TEXT,
      utensils TEXT,
      steps TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS meal_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
      custom_name TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_unit TEXT NOT NULL,
      icon TEXT,
      is_custom INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 100,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      category TEXT,
      checked INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manual',
      list_status TEXT DEFAULT 'prep',
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      checked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      last_purchased TEXT,
      avg_frequency_days REAL,
      status TEXT DEFAULT 'ok',
      next_estimated TEXT
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      store TEXT,
      total REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      store TEXT,
      receipt_id INTEGER REFERENCES receipts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS pantry_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      category TEXT,
      location TEXT DEFAULT 'placard',
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT
    );
  `);

  console.log("Tables created successfully!");

  // Add new columns to existing tables (safe to run multiple times)
  const alterQueries = [
    "ALTER TABLE recipes ADD COLUMN prep_time INTEGER",
    "ALTER TABLE recipes ADD COLUMN cook_time INTEGER",
    "ALTER TABLE recipes ADD COLUMN difficulty TEXT",
    "ALTER TABLE recipes ADD COLUMN utensils TEXT",
    "ALTER TABLE recipes ADD COLUMN steps TEXT",
    "ALTER TABLE recipe_ingredients ADD COLUMN product_id INTEGER REFERENCES products(id) ON DELETE SET NULL",
    "ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 100",
  ];

  for (const q of alterQueries) {
    try { await client.execute(q); } catch { /* column already exists */ }
  }

  // Seed product catalog
  const existing = await client.execute("SELECT COUNT(*) as count FROM products");
  if (Number(existing.rows[0].count) === 0) {
    console.log(`Seeding ${PRODUCTS.length} products...`);
    for (const p of PRODUCTS) {
      await client.execute({
        sql: "INSERT INTO products (name, category, default_unit, icon, is_custom) VALUES (?, ?, ?, ?, 0)",
        args: [p.name, p.category, p.defaultUnit, p.icon],
      });
    }
    console.log("Product catalog seeded!");
  } else {
    // Add new products that don't exist yet
    console.log("Checking for new products to add...");
    let added = 0;
    for (const p of PRODUCTS) {
      const exists = await client.execute({
        sql: "SELECT id FROM products WHERE name = ?",
        args: [p.name],
      });
      if (exists.rows.length === 0) {
        await client.execute({
          sql: "INSERT INTO products (name, category, default_unit, icon, is_custom) VALUES (?, ?, ?, ?, 0)",
          args: [p.name, p.category, p.defaultUnit, p.icon],
        });
        added++;
      }
    }
    if (added > 0) console.log(`Added ${added} new products!`);
    else console.log("All products already exist.");
  }

  // Fix units and set sort orders
  console.log("Updating sort_order and units...");

  const unitFixes = [
    ["Herbes de Provence", "pot"], ["Curry", "pot"], ["Paprika", "pot"],
    ["Cumin", "pot"], ["Cannelle", "pot"], ["Basilic sec", "pot"], ["Persil sec", "pot"],
    ["Levure", "sachet"],
    ["Moutarde", "flacon"], ["Ketchup", "flacon"], ["Mayonnaise", "flacon"],
    ["Miel", "pot"], ["Confiture", "pot"],
    ["Vin rouge", "bout."], ["Vin blanc", "bout."], ["Sirop", "bout."],
    ["Savon", "flacon"], ["Gel douche", "flacon"], ["Shampoing", "flacon"],
    ["Dentifrice", "tube"], ["Déodorant", "flacon"], ["Crème hydratante", "tube"],
    ["Liquide vaisselle", "flacon"], ["Produit multi-surfaces", "flacon"],
    ["Produit vitres", "flacon"], ["Désodorisant", "flacon"], ["Produit WC", "flacon"],
    ["Film alimentaire", "roul."], ["Papier aluminium", "roul."],
    ["Pâte de curry", "pot"], ["Nuoc-mâm", "bout."], ["Huile de sésame", "bout."],
    ["Piment d'Espelette", "pot"],
  ];
  for (const [name, unit] of unitFixes) {
    await client.execute({ sql: "UPDATE products SET default_unit = ? WHERE name = ?", args: [unit, name] });
  }

  const sortOrders: Record<string, string[]> = {
    "Fruits & Légumes": ["Tomates", "Pommes de terre", "Oignons", "Carottes", "Bananes", "Pommes", "Salade", "Courgettes", "Poivrons", "Concombre", "Ail", "Champignons", "Citrons", "Haricots verts", "Épinards", "Brocoli", "Oranges", "Aubergines", "Avocat", "Poireaux", "Fraises", "Petits pois", "Chou", "Mangue", "Ananas", "Échalotes", "Gingembre", "Céleri", "Betteraves", "Radis", "Coriandre fraîche", "Persil frais", "Menthe fraîche"],
    "Viandes & Poissons": ["Poulet (filets)", "Steak haché", "Lardons", "Jambon", "Saucisses", "Saumon", "Poulet (entier)", "Dinde", "Boeuf (bavette)", "Crevettes", "Merguez", "Porc (côtes)", "Cabillaud", "Thon (frais)", "Agneau", "Porc (échine)"],
    "Produits laitiers": ["Oeufs", "Lait", "Beurre", "Fromage râpé", "Crème fraîche", "Yaourts nature", "Mozzarella", "Crème liquide", "Parmesan", "Comté", "Camembert", "Fromage blanc", "Chèvre frais", "Mascarpone", "Ricotta", "Lait de coco"],
    "Boulangerie": ["Baguette", "Pain de mie", "Pain complet", "Croissants", "Wraps/Tortillas", "Brioche", "Pain burger", "Biscottes", "Pâte feuilletée", "Pâte brisée"],
    "Épicerie": ["Pâtes", "Riz", "Huile d'olive", "Sel", "Sucre", "Farine", "Sauce tomate", "Moutarde", "Poivre", "Conserves de thon", "Concentré de tomates", "Vinaigre", "Café", "Chocolat", "Ketchup", "Mayonnaise", "Lentilles", "Pois chiches", "Huile tournesol", "Conserves de maïs", "Olives", "Miel", "Thé", "Confiture", "Semoule", "Nouilles chinoises", "Haricots rouges", "Chapelure", "Maïzena", "Vinaigre balsamique"],
    "Surgelés": ["Frites", "Pizza surgelée", "Légumes surgelés", "Nuggets", "Poisson pané", "Glaces", "Épinards surgelés", "Fruits surgelés"],
    "Boissons": ["Eau plate", "Lait d'amande", "Jus d'orange", "Eau gazeuse", "Café moulu", "Coca-Cola", "Bière", "Vin rouge", "Vin blanc", "Sirop"],
    "Hygiène & Beauté": ["Papier toilette", "Gel douche", "Shampoing", "Dentifrice", "Mouchoirs", "Savon", "Déodorant", "Brosse à dents", "Cotons", "Rasoirs", "Crème hydratante", "Serviettes hygiéniques", "Lessive (capsules)", "Lingettes bébé", "Couches"],
    "Entretien & Maison": ["Sopalin", "Éponges", "Liquide vaisselle", "Sacs poubelle", "Lessive", "Pastilles lave-vaisselle", "Produit multi-surfaces", "Javel", "Film alimentaire", "Papier aluminium", "Adoucissant", "Produit vitres", "Produit WC", "Désodorisant", "Balai/serpillère (recharge)"],
    "Épices & Condiments": ["Herbes de Provence", "Bouillon cube", "Sauce soja", "Curry", "Paprika", "Basilic sec", "Persil sec", "Cumin", "Cannelle", "Levure", "Piment d'Espelette", "Nuoc-mâm", "Huile de sésame", "Pâte de curry"],
  };

  for (const [category, names] of Object.entries(sortOrders)) {
    for (let i = 0; i < names.length; i++) {
      await client.execute({ sql: "UPDATE products SET sort_order = ? WHERE name = ? AND category = ?", args: [i + 1, names[i], category] });
    }
  }
  console.log("Sort order and units updated!");

  // Seed recipes (delete and re-seed to get updated detailed versions)
  const recipeCount = await client.execute("SELECT COUNT(*) as count FROM recipes");
  const existingCount = Number(recipeCount.rows[0].count);

  // Check if recipes have steps (i.e. are the new detailed format)
  let needsReseed = false;
  if (existingCount > 0) {
    const hasSteps = await client.execute("SELECT steps FROM recipes WHERE steps IS NOT NULL LIMIT 1");
    if (hasSteps.rows.length === 0) {
      needsReseed = true;
      console.log("Existing recipes lack details - re-seeding with full details...");
      await client.execute("DELETE FROM recipe_ingredients");
      await client.execute("DELETE FROM recipes");
    }
  }

  if (existingCount === 0 || needsReseed) {
    console.log(`Seeding ${RECIPES.length} detailed recipes...`);

    // Build product name → id map
    const allProducts = await client.execute("SELECT id, name FROM products");
    const productMap = new Map<string, number>();
    for (const row of allProducts.rows) {
      productMap.set(row.name as string, row.id as number);
    }

    for (const recipe of RECIPES) {
      const result = await client.execute({
        sql: `INSERT INTO recipes (name, description, servings, category, prep_time, cook_time, difficulty, utensils, steps)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          recipe.name, recipe.description, recipe.servings, recipe.category,
          recipe.prepTime, recipe.cookTime, recipe.difficulty,
          JSON.stringify(recipe.utensils), JSON.stringify(recipe.steps),
        ],
      });
      const recipeId = Number(result.lastInsertRowid);

      for (const [ingName, qty, unit, cat] of recipe.ingredients) {
        const productId = productMap.get(ingName) || null;
        await client.execute({
          sql: "INSERT INTO recipe_ingredients (recipe_id, product_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?, ?)",
          args: [recipeId, productId, ingName, qty, unit, cat],
        });
      }
    }

    console.log(`${RECIPES.length} detailed recipes seeded with ingredients linked to products!`);
  } else {
    console.log(`${existingCount} recipes already exist with details, skipping seed.`);
  }
}

migrate().catch(console.error);
