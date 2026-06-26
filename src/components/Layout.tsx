import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import Sidebar from './Sidebar'

export default function Layout() {
  const isHome = useLocation().pathname === '/'

  // 首頁:頂部 Nav + 滿版內容;工具頁(工作台):左側側邊欄
  if (isHome) {
    return (
      <div className="app">
        <TopNav />
        <main className="main">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="app app-workspace">
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
