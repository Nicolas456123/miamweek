export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Panier */}
      <path
        d="M12 24h40l-4 24H16L12 24z"
        fill="#dcfce7"
        stroke="#16a34a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Anse du panier */}
      <path
        d="M22 24c0-8 4-14 10-14s10 6 10 14"
        stroke="#16a34a"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lignes verticales du panier */}
      <line x1="26" y1="30" x2="25" y2="42" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="30" x2="32" y2="42" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="30" x2="39" y2="42" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Petite feuille qui dépasse */}
      <path
        d="M36 18c3-4 8-5 10-3-1 3-5 5-8 5"
        fill="#22c55e"
        stroke="#16a34a"
        strokeWidth="1.5"
      />
      {/* Carotte qui dépasse */}
      <path
        d="M28 20l-2-8"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M25 12c1-1 3-1 4 0"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
