export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 4a12 12 0 1 1-11.3 8" fill="none" stroke="var(--accent)" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="4" fill="var(--accent)" />
    </svg>
  )
}

export function Brand() {
  return (
    <span className="brand">
      <Logo />
      Dueline
    </span>
  )
}
