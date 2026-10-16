// Eight course identities. Tile colors are decorative pastels; `series` is the
// validated chart color for the same hue (calendar stripes, charts).
export const COURSE_COLORS = [
  { tile: '#a9c4f5', series: 'var(--c1)' }, // blue
  { tile: '#f2b48f', series: 'var(--c2)' }, // orange
  { tile: '#8fd8bf', series: 'var(--c3)' }, // aqua
  { tile: '#ecd27a', series: 'var(--c4)' }, // yellow
  { tile: '#eeb0c9', series: 'var(--c5)' }, // magenta
  { tile: '#a5d6a0', series: 'var(--c6)' }, // green
  { tile: '#c0b6f2', series: 'var(--c7)' }, // violet
  { tile: '#f0a5a5', series: 'var(--c8)' }, // red
]

export const seriesColor = (course) => COURSE_COLORS[(course?.slot ?? 0) % 8].series
export const tileColor = (course) => COURSE_COLORS[(course?.slot ?? 0) % 8].tile

const SHAPES = [
  // dome
  <g key="0"><path d="M4 13a8 8 0 0 1 16 0z" /><rect x="7" y="15" width="10" height="3.2" rx="1.2" /></g>,
  // quatrefoil
  <g key="1" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="8.5" cy="8.5" r="3.6" /><circle cx="15.5" cy="8.5" r="3.6" /><circle cx="8.5" cy="15.5" r="3.6" /><circle cx="15.5" cy="15.5" r="3.6" /></g>,
  // target
  <g key="2" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /></g>,
  // asterisk
  <g key="3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 3.5v17M4.6 7.75l14.8 8.5M4.6 16.25l14.8-8.5" /></g>,
  // clover
  <g key="4"><circle cx="12" cy="7.5" r="4.2" /><circle cx="7.5" cy="12.5" r="4.2" /><circle cx="16.5" cy="12.5" r="4.2" /><rect x="10.8" y="12" width="2.4" height="8.5" rx="1.2" /></g>,
  // diamond
  <path key="5" d="M12 3l9 9-9 9-9-9z" />,
  // sparkle
  <path key="6" d="M12 2.5c.8 5.2 4.3 8.7 9.5 9.5-5.2.8-8.7 4.3-9.5 9.5-.8-5.2-4.3-8.7-9.5-9.5 5.2-.8 8.7-4.3 9.5-9.5z" />,
  // stacked bars
  <g key="7"><rect x="4" y="4" width="16" height="4" rx="2" /><rect x="4" y="10" width="11" height="4" rx="2" /><rect x="4" y="16" width="16" height="4" rx="2" /></g>,
]

export function CourseGlyph({ course, slot, size = 44, radius }) {
  const s = slot ?? course?.slot ?? 0
  return (
    <div
      className="glyph-tile"
      style={{ width: size, height: size, background: COURSE_COLORS[s % 8].tile, borderRadius: radius ?? size * 0.24 }}
      aria-hidden="true"
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="currentColor">
        {SHAPES[s % 8]}
      </svg>
    </div>
  )
}
