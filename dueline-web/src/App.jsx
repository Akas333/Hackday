import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { useApp } from './store/AppStore'
import Landing from './pages/Landing'
import Setup from './pages/Setup'
import Home from './pages/Home'
import Schedule from './pages/Schedule'
import Priorities from './pages/Priorities'
import Tasks from './pages/Tasks'
import Workload from './pages/Workload'
import Results from './pages/Results'

export default function App() {
  const { state } = useApp()
  return (
    <Routes>
      <Route path="/" element={state.mode ? <Navigate to="/home" replace /> : <Landing />} />
      <Route path="/setup" element={<Setup />} />
      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/priorities" element={<Priorities />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/workload" element={<Workload />} />
        <Route path="/results" element={<Results />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
