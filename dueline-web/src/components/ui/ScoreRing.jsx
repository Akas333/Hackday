/** Segmented ring: one dash per point, lit up to the score. */
export function ScoreRing({ value, max = 10, size = 150, label = 'on track', tone }) {
  const stroke = size * 0.075
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const seg = c / max
  const gap = Math.min(6, seg * 0.25)
  const color = tone === 'danger' ? 'var(--danger)' : tone === 'warning' ? 'var(--warning)' : 'var(--accent)'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {Array.from({ length: max }, (_, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={value != null && i < value ? color : 'var(--surface-3)'}
            strokeWidth={stroke}
            strokeDasharray={`${seg - gap} ${c - seg + gap}`}
            strokeDashoffset={-i * seg}
            style={{ transition: 'stroke 0.4s' }}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.24, lineHeight: 1 }}>
            {value ?? '–'}
            {value != null && <span style={{ fontSize: size * 0.11, color: 'var(--text-2)' }}>/{max}</span>}
          </div>
          <div className="muted" style={{ fontSize: Math.max(11, size * 0.085), marginTop: 4 }}>{label}</div>
        </div>
      </div>
    </div>
  )
}
