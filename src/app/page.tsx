"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";

const quickLinks = [
  {
    href: "/liste",
    title: "Préparer ma liste",
    description: "Composer la liste de courses depuis le catalogue",
    icon: "📝",
    color: "bg-primary-light text-primary",
  },
  {
    href: "/courses",
    title: "Mode courses",
    description: "Suivre ma liste en magasin",
    icon: "🛒",
    color: "bg-info-light text-info",
  },
  {
    href: "/recettes",
    title: "Mes recettes",
    description: "Gérer et planifier les repas",
    icon: "📖",
    color: "bg-warning-light text-warning",
  },
  {
    href: "/inventaire",
    title: "Mon inventaire",
    description: "Voir ce que j'ai chez moi en un coup d'oeil",
    icon: "📦",
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/preferences",
    title: "Mes goûts",
    description: "Aliments aimés, détestés ou allergènes",
    icon: "❤️",
    color: "bg-pink-50 text-pink-600",
  },
  {
    href: "/suivi",
    title: "Suivi & Stats",
    description: "Prix, dépenses, consommation",
    icon: "📊",
    color: "bg-danger-light text-danger",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <Logo size={64} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bienvenue sur MiamWeek
        </h1>
        <p className="text-muted">
          Ton assistant courses intelligent
        </p>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${link.color}`}
              >
                {link.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-muted mt-0.5">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick add section */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-3">Raccourcis</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/liste"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            + Nouvelle liste
          </Link>
          <Link
            href="/suivi"
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
          >
            Scanner un ticket
          </Link>
          <Link
            href="/recettes"
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
          >
            Ajouter une recette
          </Link>
        </div>
      </div>
    </div>
  );
}
