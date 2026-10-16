import { useApp } from '../../store/AppStore'
import { DOW_LABEL, addDays, fmtDayMonth, dow, rangeKeys } from '../../lib/date'
import { Button, Chip, Field, Input, Modal } from '../ui'
import { HoursEditor } from '../HoursEditor'

export function StudyHoursModal({ onClose }) {
  const { state, dispatch, today } = useApp()
  const { availability } = state
  const days = rangeKeys(today, 14)
  return (
    <Modal open onClose={onClose} title="Study hours & busy days" subtitle="Dueline only plans inside these hours." width={600} footer={<Button onClick={onClose}>Done</Button>}>
      <HoursEditor hours={availability.hours} onChange={(hours) => dispatch({ type: 'setAvailability', patch: { hours } })} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <Field label="Weekdays start at">
          <Input type="time" value={availability.weekdayStart} onChange={(e) => dispatch({ type: 'setAvailability', patch: { weekdayStart: e.target.value } })} />
        </Field>
        <Field label="Weekends start at">
          <Input type="time" value={availability.weekendStart} onChange={(e) => dispatch({ type: 'setAvailability', patch: { weekendStart: e.target.value } })} />
        </Field>
      </div>

      <div className="field" style={{ marginTop: 20 }}>
        <span>Busy days (fest, trip, exams elsewhere) — tap to block</span>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {days.map((d) => (
            <Chip key={d} tone={state.busyDays.includes(d) ? 'danger' : undefined} onClick={() => dispatch({ type: 'toggleBusy', day: d })}>
              {DOW_LABEL[dow(d)]} {fmtDayMonth(d)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="field" style={{ marginTop: 20 }}>
        <span>Reality check — tasks usually take me…</span>
        <div className="row">
          {[1, 1.25, 1.5, 2].map((r) => (
            <Chip key={r} selected={state.reality === r} onClick={() => dispatch({ type: 'setReality', value: r })}>
              ×{r} {r === 1 ? 'as estimated' : 'longer'}
            </Chip>
          ))}
        </div>
      </div>
      <p className="faint" style={{ fontSize: 12, marginTop: 14 }}>Busy days shown for the next two weeks, through {fmtDayMonth(addDays(today, 13))}.</p>
    </Modal>
  )
}
