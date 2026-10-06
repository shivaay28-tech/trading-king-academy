export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute -top-8 -right-6 h-28 w-28 rounded-full bg-bright/20 blur-3xl" />
      <div className="glass-dark relative overflow-hidden rounded-3xl p-5 shadow-float">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-accent uppercase">Learning dashboard</p>
            <p className="mt-1 text-sm font-semibold text-ink">Market literacy, not trade calls</p>
          </div>
          <span className="rounded-full bg-baazex/10 px-2.5 py-1 text-[11px] text-accent">Education</span>
        </div>
        <svg viewBox="0 0 420 180" className="h-40 w-full" role="img" aria-label="Illustrative educational price chart">
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7ED0FF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7ED0FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 140 C40 130, 70 90, 110 100 S170 150, 210 110 S280 40, 330 70 S390 120, 420 80 L420 180 L0 180 Z" fill="url(#area)" />
          <path d="M0 140 C40 130, 70 90, 110 100 S170 150, 210 110 S280 40, 330 70 S390 120, 420 80" fill="none" stroke="#7ED0FF" strokeWidth="3" />
          {[30, 90, 150, 210, 270, 330, 390].map((x, index) => (
            <rect key={x} x={x} y={50 + (index % 3) * 18} width="10" height={70 - (index % 3) * 12} rx="2" fill={index % 2 ? '#5EB8F5' : '#7dd3ff'} opacity="0.55" />
          ))}
        </svg>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Modules', value: '8' },
            { label: 'Avg. lesson', value: '14m' },
            { label: 'Pass mark', value: '70%' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-baazex/5 p-3">
              <p className="text-[11px] text-muted">{item.label}</p>
              <p className="mt-1 text-lg font-bold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass absolute -bottom-5 -left-4 w-40 rounded-2xl p-3">
        <p className="text-[11px] text-muted">Course progress</p>
        <p className="mt-1 text-sm font-semibold text-ink">Risk fundamentals</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-baazex/15">
          <div className="h-full w-2/3 rounded-full bg-bright" />
        </div>
      </div>
    </div>
  )
}
