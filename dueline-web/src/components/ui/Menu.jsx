import { useEffect, useRef, useState } from 'react'

/** Anchored popover that closes on outside click / Escape. `trigger` receives (open, toggle). */
export function Popover({ trigger, children, width, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div className="popover" style={{ width, ...(align === 'left' ? { left: 0, right: 'auto' } : {}) }}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon: Icon, children, danger, onClick }) {
  return (
    <button type="button" className={`menu-item ${danger ? 'danger' : ''}`} onClick={onClick}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}
