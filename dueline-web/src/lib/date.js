// Dates are handled as local "YYYY-MM-DD" keys so day maths never drifts with time zones.

export const DOW_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const DOW_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3))

const pad = (n) => String(n).padStart(2, '0')

export function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toKey(new Date())
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function diffDays(a, b) {
  // whole days from a to b
  return Math.round((fromKey(b) - fromKey(a)) / 86400000)
}

export function dow(key) {
  return fromKey(key).getDay()
}

export function startOfWeek(key, weekStartsOn = 0) {
  const d = dow(key)
  return addDays(key, -((d - weekStartsOn + 7) % 7))
}

export function rangeKeys(start, count) {
  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

export function monthMatrix(year, month) {
  // 6x7 grid of keys starting on Sunday
  const first = toKey(new Date(year, month, 1))
  const start = startOfWeek(first)
  const weeks = []
  for (let w = 0; w < 6; w++) weeks.push(rangeKeys(addDays(start, w * 7), 7))
  // drop trailing week if fully outside month
  if (fromKey(weeks[5][0]).getMonth() !== month) weeks.pop()
  return weeks
}

export function fmtShort(key) {
  const d = fromKey(key)
  return `${DOW_LABEL[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export function fmtDayMonth(key) {
  const d = fromKey(key)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export function relDay(from, to) {
  const n = diffDays(from, to)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  if (n < 0) return `${-n} days ago`
  return `in ${n} days`
}

export function fmtHours(h) {
  const r = Math.round(h * 10) / 10
  return `${Number.isInteger(r) ? r : r.toFixed(1)}h`
}

export function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minToTime(min) {
  const h = Math.floor(min / 60) % 24
  return `${pad(h)}:${pad(Math.round(min % 60))}`
}
