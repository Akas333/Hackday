export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={34} />}
      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
      {children && <div style={{ fontSize: 13, marginBottom: action ? 14 : 0 }}>{children}</div>}
      {action}
    </div>
  )
}

export function SkeletonRows({ count = 3 }) {
  const widths = ['80%', '58%', '68%', '50%']
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-row">
      <i />
      <b style={{ width: widths[i % widths.length] }} />
    </div>
  ))
}
