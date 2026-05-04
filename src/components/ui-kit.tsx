"use client";

/**
 * Composants partagés refondus — direction terre cuite + crème.
 * Drop-in remplacement à utiliser dans toutes les pages existantes.
 *
 *   import { Card, Button, Chip, EmptyState, PageHeader, SectionTitle, Field } from "@/components/ui-kit";
 *
 * Le but : remplacer les blocs `bg-card border border-border rounded-xl p-4`
 * répétés partout par un `<Card>`, et la même chose pour les boutons / chips.
 */

import * as React from "react";

// ─── Card ──────────────────────────────────────────────────────────────
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "soft" | "ink" | "outline";
  padding?: "sm" | "md" | "lg" | "none";
};

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  ...rest
}: CardProps) {
  const padMap = { none: "", sm: "p-3", md: "p-5", lg: "p-7" };
  const variantMap = {
    default: "bg-[var(--color-cream-pale)] border border-[var(--color-line)]",
    soft: "bg-[var(--color-cream-deep)]",
    ink: "bg-[var(--color-ink)] text-[var(--color-cream)]",
    outline: "bg-transparent border border-[var(--color-line)]",
  };
  return (
    <div
      className={`rounded-lg ${variantMap[variant]} ${padMap[padding]} ${className}`}
      {...rest}
    />
  );
}

// ─── Button ────────────────────────────────────────────────────────────
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ink";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export function Button({
  variant = "secondary",
  size = "md",
  fullWidth,
  className = "",
  ...rest
}: ButtonProps) {
  const sizeMap = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variantMap = {
    primary:
      "bg-[var(--color-terracotta)] text-[var(--color-cream-pale)] hover:bg-[var(--color-terracotta-deep)] border border-[var(--color-terracotta)]",
    secondary:
      "bg-[var(--color-cream-pale)] text-[var(--color-ink)] hover:bg-[var(--color-cream-deep)] border border-[var(--color-line)]",
    ghost:
      "bg-transparent text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-deep)] border border-transparent",
    danger:
      "bg-transparent text-[var(--color-terracotta-deep)] hover:bg-[rgba(200,85,61,0.08)] border border-[rgba(200,85,61,0.3)]",
    ink: "bg-[var(--color-ink)] text-[var(--color-cream-pale)] hover:bg-[var(--color-ink-soft)] border border-[var(--color-ink)]",
  };
  return (
    <button
      className={`rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${
        sizeMap[size]
      } ${variantMap[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
}

// ─── Chip ──────────────────────────────────────────────────────────────
type ChipTone = "neutral" | "terra" | "olive" | "mustard" | "ink";
type ChipProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
  as?: "span" | "button";
};

export function Chip({ tone = "neutral", className = "", ...rest }: ChipProps) {
  const toneClass =
    tone === "neutral"
      ? "chip"
      : tone === "terra"
      ? "chip chip-terra"
      : tone === "olive"
      ? "chip chip-olive"
      : tone === "mustard"
      ? "chip chip-mustard"
      : "chip chip-ink";
  return <span className={`${toneClass} ${className}`} {...rest} />;
}

// ─── PageHeader ────────────────────────────────────────────────────────
type PageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="pb-6 mb-6 border-b" style={{ borderColor: "var(--color-line)" }}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1
            className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-sm" style={{ color: "var(--color-ink-mute)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex gap-2 items-center">{actions}</div>}
      </div>
    </header>
  );
}

// ─── SectionTitle ──────────────────────────────────────────────────────
export function SectionTitle({
  children,
  count,
  className = "",
}: {
  children: React.ReactNode;
  count?: number;
  className?: string;
}) {
  return (
    <div className={`section-rule ${className}`}>
      <h2
        className="eyebrow flex items-center gap-2"
        style={{ color: "var(--color-ink-soft)" }}
      >
        {children}
        {count !== undefined && (
          <span className="tnum" style={{ color: "var(--color-ink-faint)" }}>
            ({String(count).padStart(2, "0")})
          </span>
        )}
      </h2>
    </div>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────
type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div
        className="placeholder-img mx-auto mb-6"
        style={{ width: 96, height: 96 }}
      >
        ∅
      </div>
      <h2 className="font-display text-3xl mb-2" style={{ color: "var(--color-ink)" }}>
        {title}
      </h2>
      {description && (
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-mute)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─── Field (input + label éditorial) ──────────────────────────────────
type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Field({ label, hint, className = "", ...rest }: FieldProps) {
  return (
    <label className="block">
      {label && <span className="eyebrow block mb-2">{label}</span>}
      <input
        className={`w-full bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)] focus:ring-2 focus:ring-[rgba(200,85,61,0.15)] transition-colors ${className}`}
        {...rest}
      />
      {hint && (
        <span
          className="block mt-1.5 text-xs"
          style={{ color: "var(--color-ink-faint)" }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

// ─── PlaceholderImg ────────────────────────────────────────────────────
export function PlaceholderImg({
  label,
  tone = "neutral",
  className = "",
  style,
}: {
  label?: string;
  tone?: "neutral" | "terra" | "olive" | "mustard";
  className?: string;
  style?: React.CSSProperties;
}) {
  const toneClass =
    tone === "neutral"
      ? "placeholder-img"
      : `placeholder-img placeholder-img-${tone}`;
  return (
    <div className={`${toneClass} ${className}`} style={style}>
      {label || "image"}
    </div>
  );
}
