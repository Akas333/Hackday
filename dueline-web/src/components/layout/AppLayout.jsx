import { useCallback, useMemo, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../../store/AppStore'
import { Toast } from '../ui'
import { TopNav } from './TopNav'
import { SampleBanner } from './SampleBanner'
import { UIContext } from './UIContext'
import { DeadlineModal } from '../modals/DeadlineModal'
import { TaskModal } from '../modals/TaskModal'
import { StudyHoursModal } from '../modals/StudyHoursModal'
import { CourseModal } from '../modals/CourseModal'

export function AppLayout() {
  const { state, toast } = useApp()
  const [deadline, setDeadline] = useState(null) // {initial} | null
  const [taskId, setTaskId] = useState(null)
  const [hoursOpen, setHoursOpen] = useState(false)
  const [course, setCourse] = useState(null) // {initial} | null

  const openDeadline = useCallback((initial = {}) => setDeadline({ initial }), [])
  const ui = useMemo(
    () => ({
      openDeadline,
      openTask: setTaskId,
      openHours: () => setHoursOpen(true),
      openCourse: (initial = {}) => setCourse({ initial }),
    }),
    [openDeadline],
  )

  if (!state.mode) return <Navigate to="/" replace />

  return (
    <UIContext.Provider value={ui}>
      <TopNav />
      {state.mode === 'sample' && <SampleBanner />}
      <Outlet />
      {deadline && <DeadlineModal initial={deadline.initial} onClose={() => setDeadline(null)} />}
      {taskId && <TaskModal taskId={taskId} onClose={() => setTaskId(null)} />}
      {hoursOpen && <StudyHoursModal onClose={() => setHoursOpen(false)} />}
      {course && <CourseModal initial={course.initial} onClose={() => setCourse(null)} />}
      <Toast toast={toast} />
    </UIContext.Provider>
  )
}
