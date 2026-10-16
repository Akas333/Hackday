import { useState } from 'react'
import { ClipboardList, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useUI } from '../components/layout/UIContext'
import { Button, Checkbox, Chip, CourseGlyph, EmptyState, IconButton, MenuItem, Popover, ProgressBar, SearchInput, Segmented, Select, seriesColor } from '../components/ui'
import { fmtHours, fmtShort, relDay } from '../lib/date'
import { TASK_TYPES } from '../lib/parse'

export default function Tasks() {
  const { state, plan, courseById, today, dispatch, notify } = useApp()
  const ui = useUI()
  const [filter, setFilter] = useState('open')
  const [course, setCourse] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('due')

  let list = state.tasks.filter((t) => {
    if (filter === 'open' && t.completed) return false
    if (filter === 'done' && !t.completed) return false
    if (filter === 'risk' && !plan.info[t.id].atRisk) return false
    if (course !== 'all' && t.courseId !== course) return false
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })
  list = list.sort((a, b) => {
    if (sort === 'hours') return plan.info[b.id].left - plan.info[a.id].left
    if (sort === 'weight') return (b.weight || 0) - (a.weight || 0)
    return filter === 'done' ? (a.due < b.due ? 1 : -1) : a.due < b.due ? -1 : 1
  })

  const counts = {
    open: state.tasks.filter((t) => !t.completed).length,
    risk: state.tasks.filter((t) => plan.info[t.id].atRisk).length,
    done: state.tasks.filter((t) => t.completed).length,
    all: state.tasks.length,
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="row-between" style={{ marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="page-title" style={{ margin: 0 }}>
          <h1>Tasks</h1>
          <span className="muted">every deadline in one list</span>
        </div>
        <Button icon={Plus} onClick={() => ui.openDeadline()}>New deadline</Button>
      </div>

      <div className="toolbar">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: `Open ${counts.open}` },
            { value: 'risk', label: `At risk ${counts.risk}` },
            { value: 'done', label: `Done ${counts.done}` },
            { value: 'all', label: 'All' },
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search tasks…" style={{ flex: 1, minWidth: 180 }} />
        <Select value={course} onChange={(e) => setCourse(e.target.value)} style={{ width: 190 }} aria-label="Filter by course">
          <option value="all">All courses</option>
          {state.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 150 }} aria-label="Sort">
          <option value="due">By due date</option>
          <option value="hours">By work left</option>
          <option value="weight">By grade weight</option>
        </Select>
      </div>

      {list.length === 0 && (
        <EmptyState icon={ClipboardList} title={filter === 'risk' ? 'Nothing at risk' : 'No tasks here'}>
          {filter === 'risk' ? 'Every open deadline fits your free time.' : 'Try another filter, or add a deadline.'}
        </EmptyState>
      )}

      {list.map((t) => {
        const c = courseById[t.courseId]
        const i = plan.info[t.id]
        const total = t.hours * (state.reality || 1)
        return (
          <div key={t.id} className={`task-row ${t.completed ? 'done' : ''}`}>
            <Checkbox
              round
              checked={t.completed}
              label={`Mark ${t.title} done`}
              onChange={() => {
                dispatch({ type: 'toggleComplete', id: t.id })
                notify(t.completed ? 'Reopened' : 'Marked done — plan rebuilt')
              }}
            />
            <CourseGlyph course={c} size={40} radius={10} />
            <button style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', minWidth: 0 }} onClick={() => ui.openTask(t.id)}>
              <div className="task-title truncate">{t.title}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {c?.code || c?.name} · {TASK_TYPES[t.type]?.label} · {fmtShort(t.due)}
                {t.completed && t.score != null && ` · scored ${t.score}%`}
              </div>
            </button>
            <div className="hide-sm" style={{ width: 140 }}>
              {!t.completed && (
                <>
                  <div className="row-between" style={{ fontSize: 12, marginBottom: 4 }}>
                    <span className="muted">{fmtHours(i.left)} left</span>
                    <span className="faint">{fmtHours(total)}</span>
                  </div>
                  <ProgressBar value={Math.min(1, (t.done || 0) / total)} color={seriesColor(c)} />
                </>
              )}
            </div>
            <div className="hide-sm" style={{ width: 120, textAlign: 'right' }}>
              {t.completed ? (
                <Chip tone="success">Done</Chip>
              ) : i.overdue ? (
                <Chip tone="danger">Overdue</Chip>
              ) : i.atRisk ? (
                <Chip tone="danger">{i.shortfall}h short</Chip>
              ) : (
                <Chip tone={i.daysLeft <= 2 ? 'warning' : undefined}>{relDay(today, t.due)}</Chip>
              )}
            </div>
            <Popover width={180} trigger={(o, toggle) => <IconButton icon={MoreHorizontal} size="sm" label="Task options" onClick={toggle} />}>
              {(close) => (
                <>
                  <MenuItem icon={Pencil} onClick={() => { close(); ui.openDeadline(t) }}>Edit</MenuItem>
                  <MenuItem icon={Trash2} danger onClick={() => { close(); dispatch({ type: 'removeTask', id: t.id }); notify('Deadline deleted') }}>Delete</MenuItem>
                </>
              )}
            </Popover>
          </div>
        )
      })}
    </div>
  )
}
