"use client";

import { useState, useEffect } from "react";

type PriceEntry = {
  id: number;
  productName: string;
  price: number;
  date: string;
  store: string | null;
};

type Receipt = {
  id: number;
  date: string;
  store: string | null;
  total: number | null;
};

type StockItem = {
  id: number;
  productId: number;
  productName?: string;
  lastPurchased: string | null;
  avgFrequencyDays: number | null;
  status: string;
  nextEstimated: string | null;
};

export default function SuiviPage() {
  const [tab, setTab] = useState<"stock" | "prix" | "tickets">("stock");
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [scanning, setScanning] = useState(false);
  const [ticketText, setTicketText] = useState("");
  const [ticketImage, setTicketImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<"text" | "photo">("photo");

  useEffect(() => {
    if (tab === "stock") {
      fetch("/api/stock")
        .then((r) => r.json())
        .then((d) => setStocks(Array.isArray(d) ? d : []))
        .catch(console.error);
    } else if (tab === "prix") {
      fetch("/api/receipts?type=prices")
        .then((r) => r.json())
        .then((d) => setPrices(Array.isArray(d) ? d : []))
        .catch(console.error);
    } else {
      fetch("/api/receipts")
        .then((r) => r.json())
        .then((d) => setReceipts(Array.isArray(d) ? d : []))
        .catch(console.error);
    }
  }, [tab]);

  const scanTicket = async () => {
    if (!ticketText.trim() && !ticketImage) return;
    setScanning(true);
    try {
      const payload: { text?: string; image?: string } = {};
      if (ticketImage) {
        payload.image = ticketImage;
      } else {
        payload.text = ticketText;
      }
      const res = await fetch("/api/receipts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.receipt) {
        setTicketText("");
        setTicketImage(null);
        setTab("tickets");
        fetch("/api/receipts")
          .then((r) => r.json())
          .then((d) => setReceipts(Array.isArray(d) ? d : []))
          .catch(console.error);
      }
    } catch (err) {
      console.error(err);
    }
    setScanning(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTicketImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updateStockStatus = async (id: number, status: string) => {
    await fetch("/api/stock", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetch("/api/stock")
      .then((r) => r.json())
      .then((d) => setStocks(Array.isArray(d) ? d : []))
      .catch(console.error);
  };

  const statusColors: Record<string, string> = {
    ok: "bg-primary-light text-primary",
    low: "bg-warning-light text-warning",
    out: "bg-danger-light text-danger",
  };

  const statusLabels: Record<string, string> = {
    ok: "OK",
    low: "Bientot vide",
    out: "A racheter",
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-0">
      <h1 className="text-xl font-bold mb-4">Suivi</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-6">
        {[
          { key: "stock" as const, label: "Stocks", icon: "📦" },
          { key: "prix" as const, label: "Prix", icon: "💰" },
          { key: "tickets" as const, label: "Tickets", icon: "🧾" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Stock tracking */}
      {tab === "stock" && (
        <div className="space-y-2">
          {stocks.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3">📦</p>
              <p>Aucun produit suivi</p>
              <p className="text-sm mt-1">
                Les produits seront ajoutés automatiquement après tes courses
              </p>
            </div>
          ) : (
            stocks.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {item.productName || `Produit #${item.productId}`}
                  </p>
                  <p className="text-xs text-muted">
                    {item.lastPurchased
                      ? `Dernier achat: ${new Date(item.lastPurchased).toLocaleDateString("fr-FR")}`
                      : "Jamais acheté"}
                    {item.avgFrequencyDays &&
                      ` - Tous les ${Math.round(item.avgFrequencyDays)} jours`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {["ok", "low", "out"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStockStatus(item.id, s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        item.status === s
                          ? statusColors[s]
                          : "bg-card-hover text-muted hover:text-foreground"
                      }`}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Price history */}
      {tab === "prix" && (
        <div>
          {prices.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3">💰</p>
              <p>Aucun prix enregistré</p>
              <p className="text-sm mt-1">
                Scanne un ticket de caisse pour commencer le suivi des prix
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card-hover">
                    <th className="text-left px-4 py-2 font-medium">
                      Produit
                    </th>
                    <th className="text-right px-4 py-2 font-medium">Prix</th>
                    <th className="text-right px-4 py-2 font-medium">Date</th>
                    <th className="text-right px-4 py-2 font-medium">
                      Magasin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prices.map((p) => (
                    <tr key={p.id} className="hover:bg-card-hover">
                      <td className="px-4 py-2">{p.productName}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {p.price.toFixed(2)} EUR
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {new Date(p.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {p.store || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tickets / scan */}
      {tab === "tickets" && (
        <div>
          {/* Scan area */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2">Scanner un ticket</h3>

            {/* Mode toggle */}
            <div className="flex gap-1 bg-background border border-border rounded-lg p-0.5 mb-3 w-fit">
              <button
                onClick={() => setScanMode("photo")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  scanMode === "photo"
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                📸 Photo
              </button>
              <button
                onClick={() => setScanMode("text")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  scanMode === "text"
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                📝 Texte
              </button>
            </div>

            {scanMode === "photo" ? (
              <div>
                <p className="text-sm text-muted mb-3">
                  Prends en photo ton ticket de caisse ou importe une image. L&apos;IA va extraire automatiquement les produits et prix.
                </p>
                {ticketImage ? (
                  <div className="mb-3">
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ticketImage}
                        alt="Ticket de caisse"
                        className="max-h-64 rounded-lg border border-border"
                      />
                      <button
                        onClick={() => setTicketImage(null)}
                        className="absolute top-2 right-2 w-6 h-6 bg-danger text-white rounded-full text-xs font-bold flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-3">
                    <label className="flex-1 flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary-light/30 transition-colors">
                      <span className="text-3xl mb-2">📸</span>
                      <span className="text-sm font-medium">Prendre une photo</span>
                      <span className="text-xs text-muted">ou importer depuis la galerie</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <label className="flex-1 flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary-light/30 transition-colors">
                      <span className="text-3xl mb-2">🖼️</span>
                      <span className="text-sm font-medium">Importer une image</span>
                      <span className="text-xs text-muted">JPG, PNG, HEIC...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted mb-3">
                  Copie-colle le contenu de ton ticket ou décris les articles et prix.
                </p>
                <textarea
                  value={ticketText}
                  onChange={(e) => setTicketText(e.target.value)}
                  placeholder={"Ex:\nCarrefour 04/04/2026\nPâtes Barilla 1,29\nLait 1L 0,95\nPoulet 500g 4,50\nTotal: 6,74"}
                  rows={5}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            <button
              onClick={scanTicket}
              disabled={scanning || (!ticketText.trim() && !ticketImage)}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {scanning ? "Analyse en cours..." : "Analyser avec IA"}
            </button>
          </div>

          {/* Receipts list */}
          {receipts.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Historique des tickets</h3>
              {receipts.map((r) => (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="text-2xl">🧾</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {r.store || "Magasin inconnu"}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(r.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {r.total && (
                    <span className="font-semibold text-sm">
                      {r.total.toFixed(2)} EUR
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
