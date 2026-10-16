import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarCheck, CalendarDays, CalendarX2, Check, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Pencil, Plus, SlidersHorizontal, Undo2, Zap } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useUI } from '../components/layout/UIContext'
import { Button, Card, CourseGlyph, EmptyState, IconButton, MenuItem, Popover, ProgressBar, ScoreRing, StatTile, seriesColor } from '../components/ui'
import { DOW_SHORT, MONTHS, addDays, diffDays, dow, fmtHours, fromKey, rangeKeys, relDay, startOfWeek } from '../lib/date'

export default function Home() {
  return (
    <div className="home-grid">
      <SemesterColumn />
      <CoursesColumn />
      <TodayColumn />
    </div>
  )
}

function SemesterColumn() {
  const { summary, plan, today, state } = useApp()
  const ui = useUI()
  const navigate = useNavigate()
  const { health, atRisk, open, next, totalLeft, weekPlanned } = summary
  const nextIn = next ? diffDays(today, next.due) : null

  const buckets = [
    { label: 'This week', from: 0, to: 6 },
    { label: 'Next week', from: 7, to: 13 },
    { label: 'Later', from: 14, to: 9999 },
  ].map((b) => {
    const list = open.filter((t) => {
      const d = diffDays(today, t.due)
      return d >= b.from && d <= b.to
    })
    return { ...b, count: list.length, hours: list.reduce((s, t) => s + plan.info[t.id].left, 0) }
  })
  const in14 = open.filter((t) => diffDays(today, t.due) >= 0 && diffDays(today, t.due) < 14).length

  return (
    <section>
      <div className="ring-wrap">
        <ScoreRing value={health} tone={atRisk.length > 2 ? 'danger' : atRisk.length ? 'warning' : undefined} />
        <h2 style={{ fontSize: 26, marginTop: 10 }}>Your semester</h2>
        <div className="muted">
          {open.length === 0
            ? 'Add a deadline to get a plan'
            : atRisk.length
              ? `${atRisk.length} deadline${atRisk.length > 1 ? 's' : ''} won't fit your free time`
              : 'Every deadline fits your free time'}
        </div>
        <div className="row" style={{ marginTop: 4 }}>
          <CalendarDays size={16} color="var(--accent)" />
          <span>{fmtHours(weekPlanned)} of study planned this week</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '24px 0 16px' }}>
        <StatTile value={open.length} label="Open tasks" onClick={() => navigate('/tasks')} />
        <StatTile value={fmtHours(totalLeft)} label="Work left" sub={state.reality !== 1 ? `×${state.reality} reality` : null} onClick={() => navigate('/workload')} />
        <StatTile
          value={nextIn == null ? '–' : nextIn === 0 ? 'Today' : `${nextIn}d`}
          label="Next deadline"
          tone={nextIn != null && nextIn <= 1 ? 'danger' : undefined}
          onClick={next ? () => ui.openTask(next.id) : undefined}
        />
      </div>

      {atRisk.length > 0 && (
        <div className="course-alert danger" style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => ui.openTask(atRisk[0].id)}>
          <AlertTriangle size={16} />
          <span className="grow truncate">
            <b>{atRisk[0].title}</b> needs {plan.info[atRisk[0].id].shortfall}h more than you have
          </span>
          <ChevronRight size={16} />
        </div>
      )}

      <Card
        title="Deadlines ahead"
        subtitle={next ? <>{in14} in the next 14 days · next: <b style={{ color: 'var(--text)' }}>{next.title}</b>, {relDay(today, next.due)}</> : 'Nothing scheduled yet'}
        action={<Button icon={Plus} onClick={() => ui.openDeadline()}>Add</Button>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {buckets.map((b, i) => (
            <div key={b.label} style={{ paddingLeft: i ? 14 : 0, borderLeft: i ? '1px solid var(--border)' : 0 }}>
              <div className="muted" style={{ fontSize: 13 }}>{b.label}</div>
              <div style={{ marginTop: 2 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>{b.count}</span>
                <span className="muted"> · {fmtHours(b.hours)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="secondary" rect block icon={SlidersHorizontal} onClick={ui.openHours} style={{ marginTop: 14, height: 52, justifyContent: 'flex-start', padding: '0 18px' }}>
        Study hours & busy days
      </Button>
    </section>
  )
}

function CoursesColumn() {
  const { state, plan, today } = useApp()
  const ui = useUI()
  return (
    <section>
      <div className="row-between" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 28 }}>Courses</h2>
        <IconButton icon={Plus} label="Add course" onClick={() => ui.openCourse()} />
      </div>
      {state.courses.length === 0 && (
        <EmptyState title="No courses yet" action={<Button size="sm" icon={Plus} onClick={() => ui.openCourse()}>Add course</Button>}>
          Add the courses you're taking this semester.
        </EmptyState>
      )}
      {state.courses.map((c) => {
        const tasks = state.tasks.filter((t) => t.courseId === c.id)
        const doneCount = tasks.filter((t) => t.completed).length
        const totalH = tasks.reduce((s, t) => s + t.hours * (state.reality || 1), 0)
        const doneH = tasks.reduce((s, t) => s + (t.completed ? t.hours * (state.reality || 1) : Math.min(t.done || 0, t.hours * (state.reality || 1))), 0)
        const pct = totalH ? doneH / totalH : 0
        const open = tasks.filter((t) => !t.completed).sort((a, b) => (a.due < b.due ? -1 : 1))
        const risky = open.find((t) => plan.info[t.id].atRisk)
        const soon = open.find((t) => plan.info[t.id].daysLeft >= 0 && plan.info[t.id].daysLeft <= 2)
        return (
          <div key={c.id} className="course-card">
            <div className="row gap-16">
              <CourseGlyph course={c} size={72} />
              <div className="grow stack gap-4">
                <div className="row-between">
                  <span className="truncate" style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</span>
                  <Popover width={200} trigger={(o, toggle) => <IconButton icon={MoreHorizontal} size="sm" label="Course options" onClick={toggle} />}>
                    {(close) => (
                      <>
                        <MenuItem icon={Plus} onClick={() => { close(); ui.openDeadline({ courseId: c.id }) }}>Add deadline</MenuItem>
                        <MenuItem icon={Pencil} onClick={() => { close(); ui.openCourse(c) }}>Edit course</MenuItem>
                      </>
                    )}
                  </Popover>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  <b style={{ color: 'var(--text)' }}>{doneCount}</b>/{tasks.length} tasks · <b style={{ color: 'var(--text)' }}>{Math.round(pct * 100)}%</b>
                  {c.code && ` · ${c.code}`}
                </div>
                <div style={{ marginTop: 6 }}>
                  <ProgressBar value={pct} color={seriesColor(c)} />
                </div>
              </div>
            </div>
            {risky ? (
              <button className="course-alert danger" style={{ border: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => ui.openTask(risky.id)}>
                <AlertTriangle size={15} /> <span className="truncate">{risky.title} won't fit — {plan.info[risky.id].shortfall}h short</span>
              </button>
            ) : soon ? (
              <button className="course-alert" style={{ border: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => ui.openTask(soon.id)}>
                <Clock size={15} /> <span className="truncate">{soon.title} due {relDay(today, soon.due)}</span>
              </button>
            ) : null}
          </div>
        )
      })}
    </section>
  )
}

function TodayColumn() {
  const { state, plan, today, taskById, courseById, dispatch, notify } = useApp()
  const ui = useUI()
  const [selected, setSelected] = useState(today)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today, 1))
  const week = rangeKeys(weekStart, 7)
  const blocks = plan.days[selected] || []
  const isToday = selected === today
  const logged = state.loggedDays.includes(selected)
  const busy = state.busyDays.includes(selected)
  const cap = state.availability.hours[dow(selected)]
  const planned = blocks.reduce((s, b) => s + b.hours, 0)
  const dueThatDay = state.tasks.filter((t) => t.due === selected)
  const monthLabel = (() => {
    const d = fromKey(week[3])
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  })()

  return (
    <section>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <IconButton icon={ChevronLeft} label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))} />
        <span style={{ fontWeight: 700, fontSize: 17 }}>{monthLabel}</span>
        <IconButton icon={ChevronRight} label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))} />
      </div>
      <div className="week-strip">
        {week.map((d) => (
          <button
            key={d}
            className={`${d === selected ? 'selected' : ''} ${d < today ? 'past' : ''}`}
            onClick={() => setSelected(d)}
            aria-label={d}
          >
            <span className="num">{fromKey(d).getDate()}</span>
            <span className="dow">{d === today ? 'today' : DOW_SHORT[dow(d)]}</span>
            <span className={`pip ${(plan.days[d] || []).length || state.tasks.some((t) => t.due === d && !t.completed) ? '' : 'none'}`} />
          </button>
        ))}
      </div>

      <div className="row-between" style={{ margin: '22px 0 10px' }}>
        <span style={{ fontWeight: 600 }}>{isToday ? 'Today' : relDay(today, selected).replace(/^\w/, (c) => c.toUpperCase())}</span>
        <span className="muted" style={{ fontSize: 13 }}>
          {busy ? 'Blocked as busy' : logged && isToday ? 'Logged ✓' : selected < today ? '' : `${fmtHours(planned)} of ${fmtHours(cap)} free`}
        </span>
      </div>

      <div className="stack gap-8">
        {dueThatDay.map((t) => (
          <button key={t.id} className="course-alert" style={{ border: 0, cursor: 'pointer', textAlign: 'left', background: 'var(--surface)', color: 'var(--text)' }} onClick={() => ui.openTask(t.id)}>
            <CalendarCheck size={15} color={seriesColor(courseById[t.courseId])} />
            <span className="truncate grow">Due: <b>{t.title}</b></span>
            {t.completed && <Check size={15} color="var(--success)" />}
          </button>
        ))}
        {blocks.map((b) => {
          const t = taskById[b.taskId]
          const c = courseById[t.courseId]
          return (
            <button key={b.taskId} className="block" style={{ '--series': seriesColor(c), textAlign: 'left', cursor: 'pointer' }} onClick={() => ui.openTask(t.id)}>
              <div className="row-between">
                <div className="row">
                  <CourseGlyph course={c} size={24} radius={6} />
                  <span style={{ fontWeight: 600 }}>{b.start} – {b.end}</span>
                </div>
              </div>
              <div className="block-title truncate">{t.title}</div>
              <div className="muted" style={{ fontSize: 13 }}>{c?.name} · {fmtHours(b.hours)}</div>
            </button>
          )
        })}
        {blocks.length === 0 && dueThatDay.length === 0 && (
          <EmptyState icon={CalendarCheck} title={busy ? 'Day off' : logged && isToday ? 'Done for today' : selected < today ? 'In the past' : 'Nothing planned'}>
            {busy ? 'This day is blocked — work moved to other days.' : logged && isToday ? 'Today is logged. Tomorrow’s plan is ready.' : selected < today ? '' : 'Free time with nothing due. Enjoy it, or work ahead.'}
          </EmptyState>
        )}
      </div>

      {isToday && (
        <div className="stack gap-8" style={{ marginTop: 16 }}>
          {!logged ? (
            <Button
              block
              icon={Check}
              size="lg"
              disabled={blocks.length === 0}
              onClick={() => {
                dispatch({ type: 'completeDay', day: today, blocks })
                notify(`Logged ${fmtHours(planned)} — plan updated`)
              }}
            >
              Mark today complete
            </Button>
          ) : (
            <div className="course-alert" style={{ justifyContent: 'center', padding: 14, background: 'var(--success-soft)', color: 'var(--success)' }}>
              <Check size={16} /> Today's sessions are logged
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Button
              variant="secondary"
              rect
              icon={busy ? Undo2 : CalendarX2}
              style={{ height: 48 }}
              onClick={() => {
                dispatch({ type: 'toggleBusy', day: today })
                notify(busy ? 'Today is back on' : 'Skipped — work moved to other days')
              }}
            >
              {busy ? 'Undo skip' : 'Skip today'}
            </Button>
            <Button
              variant="secondary"
              rect
              icon={Zap}
              style={{ height: 48 }}
              onClick={() => ui.openDeadline({ due: addDays(today, 2), type: 'quiz', hours: 3, weight: 5 })}
            >
              Surprise task
            </Button>
          </div>
        </div>
      )}
      {!isToday && selected > today && (
        <Button
          variant="secondary"
          rect
          block
          icon={busy ? Undo2 : CalendarX2}
          style={{ height: 48, marginTop: 16 }}
          onClick={() => dispatch({ type: 'toggleBusy', day: selected })}
        >
          {busy ? 'Free this day again' : 'Mark this day busy'}
        </Button>
      )}
    </section>
  )
}
