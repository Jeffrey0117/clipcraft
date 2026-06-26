import { NavLink } from 'react-router-dom'
import { Home } from 'lucide-react'
import { tools, groups } from '../tools/registry'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="side-brand" aria-label="回首頁">
        <span className="mark">F</span>
        <span className="name">
          FreeForCut
          <small>剪輯字卡神器</small>
        </span>
      </NavLink>

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
    </aside>
  )
}
