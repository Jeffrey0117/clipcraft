import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Menu, X } from 'lucide-react'
import { tools, groups } from '../tools/registry'
import GitHubStar from './GitHubStar'

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()

  // 換頁時關閉手機選單
  useEffect(() => { setOpen(false) }, [loc.pathname])

  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <div className="side-top">
        <NavLink to="/" className="side-brand" aria-label="回首頁">
          <span className="mark">F</span>
          <span className="name">
            FreeForCut
            <small>剪輯字卡神器</small>
          </span>
        </NavLink>
        <button className="side-burger" onClick={() => setOpen((o) => !o)} aria-label="選單" aria-expanded={open}>
          {open ? <X size={20} strokeWidth={2.2} /> : <Menu size={20} strokeWidth={2.2} />}
        </button>
      </div>

      <nav className="side-nav">
        <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="ico"><Home size={18} strokeWidth={2} /></span>
          <span>首頁</span>
        </NavLink>

        {groups.map((g) => (
          <div key={g} className="nav-block">
            <div className="nav-group">{g}</div>
            {tools
              .filter((t) => t.group === g)
              .map((t) => (
                <NavLink
                  key={t.id}
                  to={t.path}
                  className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
                >
                  <span className="ico"><t.Icon size={18} strokeWidth={2} /></span>
                  <span>{t.name}</span>
                </NavLink>
              ))}
          </div>
        ))}

        <GitHubStar className="gh-star side-ghstar" />
      </nav>
    </aside>
  )
}
