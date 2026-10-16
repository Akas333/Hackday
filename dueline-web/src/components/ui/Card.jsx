export function Card({ title, subtitle, action, className = '', children, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || action) && (
        <div className="card-header">
          <div className="stack gap-4">
            {title && <div className="card-title">{title}</div>}
            {subtitle && <div className="muted" style={{ fontSize: 13 }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
