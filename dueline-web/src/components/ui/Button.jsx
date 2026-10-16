export function Button({ variant = 'primary', size, block, rect, icon: Icon, iconRight: IconRight, className = '', children, ...props }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', rect && 'btn-rect', className]
    .filter(Boolean)
    .join(' ')
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 19 : 17
  return (
    <button type="button" className={cls} {...props}>
      {Icon && <Icon size={iconSize} />}
      {children}
      {IconRight && <IconRight size={iconSize} />}
    </button>
  )
}

export function IconButton({ icon: Icon, label, size, dot, className = '', ...props }) {
  return (
    <button type="button" className={`icon-btn ${size || ''} ${className}`} aria-label={label} title={label} {...props}>
      <Icon size={size === 'sm' ? 17 : 19} />
      {dot && <span className="dot" />}
    </button>
  )
}
