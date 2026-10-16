import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CalendarClock, LogOut, Moon, Plus, RotateCcw, Settings2, Sun, User } from 'lucide-react'
import { useApp } from '../../store/AppStore'
import { fmtShort, relDay } from '../../lib/date'
import { Button, IconButton, MenuItem, Popover, CourseGlyph } from '../ui'
import { Brand } from './Logo'
import { useUI } from './UIContext'

const LINKS = [
  ['/home', 'Home'],
  ['/schedule', 'Schedule'],
  ['/priorities', 'Priorities'],
  ['/tasks', 'Tasks'],
  ['/workload', 'Workload'],
  ['/results', 'Results'],
]

export function TopNav() {
  const { today, theme, toggleTheme, summary, plan, courseById, dispatch, state } = useApp()
  const ui = useUI()
  const navigate = useNavigate()

  const soon = summary.upcoming.filter((t) => plan.info[t.id].daysLeft <= 3 && !plan.info[t.id].atRisk)
  const alerts = [...summary.atRisk, ...soon]

  return (
    <header className="topnav">
      <Link to="/home"><Brand /></Link>
      <nav className="nav-links">
        {LINKS.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="topnav-right">
        <span className="today-label">Today: {fmtShort(today)}</span>
        <Button size="sm" icon={Plus} onClick={() => ui.openDeadline()} className="hide-sm">New deadline</Button>
        <IconButton icon={theme === 'dark' ? Sun : Moon} label="Toggle theme" onClick={toggleTheme} />
        <Popover
          width={360}
          trigger={(open, toggle) => <IconButton icon={Bell} label="Heads-ups" dot={summary.atRisk.length > 0} onClick={toggle} />}
        >
          {(close) => (
            <div>
              <div style={{ padding: '8px 10px 10px', fontWeight: 700 }}>Heads-ups</div>
              {alerts.length === 0 && <div className="muted" style={{ padding: '4px 10px 12px' }}>Nothing slipping. Nice.</div>}
              {alerts.map((t) => {
                const i = plan.info[t.id]
                return (
                  <button
                    key={t.id}
                    className="menu-item"
                    onClick={() => {
                      close()
                      ui.openTask(t.id)
                    }}
                  >
                    <CourseGlyph course={courseById[t.courseId]} size={30} />
                    <div className="grow">
                      <div className="truncate" style={{ fontWeight: 600 }}>{t.title}</div>
                      <div style={{ fontSize: 12 }} className={i.atRisk ? 'danger-text' : 'muted'}>
                        {i.overdue
                          ? 'Overdue'
                          : i.atRisk
                            ? `${i.shortfall}h short before ${relDay(today, t.due)}`
                            : `Due ${relDay(today, t.due)} · ${i.left}h left`}
                      </div>
                    </div>
                    {i.atRisk ? <AlertTriangle size={16} color="var(--danger)" /> : <CalendarClock size={16} />}
                  </button>
                )
              })}
            </div>
          )}
        </Popover>
        <Popover width={240} trigger={(open, toggle) => <IconButton icon={User} label="Account" onClick={toggle} />}>
          {(close) => (
            <div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontWeight: 700 }}>{state.mode === 'sample' ? 'Sample semester' : 'My semester'}</div>
                <div className="muted" style={{ fontSize: 12 }}>Saved in this browser</div>
              </div>
              <MenuItem icon={Settings2} onClick={() => { close(); ui.openHours() }}>Study hours & busy days</MenuItem>
              {state.mode === 'sample' ? (
                <MenuItem icon={RotateCcw} onClick={() => { close(); dispatch({ type: 'loadSample', today }) }}>Reset sample</MenuItem>
              ) : (
                <MenuItem icon={RotateCcw} onClick={() => { close(); navigate('/setup') }}>Run setup again</MenuItem>
              )}
              <MenuItem
                icon={LogOut}
                danger
                onClick={() => {
                  close()
                  if (confirm('Clear everything saved in this browser and start over?')) {
                    dispatch({ type: 'reset' })
                    navigate('/')
                  }
                }}
              >
                Start over
              </MenuItem>
            </div>
          )}
        </Popover>
      </div>
    </header>
  )
}
