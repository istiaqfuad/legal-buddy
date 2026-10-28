// Brand mark: deep-emerald tile, open-book pages, gold section-paragraph
// spine — "the law, read and cited". Crisp from 16px favicon to hero.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="LegalBuddy"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lbTile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E9A70" />
          <stop offset="0.55" stopColor="#147153" />
          <stop offset="1" stopColor="#0B3D2C" />
        </linearGradient>
        <linearGradient id="lbGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0D49A" />
          <stop offset="1" stopColor="#C9A45C" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lbTile)" />
      <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="#ffffff" strokeOpacity="0.18" />
      <g fill="#ffffff">
        <path d="M14.6 10.6C11.6 9.6 8.6 9.6 6.4 10.1v10.2c2.2-.5 5.2-.5 8.2 1.1Z" opacity="0.96" />
        <path d="M17.4 10.6c3 1 6 1 8.2.5v10.2c-2.2.5-5.2.5-8.2-1.1Z" opacity="0.96" />
      </g>
      <rect x="15.35" y="9.4" width="1.3" height="13" rx="0.65" fill="url(#lbGold)" />
      <circle cx="16" cy="22.6" r="0.9" fill="#F0D49A" />
    </svg>
  );
}
