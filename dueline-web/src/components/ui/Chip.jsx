export function Chip({ tone, icon: Icon, children, onClick, selected, className = '' }) {
  const cls = `chip ${tone || ''} ${selected ? 'selected' : ''} ${className}`
  const content = (
    <>
      {Icon && <Icon size={13} />}
      {children}
    </>
  )
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-pressed={selected}>
      {content}
    </button>
  ) : (
    <span className={cls}>{content}</span>
  )
}
