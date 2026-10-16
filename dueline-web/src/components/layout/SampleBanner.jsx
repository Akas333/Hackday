import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'

export function SampleBanner() {
  const navigate = useNavigate()
  return (
    <div className="banner">
      <span>
        <b>This is a sample semester.</b> <span className="muted">Set up yours and every page fills with your own deadlines.</span>
      </span>
      <Button size="sm" onClick={() => navigate('/setup')}>Set up mine</Button>
    </div>
  )
}
