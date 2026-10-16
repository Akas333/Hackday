import { addDays, diffDays, dow, timeToMin, minToTime } from './date'

const MAX_BLOCK = 3 // hours of one task per day, so big tasks spread across days
const STEP = 0.5
const HORIZON = 150

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const roundStep = (h) => Math.floor(h / STEP + 1e-9) * STEP

export function hoursLeft(task, reality = 1) {
  if (task.completed) return 0
  return Math.max(0, Math.round((task.hours * reality - (task.done || 0)) * 10) / 10)
}

export function capacityFor(state, key, today) {
  if (state.busyDays.includes(key)) return 0
  if (key === today && state.loggedDays.includes(key)) return 0
  return state.availability.hours[dow(key)] || 0
}

export function startTimeFor(state, key) {
  const d = dow(key)
  return d === 0 || d === 6 ? state.availability.weekendStart : state.availability.weekdayStart
}

/**
 * Builds a day-by-day plan: earliest deadline first, at most MAX_BLOCK hours of one
 * task per day, never past a task's due date. Returns blocks per day plus per-task stats.
 */
export function buildPlan(state, today) {
  const reality = state.reality || 1
  const open = state.tasks.filter((t) => !t.completed)
  const remaining = {}
  open.forEach((t) => (remaining[t.id] = hoursLeft(t, reality)))

  const lastDue = open.reduce((m, t) => (t.due > m ? t.due : m), today)
  const span = clamp(diffDays(today, lastDue) + 1, 1, HORIZON)

  const days = {}
  const capacity = {}
  const finish = {}

  for (let i = 0; i < span; i++) {
    const key = addDays(today, i)
    const cap = capacityFor(state, key, today)
    capacity[key] = cap
    let free = cap
    const blocks = []
    // overdue work is pulled into today; otherwise work must happen before the due date
    const candidates = open
      .filter((t) => remaining[t.id] > 0 && (t.due > key || (i === 0 && t.due <= today)))
      .sort((a, b) => (a.due === b.due ? (b.weight || 0) - (a.weight || 0) : a.due < b.due ? -1 : 1))

    for (const t of candidates) {
      if (free < STEP) break
      const h = roundStep(Math.min(remaining[t.id], MAX_BLOCK, free))
      const take = h > 0 ? h : remaining[t.id] < STEP ? remaining[t.id] : 0
      if (take <= 0) continue
      remaining[t.id] = Math.round((remaining[t.id] - take) * 10) / 10
      free -= take
      blocks.push({ taskId: t.id, hours: take })
      finish[t.id] = key
    }

    let cursor = timeToMin(startTimeFor(state, key))
    days[key] = blocks.map((b) => {
      const start = cursor
      cursor += b.hours * 60
      return { ...b, start: minToTime(start), end: minToTime(cursor) }
    })
  }

  const info = {}
  for (const t of state.tasks) {
    const left = hoursLeft(t, reality)
    let freeBefore = 0
    const until = Math.min(diffDays(today, t.due), HORIZON)
    for (let i = 0; i < until; i++) {
      const key = addDays(today, i)
      freeBefore += capacity[key] ?? capacityFor(state, key, today)
    }
    const overdue = !t.completed && t.due < today
    const short = t.completed ? 0 : remaining[t.id] || 0
    info[t.id] = {
      left,
      freeBefore,
      finishDate: finish[t.id] || null,
      overdue,
      atRisk: !t.completed && (overdue || short > 0),
      shortfall: short,
      daysLeft: diffDays(today, t.due),
    }
  }

  return { days, capacity, info, today }
}

export function priorityScores(state, plan) {
  const open = state.tasks.filter((t) => !t.completed)
  const scores = {}
  for (const t of open) {
    const i = plan.info[t.id]
    const ratio = i.left / Math.max(i.freeBefore, 0.5)
    const urgency = i.overdue
      ? 40
      : 40 * clamp(0.6 * clamp(ratio) + 0.4 * clamp(1 - i.daysLeft / 21))
    const weight = 25 * clamp((t.weight || 0) / 30)
    const effort = 15 * clamp(i.left / 12)
    const unblockCount = open.filter((o) => (o.dependsOn || []).includes(t.id)).length
    const unblocks = Math.min(unblockCount, 2) * 10
    const parts = { urgency, weight, effort, unblocks }
    scores[t.id] = {
      parts,
      unblockCount,
      ratio,
      total: Math.round(urgency + weight + effort + unblocks),
    }
  }
  return scores
}

export function summarize(state, plan) {
  const open = state.tasks.filter((t) => !t.completed)
  const today = plan.today
  const atRisk = open.filter((t) => plan.info[t.id].atRisk)
  const totalLeft = open.reduce((s, t) => s + plan.info[t.id].left, 0)

  let weekPlanned = 0
  for (let i = 0; i < 7; i++) {
    const key = addDays(today, i)
    weekPlanned += (plan.days[key] || []).reduce((s, b) => s + b.hours, 0)
  }

  let peak = 0
  Object.values(plan.days).forEach((blocks) => {
    peak = Math.max(peak, blocks.reduce((s, b) => s + b.hours, 0))
  })

  const early = open
    .filter((t) => plan.info[t.id].finishDate && !plan.info[t.id].atRisk)
    .map((t) => diffDays(plan.info[t.id].finishDate, t.due) - 1)
  const avgEarly = early.length ? early.reduce((a, b) => a + b, 0) / early.length : 0

  const upcoming = open.filter((t) => t.due >= today).sort((a, b) => (a.due < b.due ? -1 : 1))
  const next = upcoming[0] || null

  const health = open.length ? Math.round((10 * (open.length - atRisk.length)) / open.length) : null

  return { open, atRisk, totalLeft, weekPlanned, peak, avgEarly, next, upcoming, health }
}
