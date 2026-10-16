import { Check } from 'lucide-react'

export function Checkbox({ checked, onChange, label, round, color }) {
  const style = checked && color ? { background: color, borderColor: color } : undefined
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={`checkbox ${checked ? 'checked' : ''} ${round ? 'round' : ''}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
    >
      {checked && <Check size={13} strokeWidth={3} />}
    </button>
  )
}
