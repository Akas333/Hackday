export function StatTile({ value, label, sub, tone, align, onClick }) {
  const color = tone === 'danger' ? 'var(--danger)' : tone === 'success' ? 'var(--success)' : undefined
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={`stat ${align === 'left' ? 'left' : ''}`} onClick={onClick} style={onClick ? { border: 0, cursor: 'pointer', width: '100%' } : undefined}>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-label" style={{ marginTop: 0 }}>{sub}</div>}
    </Tag>
  )
}
