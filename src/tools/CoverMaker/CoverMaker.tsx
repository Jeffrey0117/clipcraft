import { useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import './cover.css'

export default function CoverMaker() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current!
    const $ = (s: string) => root.querySelector(s) as any

    const inTitle = $('#inTitle'), inSub = $('#inSub')
    const title = $('#title'), subtitle = $('#subtitle')
    const cover = $('#cover') as HTMLElement

    inTitle.addEventListener('input', () => { title.textContent = inTitle.value || ' ' })
    inSub.addEventListener('input', () => { subtitle.textContent = inSub.value || ' ' })

    $('#dl').addEventListener('click', async () => {
      const btn = $('#dl'), label = btn.textContent
      btn.textContent = '產生中…'; btn.disabled = true
      try {
        if ((document as any).fonts && (document as any).fonts.ready) await (document as any).fonts.ready
        await new Promise((r) => setTimeout(r, 80))
        const scale = 1920 / cover.offsetWidth
        const canvas = await html2canvas(cover, { scale, backgroundColor: null, useCORS: true, logging: false })
        const a = document.createElement('a')
        a.download = (inTitle.value || 'cover').trim() + '.png'
        a.href = canvas.toDataURL('image/png'); a.click()
      } catch (err) { alert('產生圖片時發生問題,請再試一次。'); console.error(err) }
      finally { btn.textContent = label; btn.disabled = false }
    })
  }, [])

  return (
    <div className="tool tool-cover" ref={rootRef}>
      <div className="wrap">
        <div className="panel">
          <div className="fields">
            <div className="field">
              <label>大標題</label>
              <input id="inTitle" type="text" defaultValue="故事高手課" maxLength={14} autoComplete="off" />
            </div>
            <div className="field">
              <label>小標題</label>
              <input id="inSub" type="text" defaultValue="一學就會 → 讓我開口就圈粉的故事公式" maxLength={40} autoComplete="off" />
            </div>
          </div>
          <div className="toolbar">
            <button className="btn" id="dl">下載封面 (PNG)</button>
          </div>
          <p className="hint">輸出 1920 × 1080(16:9 影片封面)・字體 Noto Sans TC 900</p>
        </div>

        <div className="stage">
          <div className="cover" id="cover">
            <div className="group">
              <h1 className="title" id="title">故事高手課</h1>
              <p className="subtitle" id="subtitle">一學就會 → 讓我開口就圈粉的故事公式</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
