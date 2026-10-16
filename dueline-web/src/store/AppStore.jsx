import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { todayKey } from '../lib/date'
import { buildPlan, priorityScores, summarize } from '../lib/planner'
import { DEFAULT_AVAILABILITY, sampleState } from '../data/sample'

const STORAGE_KEY = 'dueline:v1'
const THEME_KEY = 'dueline:theme'

const emptyState = () => ({
  mode: null,
  courses: [],
  tasks: [],
  availability: { ...DEFAULT_AVAILABILITY, hours: [...DEFAULT_AVAILABILITY.hours] },
  busyDays: [],
  loggedDays: [],
  reality: 1,
})

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

function reducer(state, action) {
  switch (action.type) {
    case 'loadSample':
      return sampleState(action.today)
    case 'reset':
      return emptyState()
    case 'finishSetup':
      return { ...state, ...action.data, mode: 'user', busyDays: [], loggedDays: [] }
    case 'addCourse': {
      const used = new Set(state.courses.map((c) => c.slot))
      const slot = [0, 1, 2, 3, 4, 5, 6, 7].find((s) => !used.has(s)) ?? state.courses.length % 8
      return { ...state, courses: [...state.courses, { id: uid('c'), slot, ...action.course }] }
    }
    case 'updateCourse':
      return { ...state, courses: state.courses.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) }
    case 'removeCourse':
      return {
        ...state,
        courses: state.courses.filter((c) => c.id !== action.id),
        tasks: state.tasks.filter((t) => t.courseId !== action.id),
      }
    case 'addTask':
      return {
        ...state,
        tasks: [...state.tasks, { id: uid('t'), done: 0, completed: false, score: null, dependsOn: [], ...action.task }],
      }
    case 'addTasks':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          ...action.tasks.map((t) => ({ id: uid('t'), done: 0, completed: false, score: null, dependsOn: [], ...t })),
        ],
      }
    case 'updateTask':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) }
    case 'removeTask':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'toggleComplete':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, completed: !t.completed, done: !t.completed ? t.hours : t.done } : t,
        ),
      }
    case 'logHours':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: Math.max(0, Math.round(((t.done || 0) + action.hours) * 10) / 10) } : t,
        ),
      }
    case 'completeDay': {
      // credit every block planned for the day to its task
      const credit = {}
      action.blocks.forEach((b) => (credit[b.taskId] = (credit[b.taskId] || 0) + b.hours))
      return {
        ...state,
        loggedDays: [...new Set([...state.loggedDays, action.day])],
        tasks: state.tasks.map((t) => (credit[t.id] ? { ...t, done: (t.done || 0) + credit[t.id] } : t)),
      }
    }
    case 'toggleBusy': {
      const has = state.busyDays.includes(action.day)
      return { ...state, busyDays: has ? state.busyDays.filter((d) => d !== action.day) : [...state.busyDays, action.day] }
    }
    case 'setAvailability':
      return { ...state, availability: { ...state.availability, ...action.patch } }
    case 'setReality':
      return { ...state, reality: action.value }
    default:
      return state
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...emptyState(), ...JSON.parse(raw) }
  } catch {
    /* storage unavailable */
  }
  return emptyState()
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [today, setToday] = useState(todayKey)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  // roll the date over if the tab stays open past midnight
  useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast])

  const plan = useMemo(() => buildPlan(state, today), [state, today])
  const scores = useMemo(() => priorityScores(state, plan), [state, plan])
  const summary = useMemo(() => summarize(state, plan), [state, plan])
  const courseById = useMemo(() => Object.fromEntries(state.courses.map((c) => [c.id, c])), [state.courses])
  const taskById = useMemo(() => Object.fromEntries(state.tasks.map((t) => [t.id, t])), [state.tasks])

  const notify = useCallback((msg) => setToast({ msg, id: Date.now() }), [])

  const value = {
    state,
    dispatch,
    today,
    plan,
    scores,
    summary,
    courseById,
    taskById,
    theme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    toast,
    notify,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  return useContext(AppContext)
}
