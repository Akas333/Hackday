import { useState } from 'react'
import { ClipboardPaste, PencilLine } from 'lucide-react'
import { useApp } from '../../store/AppStore'
import { TASK_TYPES } from '../../lib/parse'
import { addDays } from '../../lib/date'
import { Button, Chip, Field, Input, Modal, Segmented, Select } from '../ui'
import { PasteImporter } from '../PasteImporter'

export function DeadlineModal({ initial = {}, onClose }) {
  const { state, dispatch, today, notify } = useApp()
  const editing = Boolean(initial.id)
  const [mode, setMode] = useState('manual')
  const [form, setForm] = useState(() => ({
    title: '',
    courseId: state.courses[0]?.id || '',
    type: 'assignment',
    due: addDays(today, 7),
    hours: TASK_TYPES.assignment.hours,
    weight: TASK_TYPES.assignment.weight,
    ...initial,
  }))
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const pickType = (type) => {
    const def = TASK_TYPES[type]
    // only replace estimates the user hasn't customised
    const prev = TASK_TYPES[form.type]
    set({
      type,
      hours: form.hours === prev.hours ? def.hours : form.hours,
      weight: form.weight === prev.weight ? def.weight : form.weight,
    })
  }

  const valid = form.title.trim() && form.courseId && form.due && form.hours > 0
  const save = () => {
    const task = {
      title: form.title.trim(),
      courseId: form.courseId,
      type: form.type,
      due: form.due,
      hours: Number(form.hours),
      weight: Number(form.weight) || 0,
    }
    if (editing) dispatch({ type: 'updateTask', id: initial.id, patch: task })
    else dispatch({ type: 'addTask', task })
    notify(editing ? 'Deadline updated, plan rebuilt' : 'Deadline added, plan rebuilt')
    onClose()
  }

  if (state.courses.length === 0) {
    return (
      <Modal open onClose={onClose} title="Add a course first">
        <p className="muted">Deadlines belong to a course. Add one from the Courses list on Home.</p>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      width={mode === 'paste' ? 640 : 520}
      title={editing ? 'Edit deadline' : 'New deadline'}
      subtitle={editing ? null : 'Dueline replans the moment you save.'}
      footer={
        mode === 'manual' && (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={!valid}>{editing ? 'Save changes' : 'Add deadline'}</Button>
          </>
        )
      }
    >
      {!editing && (
        <div style={{ marginBottom: 18 }}>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'manual', label: <span className="row"><PencilLine size={15} />Type it</span> },
              { value: 'paste', label: <span className="row"><ClipboardPaste size={15} />Paste a message</span> },
            ]}
          />
        </div>
      )}

      {mode === 'paste' ? (
        <PasteImporter
          courses={state.courses}
          today={today}
          onImport={(tasks) => {
            dispatch({ type: 'addTasks', tasks })
            notify(`${tasks.length} deadline${tasks.length > 1 ? 's' : ''} added`)
            onClose()
          }}
        />
      ) : (
        <div className="stack gap-16">
          <Field label="What's due?">
            <Input autoFocus value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. DA 2: Normalisation + SQL queries" />
          </Field>
          <Field label="Course">
            <Select value={form.courseId} onChange={(e) => set({ courseId: e.target.value })}>
              {state.courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code ? `${c.code} · ` : ''}{c.name}</option>
              ))}
            </Select>
          </Field>
          <div className="field">
            <span>Type</span>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {Object.entries(TASK_TYPES).map(([k, v]) => (
                <Chip key={k} selected={form.type === k} onClick={() => pickType(k)}>{v.label}</Chip>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>
            <Field label="Due date">
              <Input type="date" value={form.due} onChange={(e) => set({ due: e.target.value })} />
            </Field>
            <Field label="Hours of work">
              <Input type="number" min="0.5" step="0.5" value={form.hours} onChange={(e) => set({ hours: e.target.value })} />
            </Field>
            <Field label="% of grade">
              <Input type="number" min="0" max="100" value={form.weight} onChange={(e) => set({ weight: e.target.value })} />
            </Field>
          </div>
        </div>
      )}
    </Modal>
  )
}
