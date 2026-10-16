import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useUI } from '../components/layout/UIContext'
import { Button, Checkbox, CourseGlyph, EmptyState, IconButton, SearchInput, Segmented, seriesColor } from '../components/ui'
import { DOW_LABEL, MONTHS, addDays, dow, fmtHours, fmtShort, fromKey, monthMatrix, rangeKeys, startOfWeek, timeToMin } from '../lib/date'

export default function Schedule() {
  const { state, plan, summary, today, taskById, courseById } = useApp()
  const ui = useUI()
  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(today)
  const [hidden, setHidden] = useState(new Set())
  const [query, setQuery] = useState('')

  const matches = (t) =>
    !hidden.has(t.courseId) && (!query || t.title.toLowerCase().includes(query.toLowerCase()))

  // events per day: due markers + planned study blocks
  const eventsFor = useMemo(() => {
    const dues = {}
    state.tasks.forEach((t) => {
      if (!matches(t)) return
      ;(dues[t.due] ||= []).push(t)
    })
    return (day) => ({
      dues: dues[day] || [],
      blocks: (plan.days[day] || []).filter((b) => matches(taskById[b.taskId])),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tasks, plan, hidden, query, taskById])

  const cur = fromKey(cursor)
  const shift = (dir) => {
    if (view === 'month') setCursor(fromKeyToKey(new Date(cur.getFullYear(), cur.getMonth() + dir, 1)))
    else if (view === 'week') setCursor(addDays(cursor, 7 * dir))
    else setCursor(addDays(cursor, dir))
  }
  const title =
    view === 'day' ? fmtShort(cursor) : `${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`

  const late = summary.atRisk.length
  const statusLine = summary.open.length
    ? `${late ? `${late} at risk` : 'all deadlines met'} · finishes ${summary.avgEarly.toFixed(1)} day(s) early on average · peak day ${fmtHours(summary.peak)}`
    : 'no open deadlines'

  return (
    <div className="cal-layout">
      <aside className="cal-side">
        <h2 style={{ fontSize: 24 }}>Calendar</h2>
        <SearchInput value={query} onChange={setQuery} placeholder="Search tasks…" />
        <MiniCalendar cursor={cursor} onPick={(d) => { setCursor(d); if (view === 'month') return }} hasEvents={(d) => (plan.days[d] || []).length > 0 || state.tasks.some((t) => t.due === d && !t.completed)} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>My courses</div>
          <div className="stack gap-12">
            {state.courses.map((c) => (
              <div key={c.id} className="row gap-12">
                <Checkbox
                  checked={!hidden.has(c.id)}
                  color={seriesColor(c)}
                  label={`Show ${c.name}`}
                  onChange={() =>
                    setHidden((h) => {
                      const n = new Set(h)
                      n.has(c.id) ? n.delete(c.id) : n.add(c.id)
                      return n
                    })
                  }
                />
                <CourseGlyph course={c} size={26} radius={7} />
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
        <Button block icon={Plus} onClick={() => ui.openDeadline()}>New deadline</Button>
      </aside>

      <main className="cal-main">
        <div className="cal-toolbar">
          <h2>{title}</h2>
          <Button variant="secondary" size="sm" rect onClick={() => setCursor(today)}>Today</Button>
          <IconButton icon={ChevronLeft} size="sm" label="Previous" onClick={() => shift(-1)} />
          <IconButton icon={ChevronRight} size="sm" label="Next" onClick={() => shift(1)} />
          <span className="grow" />
          <span className="muted hide-sm" style={{ fontSize: 13, textAlign: 'right', maxWidth: 320 }}>
            <span className={late ? 'danger-text' : undefined}>{statusLine}</span>
          </span>
          <Segmented value={view} onChange={setView} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
        </div>

        {view === 'month' && (
          <MonthView cursor={cursor} today={today} eventsFor={eventsFor} taskById={taskById} courseById={courseById} onDay={(d) => { setCursor(d); setView('day') }} onTask={ui.openTask} />
        )}
        {view === 'week' && (
          <WeekView cursor={cursor} today={today} eventsFor={eventsFor} taskById={taskById} courseById={courseById} capacity={(d) => state.availability.hours[dow(d)]} busy={state.busyDays} onDay={(d) => { setCursor(d); setView('day') }} onTask={ui.openTask} />
        )}
        {view === 'day' && (
          <DayView day={cursor} today={today} eventsFor={eventsFor} taskById={taskById} courseById={courseById} plan={plan} onTask={ui.openTask} />
        )}
      </main>
    </div>
  )
}

const fromKeyToKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function MiniCalendar({ cursor, onPick, hasEvents }) {
  const { today } = useApp()
  const [month, setMonth] = useState(() => {
    const d = fromKey(cursor)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const weeks = monthMatrix(month.y, month.m)
  const go = (dir) => {
    const d = new Date(month.y, month.m + dir, 1)
    setMonth({ y: d.getFullYear(), m: d.getMonth() })
  }
  return (
    <div>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <IconButton icon={ChevronLeft} size="sm" label="Previous month" onClick={() => go(-1)} />
        <span style={{ fontWeight: 600 }}>{MONTHS[month.m]}</span>
        <IconButton icon={ChevronRight} size="sm" label="Next month" onClick={() => go(1)} />
      </div>
      <div className="mini-cal">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="h">{d}</span>)}
        {weeks.flat().map((d) => (
          <button
            key={d}
            className={[fromKey(d).getMonth() !== month.m && 'out', d === today && 'today', d === cursor && 'sel', hasEvents(d) && 'has'].filter(Boolean).join(' ')}
            onClick={() => onPick(d)}
          >
            {fromKey(d).getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

function EventChip({ task, course, label, due, onClick }) {
  return (
    <button
      className={`event ${due ? 'due' : ''} ${task.completed ? 'done' : ''}`}
      style={{ '--series': seriesColor(course) }}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick(task.id)
      }}
    >
      {label}
    </button>
  )
}

function MonthView({ cursor, today, eventsFor, taskById, courseById, onDay, onTask }) {
  const cur = fromKey(cursor)
  const weeks = monthMatrix(cur.getFullYear(), cur.getMonth())
  const MAX = 3
  return (
    <div className="month-grid">
      {DOW_LABEL.map((d) => <div key={d} className="dow">{d}</div>)}
      {weeks.flat().map((d) => {
        const { dues, blocks } = eventsFor(d)
        const items = [
          ...dues.map((t) => ({ key: `d${t.id}`, task: t, due: true, label: `Due · ${t.title}` })),
          ...blocks.map((b) => {
            const t = taskById[b.taskId]
            return { key: `b${t.id}`, task: t, label: `${t.title} · ${fmtHours(b.hours)}` }
          }),
        ]
        const out = fromKey(d).getMonth() !== cur.getMonth()
        return (
          <div key={d} className={`month-cell ${out ? 'out' : ''} ${d < today ? 'past' : ''}`} onClick={() => onDay(d)}>
            <span className={`daynum ${d === today ? 'today' : ''}`}>{fromKey(d).getDate()}</span>
            {items.slice(0, MAX).map((it) => (
              <EventChip key={it.key} task={it.task} course={courseById[it.task.courseId]} label={it.label} due={it.due} onClick={onTask} />
            ))}
            {items.length > MAX && <span className="more-link">+{items.length - MAX} more</span>}
          </div>
        )
      })}
    </div>
  )
}

function WeekView({ cursor, today, eventsFor, taskById, courseById, capacity, busy, onDay, onTask }) {
  const days = rangeKeys(startOfWeek(cursor), 7)
  return (
    <div className="week-grid">
      {days.map((d) => {
        const { dues, blocks } = eventsFor(d)
        const planned = blocks.reduce((s, b) => s + b.hours, 0)
        const cap = busy.includes(d) ? 0 : capacity(d)
        return (
          <div key={d} className={`week-col ${d === today ? 'today' : ''}`}>
            <button className="week-col-head" style={{ background: 'none', border: 0, borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }} onClick={() => onDay(d)}>
              <span className="num" style={d === today ? { color: 'var(--accent)' } : undefined}>{fromKey(d).getDate()}</span>
              <span className="muted">{DOW_LABEL[dow(d)]}</span>
              <span className="grow" />
              <span className="faint" style={{ fontSize: 11 }}>{busy.includes(d) ? 'busy' : d >= today ? `${fmtHours(planned)}/${fmtHours(cap)}` : ''}</span>
            </button>
            {d >= today && (
              <div className="load-meter" title={`${fmtHours(planned)} planned of ${fmtHours(cap)} free`}>
                <div style={{ width: `${cap ? Math.min(100, (planned / cap) * 100) : 0}%` }} />
              </div>
            )}
            {dues.map((t) => (
              <EventChip key={t.id} task={t} course={courseById[t.courseId]} due label={`Due · ${t.title}`} onClick={onTask} />
            ))}
            {blocks.map((b) => {
              const t = taskById[b.taskId]
              const c = courseById[t.courseId]
              return (
                <button key={b.taskId} className="wk-block" style={{ '--series': seriesColor(c) }} onClick={() => onTask(t.id)}>
                  <b>{t.title}</b>
                  <span className="muted">{b.start} – {b.end} · {fmtHours(b.hours)}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function DayView({ day, today, eventsFor, taskById, courseById, plan, onTask }) {
  const { dues, blocks } = eventsFor(day)
  const startMin = blocks.length ? Math.floor(timeToMin(blocks[0].start) / 60) * 60 : 9 * 60
  const endMin = blocks.length ? Math.ceil(timeToMin(blocks[blocks.length - 1].end) / 60) * 60 : 18 * 60
  const hours = Math.max(4, (endMin - startMin) / 60 + 1)
  const HOUR_PX = 56
  return (
    <div className="day-view">
      <div>
        {blocks.length === 0 ? (
          <EmptyState title={day < today ? 'This day has passed' : 'No study planned'}>
            {day < today ? 'Plans only cover today onwards.' : 'Either nothing is due soon, or this day is blocked as busy.'}
          </EmptyState>
        ) : (
          <div className="timeline" style={{ height: hours * HOUR_PX }}>
            {Array.from({ length: hours }, (_, i) => (
              <div key={i} className="timeline-hour">
                <span>{String((startMin / 60 + i) % 24).padStart(2, '0')}:00</span>
              </div>
            ))}
            {blocks.map((b) => {
              const t = taskById[b.taskId]
              const c = courseById[t.courseId]
              const top = ((timeToMin(b.start) - startMin) / 60) * HOUR_PX
              return (
                <button
                  key={b.taskId}
                  className="timeline-block"
                  style={{ '--series': seriesColor(c), top: top + 2, height: b.hours * HOUR_PX - 4, textAlign: 'left', border: 0, borderLeft: '4px solid var(--series)', cursor: 'pointer' }}
                  onClick={() => onTask(t.id)}
                >
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{b.start} – {b.end} · {c?.name}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div className="stack gap-12">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>Due this day</div>
          {dues.length === 0 && <div className="muted">Nothing due.</div>}
          {dues.map((t) => (
            <button key={t.id} className="menu-item" onClick={() => onTask(t.id)}>
              <CourseGlyph course={courseById[t.courseId]} size={28} />
              <span className="grow truncate">{t.title}</span>
              {plan.info[t.id]?.atRisk && <span className="chip danger">at risk</span>}
            </button>
          ))}
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>Session total</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700 }}>{fmtHours(blocks.reduce((s, b) => s + b.hours, 0))}</div>
          <div className="muted">across {blocks.length} task{blocks.length === 1 ? '' : 's'}</div>
        </div>
      </div>
    </div>
  )
}
