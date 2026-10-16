export function ProgressBar({ value, color }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
