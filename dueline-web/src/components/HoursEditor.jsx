import { DOW_LABEL } from '../lib/date'

const ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon first

export function HoursEditor({ hours, onChange }) {
  const total = hours.reduce((a, b) => a + b, 0)
  return (
    <div>
      {ORDER.map((d) => (
        <div key={d} className="hours-row">
          <span style={{ fontWeight: 600, color: d === 0 || d === 6 ? 'var(--accent)' : undefined }}>{DOW_LABEL[d]}</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={hours[d]}
            aria-label={`${DOW_LABEL[d]} study hours`}
            onChange={(e) => {
              const next = [...hours]
              next[d] = Number(e.target.value)
              onChange(next)
            }}
          />
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{hours[d]}h</span>
        </div>
      ))}
      <div className="row-between muted" style={{ fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
        <span>Per week</span>
        <b style={{ color: 'var(--text)' }}>{total}h</b>
      </div>
    </div>
  )
}
