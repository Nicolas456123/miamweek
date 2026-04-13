"use client";

import { useState, useEffect } from "react";

type PriceEntry = {
  id: number;
  productName: string;
  brand: string | null;
  quantity: number | null;
  unit: string | null;
  price: number;
  date: string;
  store: string | null;
};

type Receipt = {
  id: number;
  date: string;
  store: string | null;
  total: number | null;
  item_count: number | null;
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
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptItems, setReceiptItems] = useState<PriceEntry[]>([]);

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

  const openReceipt = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    try {
      const res = await fetch(`/api/receipts?receiptId=${receipt.id}`);
      const data = await res.json();
      setReceiptItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setReceiptItems([]);
    }
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
                    <th className="text-left px-4 py-2 font-medium">Marque</th>
                    <th className="text-right px-4 py-2 font-medium">Qté</th>
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
                      <td className="px-4 py-2 text-muted">
                        {p.brand || "-"}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {p.quantity && p.unit
                          ? `${p.quantity} ${p.unit}`
                          : p.quantity
                            ? `x${p.quantity}`
                            : "-"}
                      </td>
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

          {/* Receipt detail */}
          {selectedReceipt && (
            <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-3 bg-card-hover border-b border-border">
                <div>
                  <h3 className="font-semibold">
                    {selectedReceipt.store || "Magasin inconnu"}
                  </h3>
                  <p className="text-xs text-muted">
                    {new Date(selectedReceipt.date).toLocaleDateString("fr-FR")}
                    {selectedReceipt.total && (
                      <span className="ml-2 font-medium text-foreground">
                        Total : {selectedReceipt.total.toFixed(2)} EUR
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedReceipt(null); setReceiptItems([]); }}
                  className="w-8 h-8 rounded-lg bg-card-hover text-muted hover:text-foreground flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>
              {receiptItems.length === 0 ? (
                <p className="text-sm text-muted p-4">Chargement...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card-hover/50">
                        <th className="text-left px-4 py-2 font-medium">Produit</th>
                        <th className="text-left px-3 py-2 font-medium">Marque</th>
                        <th className="text-right px-3 py-2 font-medium">Quantité</th>
                        <th className="text-right px-4 py-2 font-medium">Prix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {receiptItems.map((item) => (
                        <tr key={item.id} className="hover:bg-card-hover">
                          <td className="px-4 py-2 font-medium">{item.productName}</td>
                          <td className="px-3 py-2 text-muted">{item.brand || "-"}</td>
                          <td className="px-3 py-2 text-right text-muted">
                            {item.quantity && item.unit
                              ? `${item.quantity} ${item.unit}`
                              : item.quantity
                                ? `x${item.quantity}`
                                : "-"}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {item.price.toFixed(2)} EUR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Receipts list as table */}
          {receipts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Historique des tickets</h3>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card-hover">
                        <th className="text-left px-4 py-2.5 font-medium">Date</th>
                        <th className="text-left px-3 py-2.5 font-medium">Magasin</th>
                        <th className="text-right px-3 py-2.5 font-medium">Articles</th>
                        <th className="text-right px-3 py-2.5 font-medium">Total</th>
                        <th className="text-center px-3 py-2.5 font-medium w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {receipts.map((r) => (
                        <tr
                          key={r.id}
                          className={`hover:bg-card-hover cursor-pointer transition-colors ${
                            selectedReceipt?.id === r.id ? "bg-primary-light" : ""
                          }`}
                          onClick={() => openReceipt(r)}
                        >
                          <td className="px-4 py-2.5">
                            {new Date(r.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-3 py-2.5 font-medium">
                            {r.store || "Inconnu"}
                          </td>
                          <td className="px-3 py-2.5 text-right text-muted">
                            {r.item_count || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold">
                            {r.total ? `${r.total.toFixed(2)} EUR` : "-"}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="text-primary text-xs font-medium">Voir</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
