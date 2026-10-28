const ACTS = [
  "Penal Code, 1860",
  "CrPC, 1898",
  "Evidence Act, 1872",
  "Constitution",
  "Contract Act, 1872",
  "Nari-O-Shishu Act",
  "Digital Security → CSA",
  "Labour Act, 2006",
  "Family Courts Ordinance",
  "Artha Rin Adalat Ain",
  "Companies Act, 1994",
  "Land Reforms",
];

export function TrustBar() {
  const row = [...ACTS, ...ACTS];
  return (
    <section className="border-b border-line bg-bg py-8">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-faint">
        Built on Bangladeshi statutes
      </p>
      <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="marquee-track flex w-max items-center gap-3 pr-3">
          {row.map((a, i) => (
            <span
              key={`${a}-${i}`}
              className="whitespace-nowrap rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-muted shadow-sm"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
