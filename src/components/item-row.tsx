import type { ReactNode } from "react";

// Icône d'item homogène : emoji du produit, sinon petit point.
export function ItemIcon({ icon, size = 18 }: { icon?: string | null; size?: number }) {
  if (icon) {
    return (
      <span style={{ fontSize: size }} className="leading-none">
        {icon}
      </span>
    );
  }
  return (
    <span
      className="rounded-full"
      style={{ width: 6, height: 6, background: "var(--color-line)" }}
    />
  );
}

// Ligne d'item homogène (Liste, Stock, Courses) : [icône] [nom + sous-ligne] [actions].
export function ItemRow({
  leading,
  name,
  meta,
  trailing,
  faded,
  strike,
  onClick,
}: {
  leading?: ReactNode;
  name: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  faded?: boolean;
  strike?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="shrink-0 w-6 flex items-center justify-center">{leading}</span>
      <div className={`flex-1 min-w-0 ${faded ? "opacity-50" : ""}`}>
        <p
          className="text-sm leading-tight truncate"
          style={{
            color: "var(--color-ink)",
            fontWeight: 500,
            textDecoration: strike ? "line-through" : "none",
          }}
        >
          {name}
        </p>
        {meta != null && meta !== "" && (
          <div
            className="font-mono text-[10px] mt-0.5 truncate"
            style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}
          >
            {meta}
          </div>
        )}
      </div>
      {trailing != null && <div className="flex items-center gap-1 shrink-0">{trailing}</div>}
    </>
  );

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
        className="flex items-center gap-3 px-1 py-3 w-full text-left cursor-pointer"
      >
        {inner}
      </div>
    );
  }
  return <div className="flex items-center gap-3 px-1 py-3">{inner}</div>;
}
