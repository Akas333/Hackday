import { CheckCircle2 } from 'lucide-react'

export function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className="toast" role="status" key={toast.id}>
      <CheckCircle2 size={17} />
      {toast.msg}
    </div>
  )
}
