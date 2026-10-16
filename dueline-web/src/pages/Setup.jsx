import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, ClipboardList, Plus, Trash2, X } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { Brand } from '../components/layout/Logo'
import { Button, CourseGlyph, Field, IconButton, Input, Select, StatTile, ScoreRing, Textarea, SkeletonRows } from '../components/ui'
import { HoursEditor } from '../components/HoursEditor'
import { PasteImporter } from '../components/PasteImporter'
import { DEFAULT_AVAILABILITY } from '../data/sample'
import { parseCourseLine, TASK_TYPES } from '../lib/parse'
import { addDays, fmtShort, relDay } from '../lib/date'
import { buildPlan, summarize } from '../lib/planner'

const STEPS = ['Courses', 'Deadlines', 'Study time']

export default function Setup() {
  const navigate = useNavigate()
  const { dispatch, today, state } = useApp()
  const [step, setStep] = useState(0)
  // start from existing user data when re-running setup
  const seed = state.mode === 'user' ? state : null
  const [courses, setCourses] = useState(seed?.courses || [])
  const [tasks, setTasks] = useState(seed?.tasks || [])
  const [hours, setHours] = useState(seed?.availability.hours || [...DEFAULT_AVAILABILITY.hours])
  const [courseText, setCourseText] = useState('')
  const [bulk, setBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const addCourses = (lines) => {
    const parsed = lines.map(parseCourseLine).filter(Boolean)
    setCourses((cs) => {
      const next = [...cs]
      parsed.forEach((p) => {
        if (next.some((c) => (p.code && c.code === p.code) || c.name.toLowerCase() === p.name.toLowerCase())) return
        next.push({ id: `c${Date.now().toString(36)}${next.length}`, slot: next.length % 8, ...p })
      })
      return next
    })
  }

  const draft = useMemo(
    () => ({
      courses,
      tasks,
      availability: { ...DEFAULT_AVAILABILITY, hours },
      busyDays: [],
      loggedDays: [],
      reality: 1,
    }),
    [courses, tasks, hours],
  )
  const preview = useMemo(() => {
    const plan = buildPlan(draft, today)
    return { plan, summary: summarize(draft, plan) }
  }, [draft, today])

  const finish = () => {
    dispatch({ type: 'finishSetup', data: draft })
    navigate('/home')
  }
  const next = () => (step < 2 ? setStep(step + 1) : finish())
  const back = () => (step > 0 ? setStep(step - 1) : navigate(-1))
  const skipAll = () => {
    if (state.mode) navigate('/home')
    else {
      dispatch({ type: 'loadSample', today })
      navigate('/home')
    }
  }

  const stepFilled = [courses.length > 0, tasks.length > 0, true][step]

  return (
    <div>
      <header className="topnav">
        <Brand />
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className="row gap-8">
              {i > 0 && <span className="line" />}
              <button
                className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}
                style={{ background: 'none', border: 0, cursor: 'pointer' }}
                onClick={() => setStep(i)}
              >
                <i>{i < step ? <Check size={14} /> : i + 1}</i>
                <span>{s}</span>
              </button>
            </div>
          ))}
        </div>
        <button className="link-btn hide-sm" onClick={skipAll}>Skip setup</button>
      </header>

      <div className="setup">
        <div className="setup-main">
          <div className="setup-body">
            <div className="eyebrow">Step {step + 1} of 3</div>

            {step === 0 && (
              <>
                <h1>What are you taking this semester?</h1>
                <p className="muted" style={{ fontSize: 16, marginBottom: 24 }}>Add each course. Include the code (like BCSE302L) and Dueline can match pasted messages to the right course.</p>
                {!bulk ? (
                  <form
                    className="row"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (courseText.trim()) addCourses([courseText])
                      setCourseText('')
                    }}
                  >
                    <Input autoFocus value={courseText} onChange={(e) => setCourseText(e.target.value)} placeholder="e.g. BCSE302L Database Systems" />
                    <Button type="submit" variant="secondary" rect icon={Plus} style={{ height: 44 }}>Add</Button>
                  </form>
                ) : (
                  <div className="stack gap-8">
                    <Textarea autoFocus value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={'BCSE302L Database Systems\nBCSE303L Operating Systems\nBMAT205L Discrete Mathematics'} />
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <Button variant="ghost" onClick={() => setBulk(false)}>Cancel</Button>
                      <Button onClick={() => { addCourses(bulkText.split('\n')); setBulkText(''); setBulk(false) }}>Add all</Button>
                    </div>
                  </div>
                )}
                {!bulk && (
                  <button className="link-btn row" style={{ marginTop: 10, padding: 0 }} onClick={() => setBulk(true)}>
                    <ClipboardList size={15} /> Got a list? Paste all your courses at once, one per line.
                  </button>
                )}
                <div style={{ marginTop: 24 }}>
                  {courses.map((c) => (
                    <div key={c.id} className="list-item">
                      <CourseGlyph course={c} size={36} />
                      <div className="grow">
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        {c.code && <div className="muted" style={{ fontSize: 12 }}>{c.code}</div>}
                      </div>
                      <IconButton icon={X} size="sm" label={`Remove ${c.name}`} onClick={() => {
                        setCourses((cs) => cs.filter((x) => x.id !== c.id))
                        setTasks((ts) => ts.filter((t) => t.courseId !== c.id))
                      }} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <DeadlinesStep courses={courses} tasks={tasks} setTasks={setTasks} today={today} goBack={() => setStep(0)} />
            )}

            {step === 2 && (
              <>
                <h1>When can you study?</h1>
                <p className="muted" style={{ fontSize: 16, marginBottom: 24 }}>Rough hours per day are fine. You can block busy days and fine-tune times later.</p>
                <div className="card">
                  <HoursEditor hours={hours} onChange={setHours} />
                </div>
              </>
            )}
          </div>
          <div className="setup-footer">
            <div>
              <Button variant="ghost" icon={ChevronLeft} onClick={back}>Back</Button>
              <Button iconRight={step === 2 ? Check : ChevronRight} onClick={next} variant={stepFilled || step === 2 ? 'primary' : 'secondary'}>
                {step === 2 ? 'Build my plan' : stepFilled ? 'Continue' : 'Skip this step'}
              </Button>
            </div>
          </div>
        </div>

        <aside className="setup-preview">
          <div className="row-between">
            <span className="eyebrow" style={{ color: 'var(--text-2)' }}>Your dashboard</span>
            <span className="live-dot">Live preview</span>
          </div>
          <div className="card row gap-16">
            <ScoreRing value={preview.summary.health} size={96} />
            <div>
              <div className="card-title">Your semester</div>
              <div className="muted">
                {preview.summary.open.length === 0
                  ? 'Fills in as you add deadlines'
                  : preview.summary.atRisk.length
                    ? `${preview.summary.atRisk.length} deadline(s) won't fit yet`
                    : 'Every deadline fits your free time'}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <StatTile align="left" value={courses.length} label="courses" />
            <StatTile align="left" value={preview.summary.open.length} label="deadlines" />
            <StatTile align="left" value={`${Math.round(preview.summary.totalLeft)}h`} label="of work" />
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>Courses</div>
            {courses.length === 0 ? <SkeletonRows /> : courses.slice(0, 5).map((c) => (
              <div key={c.id} className="row gap-12" style={{ padding: '6px 0' }}>
                <CourseGlyph course={c} size={34} />
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>Coming up</div>
            {preview.summary.upcoming.length === 0 ? <SkeletonRows /> : preview.summary.upcoming.slice(0, 4).map((t) => (
              <div key={t.id} className="row gap-12" style={{ padding: '6px 0' }}>
                <CourseGlyph course={courses.find((c) => c.id === t.courseId)} size={34} />
                <span className="grow truncate">{t.title}</span>
                <span className={preview.plan.info[t.id].atRisk ? 'danger-text' : 'muted'} style={{ fontSize: 12 }}>{relDay(today, t.due)}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function DeadlinesStep({ courses, tasks, setTasks, today, goBack }) {
  const [form, setForm] = useState({ title: '', courseId: courses[0]?.id || '', due: addDays(today, 7), type: 'assignment' })
  if (courses.length === 0) {
    return (
      <>
        <h1>What's due?</h1>
        <p className="muted" style={{ fontSize: 16 }}>Deadlines are grouped by course, so add a course first.</p>
        <Button variant="secondary" icon={ChevronLeft} onClick={goBack} style={{ marginTop: 16 }}>Add courses</Button>
      </>
    )
  }
  const mk = (t) => ({ id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, done: 0, completed: false, score: null, dependsOn: [], ...t })
  return (
    <>
      <h1>What's due?</h1>
      <p className="muted" style={{ fontSize: 16, marginBottom: 20 }}>Paste the class group message or portal notice. Dueline finds the dates; you tick what's right.</p>
      <PasteImporter courses={courses} today={today} compact onImport={(list) => setTasks((ts) => [...ts, ...list.map(mk)])} />

      <div className="row gap-12" style={{ margin: '28px 0 14px' }}>
        <span className="faint" style={{ fontSize: 12, fontWeight: 600 }}>OR ADD ONE BY HAND</span>
        <span className="grow" style={{ height: 1, background: 'var(--border)' }} />
      </div>
      <form
        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.title.trim()) return
          const def = TASK_TYPES[form.type]
          setTasks((ts) => [...ts, mk({ ...form, title: form.title.trim(), hours: def.hours, weight: def.weight })])
          setForm((f) => ({ ...f, title: '' }))
        }}
      >
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Quiz 3" /></Field>
        <Field label="Course">
          <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code || c.name}</option>)}
          </Select>
        </Field>
        <Field label="Due"><Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
        <Button type="submit" variant="secondary" rect icon={Plus} style={{ height: 44 }} aria-label="Add deadline" />
      </form>

      {tasks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{tasks.length} deadline{tasks.length > 1 ? 's' : ''} added</div>
          {[...tasks].sort((a, b) => (a.due < b.due ? -1 : 1)).map((t) => (
            <div key={t.id} className="list-item">
              <CourseGlyph course={courses.find((c) => c.id === t.courseId)} size={32} />
              <div className="grow">
                <div className="truncate" style={{ fontWeight: 600 }}>{t.title}</div>
                <div className="muted" style={{ fontSize: 12 }}>{fmtShort(t.due)} · {TASK_TYPES[t.type]?.label} · ~{t.hours}h</div>
              </div>
              <IconButton icon={Trash2} size="sm" label="Remove" onClick={() => setTasks((ts) => ts.filter((x) => x.id !== t.id))} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
