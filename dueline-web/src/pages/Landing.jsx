import { useNavigate } from 'react-router-dom'
import { Bell, CalendarRange, ChevronRight, ClipboardList } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { Brand } from '../components/layout/Logo'
import { Button, CourseGlyph } from '../components/ui'

export default function Landing() {
  const navigate = useNavigate()
  const { dispatch, today } = useApp()
  const sample = () => {
    dispatch({ type: 'loadSample', today })
    navigate('/home')
  }
  return (
    <div className="landing">
      <header className="topnav">
        <Brand />
        <div className="topnav-right">
          <button className="link-btn" onClick={sample}>Skip setup</button>
        </div>
      </header>
      <main className="landing-main">
        <div className="glyph-row">
          {[0, 1, 2, 3, 4, 5].map((s) => <CourseGlyph key={s} slot={s} size={54} />)}
        </div>
        <h1>
          Every deadline,
          <br />
          already planned
        </h1>
        <p className="lede">Add your courses and what's due. Dueline spreads the work across your free hours and reshuffles the plan the moment something changes.</p>
        <div className="feature-list">
          <div className="feature">
            <ClipboardList size={20} />
            <span><b>Paste the class group message.</b> Dueline pulls out the dates and courses; you just tick what to keep.</span>
          </div>
          <div className="feature">
            <CalendarRange size={20} />
            <span><b>Plans around your real free time,</b> so a 10-hour project starts this week, not the night before.</span>
          </div>
          <div className="feature">
            <Bell size={20} />
            <span><b>Warns you early</b> when a deadline won't fit, while there's still time to move things around.</span>
          </div>
        </div>
        <Button size="lg" iconRight={ChevronRight} onClick={() => navigate('/setup')}>Plan my semester</Button>
        <p className="faint" style={{ fontSize: 13, marginTop: 12 }}>Takes about a minute. Everything stays in your browser.</p>
        <button className="link-btn" style={{ marginTop: 14 }} onClick={sample}>Or explore a sample semester first</button>
      </main>
    </div>
  )
}
