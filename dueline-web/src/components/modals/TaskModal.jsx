import { useState } from 'react'
import { CalendarDays, Check, Minus, Pencil, Plus, Trash2, Undo2 } from 'lucide-react'
import { useApp } from '../../store/AppStore'
import { fmtHours, fmtShort, relDay } from '../../lib/date'
import { TASK_TYPES } from '../../lib/parse'
import { Button, Chip, CourseGlyph, Field, IconButton, Input, Modal, ProgressBar, StatTile, seriesColor } from '../ui'
import { useUI } from '../layout/UIContext'

export function TaskModal({ taskId, onClose }) {
  const { taskById, courseById, plan, scores, today, dispatch, notify, state } = useApp()
  const ui = useUI()
  const task = taskById[taskId]
  const [score, setScore] = useState(task?.score ?? '')
  if (!task) return null
  const course = courseById[task.courseId]
  const info = plan.info[task.id]
  const total = task.hours * (state.reality || 1)
  const progress = task.completed ? 1 : Math.min(1, (task.done || 0) / total)
  const sessions = Object.entries(plan.days)
    .flatMap(([day, blocks]) => blocks.filter((b) => b.taskId === task.id).map((b) => ({ ...b, day })))
    .slice(0, 8)

  const status = task.completed
    ? <Chip tone="success" icon={Check}>Done</Chip>
    : info.overdue
      ? <Chip tone="danger">Overdue</Chip>
      : info.atRisk
        ? <Chip tone="danger">{info.shortfall}h short</Chip>
        : <Chip tone="accent">On track</Chip>

  return (
    <Modal open onClose={onClose} title={task.title} width={560}>
      <div className="row gap-12" style={{ marginTop: -8, marginBottom: 18, flexWrap: 'wrap' }}>
        <CourseGlyph course={course} size={28} />
        <span className="muted">{course?.name}</span>
        <Chip>{TASK_TYPES[task.type]?.label}</Chip>
        {status}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        <StatTile value={relDay(today, task.due).replace('in ', '')} label={`due ${fmtShort(task.due)}`} tone={info.daysLeft <= 1 && !task.completed ? 'danger' : undefined} />
        <StatTile value={fmtHours(info.left)} label="work left" />
        <StatTile value={task.completed ? `${task.weight}%` : scores[task.id]?.total ?? '–'} label={task.completed ? 'of the grade' : 'priority score'} />
      </div>

      <div className="row-between" style={{ marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>Progress</span>
        <span className="muted">{fmtHours(task.completed ? total : task.done || 0)} of {fmtHours(total)}</span>
      </div>
      <ProgressBar value={progress} color={seriesColor(course)} />

      {!task.completed && (
        <div className="row" style={{ marginTop: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>Log time:</span>
          <IconButton icon={Minus} size="sm" label="Remove half an hour" onClick={() => dispatch({ type: 'logHours', id: task.id, hours: -0.5 })} />
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'logHours', id: task.id, hours: 0.5 })}>+30m</Button>
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'logHours', id: task.id, hours: 1 })}>+1h</Button>
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'logHours', id: task.id, hours: 2 })}>+2h</Button>
        </div>
      )}

      {task.completed ? (
        <div style={{ marginTop: 20 }}>
          <Field label="Your score (%) — feeds the Results page">
            <div className="row">
              <Input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 82" />
              <Button
                variant="secondary"
                rect
                onClick={() => {
                  dispatch({ type: 'updateTask', id: task.id, patch: { score: score === '' ? null : Math.min(100, Math.max(0, Number(score))) } })
                  notify('Score saved')
                }}
              >
                Save
              </Button>
            </div>
          </Field>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Planned sessions</div>
          {sessions.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No free time left before it's due. Add study hours or log progress.</div>}
          <div className="stack gap-8">
            {sessions.map((s) => (
              <div key={s.day} className="row" style={{ fontSize: 13 }}>
                <CalendarDays size={15} className="faint" />
                <span style={{ width: 110 }}>{fmtShort(s.day)}</span>
                <span className="muted">{s.start} – {s.end}</span>
                <span className="grow" />
                <span>{fmtHours(s.hours)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
        <div className="row">
          <IconButton icon={Trash2} label="Delete" onClick={() => { dispatch({ type: 'removeTask', id: task.id }); notify('Deadline deleted'); onClose() }} />
          <IconButton icon={Pencil} label="Edit" onClick={() => { onClose(); ui.openDeadline(task) }} />
        </div>
        <Button
          variant={task.completed ? 'secondary' : 'primary'}
          icon={task.completed ? Undo2 : Check}
          onClick={() => {
            dispatch({ type: 'toggleComplete', id: task.id })
            notify(task.completed ? 'Marked as not done' : 'Nice — marked done')
          }}
        >
          {task.completed ? 'Reopen' : 'Mark done'}
        </Button>
      </div>
    </Modal>
  )
}
