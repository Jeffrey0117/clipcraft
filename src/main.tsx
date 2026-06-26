import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './theme/tokens.css'
import './theme/global.css'

// 註:刻意不使用 StrictMode —— 工具元件內部是指令式 canvas/錄影邏輯,
// StrictMode 的 effect 雙重觸發會重複綁定事件。單一路由一次只掛一個工具,安全。
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
