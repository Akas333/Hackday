import { addDays, dow, fromKey, toKey } from './date'

export const TASK_TYPES = {
  quiz: { label: 'Quiz', hours: 3, weight: 5 },
  cat: { label: 'CAT', hours: 8, weight: 15 },
  assignment: { label: 'Assignment', hours: 4, weight: 10 },
  da: { label: 'Digital assignment', hours: 5, weight: 10 },
  lab: { label: 'Lab', hours: 2, weight: 5 },
  project: { label: 'Project', hours: 10, weight: 20 },
  presentation: { label: 'Presentation', hours: 4, weight: 10 },
  exam: { label: 'Exam', hours: 14, weight: 40 },
  other: { label: 'Other', hours: 3, weight: 5 },
}

const TYPE_PATTERNS = [
  ['quiz', /\bquiz/i],
  ['cat', /\bcat[\s-]?\d|\bcat\b|continuous assessment/i],
  ['da', /\bda[\s-]?\d|\bdigital assignment/i],
  ['assignment', /\bassignment|\bhomework|\bhw\b/i],
  ['lab', /\blab\b|\bexperiment|\brecord/i],
  ['project', /\bproject|\breview\b/i],
  ['presentation', /\bpresentation|\bppt\b|\bseminar/i],
  ['exam', /\bexam|\bfat\b|\bfinal/i],
]

export const CODE_RE = /\b([A-Z]{3,5}\s?\d{3}[A-Z]?)\b/

const MONTH_IDX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
const DOWS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function nextOnOrAfter(today, monthIdx, day) {
  const t = fromKey(today)
  let d = new Date(t.getFullYear(), monthIdx, day)
  // dates more than ~2 months in the past are taken as next year
  if ((t - d) / 86400000 > 60) d = new Date(t.getFullYear() + 1, monthIdx, day)
  return toKey(d)
}

export function findDate(text, today) {
  const s = text.toLowerCase()
  if (/\btoday\b|\btonight\b/.test(s)) return today
  if (/\btomorrow\b|\btmrw\b|\btmr\b/.test(s)) return addDays(today, 1)

  let m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/)
  if (m) return nextOnOrAfter(today, MONTH_IDX[m[2]], +m[1])
  m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/)
  if (m) return nextOnOrAfter(today, MONTH_IDX[m[1]], +m[2])
  m = s.match(/\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/)
  if (m) {
    const day = +m[1]
    const mon = +m[2] - 1
    if (day >= 1 && day <= 31 && mon >= 0 && mon <= 11) {
      if (m[3]) {
        const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
        return toKey(new Date(y, mon, day))
      }
      return nextOnOrAfter(today, mon, day)
    }
  }
  m = s.match(/\b(next\s+)?(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/)
  if (m) {
    const target = DOWS.indexOf(m[2])
    let delta = (target - dow(today) + 7) % 7
    if (delta === 0) delta = 7
    if (m[1]) delta += delta < 7 ? 7 : 0
    return addDays(today, delta)
  }
  return null
}

export function detectType(text) {
  for (const [type, re] of TYPE_PATTERNS) if (re.test(text)) return type
  return 'other'
}

function cleanTitle(line) {
  return line
    .replace(/^\s*(\[[^\]]*\]|\d{1,2}[/.]\d{1,2}[/.]\d{2,4},?\s*\d{1,2}:\d{2}(\s?[ap]m)?\s*-)\s*/i, '') // WhatsApp timestamp
    .replace(/^[^:]{1,30}:\s+/, '') // sender name
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Pulls likely deadlines out of pasted chat / portal text. */
export function parseDeadlines(text, courses, today) {
  const out = []
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  for (const raw of lines) {
    const due = findDate(raw, today)
    if (!due) continue
    const line = cleanTitle(raw)
    const type = detectType(line)
    const codeMatch = line.toUpperCase().match(CODE_RE)
    let course = null
    if (codeMatch) {
      const code = codeMatch[1].replace(/\s/g, '')
      course = courses.find((c) => c.code && c.code.toUpperCase() === code)
    }
    if (!course) {
      course = courses.find((c) => c.name && line.toLowerCase().includes(c.name.toLowerCase()))
    }
    let title = line
      .replace(/\b(is|are)?\s*(due|on|by|before)\b.*$/i, '')
      .replace(/[-–:,]+\s*$/, '')
      .trim()
    if (title.length < 3) title = line
    if (title.length > 70) title = title.slice(0, 67) + '…'
    const def = TASK_TYPES[type]
    out.push({
      key: `${raw}-${out.length}`,
      title,
      due,
      type,
      courseId: course?.id || courses[0]?.id || null,
      hours: def.hours,
      weight: def.weight,
      source: raw,
    })
  }
  return out
}

export function parseCourseLine(line) {
  const trimmed = line.replace(/^[-•*\d.)\s]+/, '').trim()
  if (!trimmed) return null
  const m = trimmed.toUpperCase().match(CODE_RE)
  if (m) {
    const code = m[1].replace(/\s/g, '')
    const idx = trimmed.toUpperCase().indexOf(m[1])
    const name = (trimmed.slice(0, idx) + trimmed.slice(idx + m[1].length)).replace(/^[\s\-–:|]+|[\s\-–:|]+$/g, '').trim()
    return { code, name: name || code }
  }
  return { code: '', name: trimmed }
}
