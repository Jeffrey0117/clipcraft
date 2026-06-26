import { Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import { tools } from './tools/registry'

// 換頁時捲回頂部(首頁很高,不歸零會讓短的工具頁看起來像空白)
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        {tools.map((t) => (
          <Route
            key={t.id}
            path={t.path}
            element={
              <div className="tool-page">
                <div className="tool-head">
                  <h2>{t.name}</h2>
                  <p>{t.desc}</p>
                </div>
                <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)' }}>載入中…</div>}>
                  <t.Component />
                </Suspense>
              </div>
            }
          />
        ))}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
    </>
  )
}
