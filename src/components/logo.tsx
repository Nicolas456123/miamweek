/**
 * Logo Miamweek — wordmark éditorial.
 * Plus de panier vert — un wordmark sérif italique aligné avec la nouvelle direction.
 * Le prop `size` agit comme `font-size` en px.
 */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="font-display"
      style={{
        fontSize: size,
        fontFamily: "var(--font-display)",
        lineHeight: 1,
        letterSpacing: "-0.01em",
        color: "var(--color-ink)",
        display: "inline-flex",
        alignItems: "baseline",
        gap: "0.05em",
      }}
    >
      <span style={{ fontStyle: "normal" }}>miam</span>
      <span style={{ color: "var(--color-terracotta)", fontStyle: "normal" }}>·</span>
      <span style={{ fontStyle: "italic" }}>week</span>
    </span>
  );
}
