"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { getMonday } from "@/lib/utils";

const quickLinks = [
  {
    href: "/planning",
    title: "Planning repas",
    description: "Organiser les repas de la semaine",
    icon: "📅",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/menu",
    title: "Composer un menu",
    description: "Créer un repas complet avec suggestions",
    icon: "🍽️",
    color: "bg-amber-50 text-amber-600",
  },
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
    description: "Toutes tes recettes détaillées avec étapes",
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

const shortcuts = [
  {
    href: "/planning?view=today",
    label: "Ce soir on mange quoi ?",
    icon: "🌙",
    primary: true,
  },
  {
    href: "/planning",
    label: "Planifier la semaine",
    icon: "📅",
    primary: false,
  },
  {
    href: "/menu",
    label: "Composer un menu",
    icon: "🍽️",
    primary: false,
  },
  {
    href: "/liste",
    label: "Nouvelle liste",
    icon: "📝",
    primary: false,
  },
  {
    href: "/courses",
    label: "Mes courses",
    icon: "🛒",
    primary: false,
  },
  {
    href: "/recettes",
    label: "Ajouter une recette",
    icon: "📖",
    primary: false,
  },
  {
    href: "/suivi",
    label: "Scanner un ticket",
    icon: "📷",
    primary: false,
  },
];

type TodayMeal = { meal_type: string; custom_name: string | null; recipe_id: number | null };

export default function HomePage() {
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>([]);

  useEffect(() => {
    const today = new Date();
    const dow = today.getDay();
    const dayOfWeek = dow === 0 ? 6 : dow - 1;
    const weekStart = getMonday(today);
    fetch(`/api/meal-plan?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTodayMeals(data.filter((m: TodayMeal & { day_of_week: number }) => m.day_of_week === dayOfWeek));
        }
      })
      .catch(() => {});
  }, []);

  const dinnerMeals = todayMeals.filter((m) => m.meal_type === "dinner" || m.meal_type.startsWith("dinner_"));
  const lunchMeals = todayMeals.filter((m) => m.meal_type === "lunch" || m.meal_type.startsWith("lunch_"));

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0">
      {/* Hero */}
      <div className="text-center py-6">
        <div className="flex justify-center mb-3">
          <Logo size={56} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          MiamWeek
        </h1>
        <p className="text-muted text-sm">
          Ton assistant courses intelligent
        </p>
      </div>

      {/* Today's meals */}
      {todayMeals.length > 0 && (
        <Link href="/planning" className="block bg-card border border-border rounded-xl p-4 mb-4 hover:shadow-sm transition-shadow">
          <h2 className="font-semibold text-sm text-muted mb-2">Aujourd&apos;hui</h2>
          <div className="flex gap-4">
            {lunchMeals.length > 0 && (
              <div className="flex-1">
                <p className="text-xs text-muted mb-1">Midi</p>
                {lunchMeals.map((m, i) => (
                  <p key={i} className="text-sm font-medium">{m.custom_name || "Recette"}</p>
                ))}
              </div>
            )}
            {dinnerMeals.length > 0 && (
              <div className="flex-1">
                <p className="text-xs text-muted mb-1">Soir</p>
                {dinnerMeals.map((m, i) => (
                  <p key={i} className="text-sm font-medium">{m.custom_name || "Recette"}</p>
                ))}
              </div>
            )}
          </div>
        </Link>
      )}

      {/* Shortcuts */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">Raccourcis</h2>
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((s) => (
            <Link
              key={s.href + s.label}
              href={s.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                s.primary
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "bg-background border border-border text-foreground hover:bg-card-hover"
              }`}
            >
              {s.icon} {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    </div>
  );
}
