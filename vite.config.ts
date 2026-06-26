import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 專案頁會放在 /clipcraft/ 底下;本機開發維持根目錄
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/clipcraft/' : '/',
  plugins: [react()],
  server: { port: 5180, strictPort: true },
}))
