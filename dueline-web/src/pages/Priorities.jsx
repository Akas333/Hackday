import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PartyPopper, TrendingUp } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useUI } from '../components/layout/UIContext'
import { Button, Card, CourseGlyph, EmptyState, StatTile } from '../components/ui'
import { fmtHours, fmtShort, relDay } from '../lib/date'

export const SCORE_PARTS = [
  { key: 'urgency', label: 'Urgency', max: 40, color: 'var(--c1)' },
  { key: 'weight', label: 'Grade weight', max: 25, color: 'var(--c2)' },
  { key: 'effort', label: 'Effort left', max: 15, color: 'var(--c3)' },
  { key: 'unblocks', label: 'Unblocks', max: 20, color: 'var(--c4)' },
]

export default function Priorities() {
  const { state, scores, plan, courseById, today } = useApp()
  const ui = useUI()
  const navigate = useNavigate()
  const ranked = state.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => scores[b.id].total - scores[a.id].total || (a.due < b.due ? -1 : 1))
  const top = ranked[0]

  if (!top) {
    return (
      <div className="page">
        <EmptyState icon={PartyPopper} title="Nothing to prioritise" action={<Button onClick={() => ui.openDeadline()}>Add a deadline</Button>}>
          All your deadlines are done.
        </EmptyState>
      </div>
    )
  }

  const ti = plan.info[top.id]
  const share = ti.freeBefore ? Math.round((ti.left / ti.freeBefore) * 100) : 100
  const reason = ti.overdue
    ? `It's past due — finish it first to stop the knock-on effect.`
    : `Needs ${fmtHours(ti.left)} of the ${fmtHours(ti.freeBefore)} free before ${fmtShort(top.due)} (${share}% of your free time).`

  return (
    <div className="page">
      <div className="page-title">
        <h1>Priorities</h1>
        <span className="muted">what to work on next, and why</span>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="upnext">
          <div>
            <div className="eyebrow">Up next</div>
            <h2 style={{ fontSize: 26, marginTop: 6 }}>{top.title}</h2>
            <div className="muted">
              {courseById[top.courseId]?.name} · due {fmtShort(top.due)} · {relDay(today, top.due)}
            </div>
            <div className="upnext-stats">
              <StatTile align="left" value={fmtHours(ti.left)} label="of work left" />
              <StatTile align="left" value={`${Math.min(share, 999)}%`} label="of free time before it's due" tone={share > 90 ? 'danger' : undefined} />
              <StatTile align="left" value={`${top.weight || 0}%`} label="of the grade" />
              <StatTile align="left" value={scores[top.id].total} label="priority score" />
            </div>
            <div className="row muted" style={{ marginBottom: 16 }}>
              <TrendingUp size={16} />
              <span>{reason}</span>
            </div>
            <div className="row">
              <Button size="sm" onClick={() => ui.openTask(top.id)}>Open task</Button>
              <Button size="sm" variant="secondary" onClick={() => navigate('/schedule')}>See schedule</Button>
            </div>
          </div>
          <div className="hide-sm">
            <CourseGlyph course={courseById[top.courseId]} size={84} />
          </div>
        </div>
      </Card>

      <Card
        title={<span>Ranking <span className="muted" style={{ fontWeight: 400, fontSize: 14, fontFamily: 'var(--font)' }}>score out of 100</span></span>}
        action={
          <div className="legend hide-sm">
            {SCORE_PARTS.map((p) => (
              <span key={p.key}><i style={{ background: p.color }} />{p.label} /{p.max}</span>
            ))}
          </div>
        }
      >
        {ranked.map((t, idx) => (
          <RankRow key={t.id} idx={idx} task={t} score={scores[t.id]} info={plan.info[t.id]} course={courseById[t.courseId]} today={today} onOpen={() => ui.openTask(t.id)} />
        ))}
      </Card>
    </div>
  )
}

function RankRow({ idx, task, score, info, course, today, onOpen }) {
  const [hover, setHover] = useState(false)
  const when = info.overdue ? 'overdue' : relDay(today, task.due)
  return (
    <div className="rank-row" onClick={onOpen} style={idx === 0 ? { background: 'var(--surface-2)' } : undefined}>
      <span className="rank-num" style={idx > 2 ? { color: 'var(--text-2)' } : undefined}>{idx + 1}</span>
      <CourseGlyph course={course} size={40} radius={10} />
      <div style={{ minWidth: 0 }}>
        <div className="truncate" style={{ fontWeight: 600, fontSize: 15 }}>{task.title}</div>
        <div className="muted" style={{ fontSize: 13 }}>
          {course?.code || course?.name} ·{' '}
          <span className={info.daysLeft <= 1 || info.atRisk ? 'danger-text' : ''} style={{ fontWeight: info.daysLeft <= 1 ? 600 : 400 }}>{when}</span>
          {' '}· {fmtHours(info.left)} left
          {score.unblockCount > 0 && ` · unblocks ${score.unblockCount}`}
        </div>
      </div>
      <div style={{ position: 'relative' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div className="score-bar" aria-label={`Score breakdown for ${task.title}`}>
          {SCORE_PARTS.map((p) =>
            score.parts[p.key] > 0.5 ? <div key={p.key} style={{ width: `${score.parts[p.key]}%`, background: p.color }} /> : null,
          )}
        </div>
        {hover && (
          <div className="tooltip">
            {SCORE_PARTS.map((p) => (
              <div key={p.key} className="t-row">
                <span className="row gap-4"><i style={{ background: p.color }} />{p.label}</span>
                <b>{Math.round(score.parts[p.key])}/{p.max}</b>
              </div>
            ))}
          </div>
        )}
      </div>
      <span className="rank-score">{score.total}</span>
    </div>
  )
}
