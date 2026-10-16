import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { Button, CourseGlyph, Field, Input, Modal } from '../ui'

export function CourseModal({ initial = {}, onClose }) {
  const { dispatch, notify, state } = useApp()
  const editing = Boolean(initial.id)
  const [code, setCode] = useState(initial.code || '')
  const [name, setName] = useState(initial.name || '')
  const [slot, setSlot] = useState(initial.slot ?? null)
  const valid = name.trim() || code.trim()

  const save = () => {
    const course = { code: code.trim().toUpperCase(), name: name.trim() || code.trim().toUpperCase() }
    if (slot != null) course.slot = slot
    if (editing) dispatch({ type: 'updateCourse', id: initial.id, patch: course })
    else dispatch({ type: 'addCourse', course })
    notify(editing ? 'Course updated' : 'Course added')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit course' : 'Add a course'}
      footer={
        <>
          {editing && (
            <Button
              variant="danger"
              style={{ marginRight: 'auto' }}
              onClick={() => {
                const n = state.tasks.filter((t) => t.courseId === initial.id).length
                if (!n || confirm(`Delete this course and its ${n} deadline(s)?`)) {
                  dispatch({ type: 'removeCourse', id: initial.id })
                  onClose()
                }
              }}
            >
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!valid}>{editing ? 'Save' : 'Add course'}</Button>
        </>
      }
    >
      <div className="stack gap-16">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <Field label="Code">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BCSE302L" />
          </Field>
          <Field label="Name">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Database Systems" />
          </Field>
        </div>
        {editing && (
          <div className="field">
            <span>Icon</span>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {Array.from({ length: 8 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlot(i)}
                  style={{ padding: 3, borderRadius: 14, border: `2px solid ${slot === i ? 'var(--accent)' : 'transparent'}`, background: 'none', cursor: 'pointer' }}
                  aria-label={`Icon ${i + 1}`}
                >
                  <CourseGlyph slot={i} size={40} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
