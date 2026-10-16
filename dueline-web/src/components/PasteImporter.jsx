import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { parseDeadlines, TASK_TYPES } from '../lib/parse'
import { fmtShort } from '../lib/date'
import { SAMPLE_PASTE } from '../data/sample'
import { Button, Checkbox, CourseGlyph, EmptyState, Select, Textarea } from './ui'

/** Paste chat/portal text → tick the deadlines Dueline found → import. */
export function PasteImporter({ courses, today, onImport, compact }) {
  const [text, setText] = useState('')
  const [unticked, setUnticked] = useState(new Set())
  const [overrides, setOverrides] = useState({})
  const found = useMemo(() => parseDeadlines(text, courses, today), [text, courses, today])
  const items = found.map((f) => ({ ...f, ...overrides[f.key] }))
  const chosen = items.filter((f) => !unticked.has(f.key))

  return (
    <div className="stack gap-12">
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setUnticked(new Set())
        }}
        placeholder={'Paste from WhatsApp, Teams or VTOP…\n\ne.g. "BCSE302L DA 2 due 28 Oct"'}
        style={compact ? { minHeight: 120 } : undefined}
      />
      {!text && (
        <button className="link-btn row" style={{ alignSelf: 'flex-start', padding: 0 }} onClick={() => setText(SAMPLE_PASTE)}>
          <Sparkles size={14} /> Try an example message
        </button>
      )}
      {text && found.length === 0 && (
        <EmptyState title="No dates found yet">Lines need a date like "28 Oct", "3/11", "Friday" or "tomorrow".</EmptyState>
      )}
      {items.length > 0 && (
        <div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Found {items.length} — tick the ones to add</div>
          {items.map((f) => {
            const course = courses.find((c) => c.id === f.courseId)
            const on = !unticked.has(f.key)
            return (
              <div key={f.key} className="list-item" style={{ opacity: on ? 1 : 0.5 }}>
                <Checkbox
                  checked={on}
                  label={f.title}
                  onChange={() =>
                    setUnticked((s) => {
                      const n = new Set(s)
                      n.has(f.key) ? n.delete(f.key) : n.add(f.key)
                      return n
                    })
                  }
                />
                <CourseGlyph course={course} size={30} />
                <div className="grow">
                  <div className="truncate" style={{ fontWeight: 600 }}>{f.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {fmtShort(f.due)} · {TASK_TYPES[f.type].label} · ~{f.hours}h
                  </div>
                </div>
                {courses.length > 1 && (
                  <Select
                    value={f.courseId || ''}
                    onChange={(e) => setOverrides((o) => ({ ...o, [f.key]: { ...o[f.key], courseId: e.target.value } }))}
                    style={{ width: 130, height: 34, fontSize: 12 }}
                    aria-label="Course"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.code || c.name}</option>
                    ))}
                  </Select>
                )}
              </div>
            )
          })}
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
            <Button
              disabled={!chosen.length || !chosen.every((c) => c.courseId)}
              onClick={() => {
                onImport(chosen.map(({ title, due, type, courseId, hours, weight }) => ({ title, due, type, courseId, hours, weight })))
                setText('')
              }}
            >
              Add {chosen.length} deadline{chosen.length === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
