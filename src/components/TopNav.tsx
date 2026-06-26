import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { tools } from '../tools/registry'
import GitHubStar from './GitHubStar'

export default function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={'topnav' + (scrolled ? ' solid' : '')}>
      <div className="topnav-inner">
        <NavLink to="/" className="topnav-brand" aria-label="FreeForCut 首頁">
          <span className="mark">F</span>
          <span className="wordmark">FreeForCut</span>
        </NavLink>

        <div className="nav-right">
          <GitHubStar />
          <button className="nav-cta" onClick={() => navigate(tools[0].path)}>
            開始做字卡 <ArrowRight size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </header>
  )
}
