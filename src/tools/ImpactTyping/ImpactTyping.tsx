import { useEffect, useRef } from 'react'
import { createRecorder } from '../../lib/recorder'
import { loadFonts } from '../../lib/fonts'
import './impact.css'

export default function ImpactTyping() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current!
    const $ = (s: string) => root.querySelector(s) as any

    const cv = $('#cv') as HTMLCanvasElement
    const ctx = cv.getContext('2d') as any
    const W = 1920, H = 1080
    let mode = 'A'

    const impText = $('#impText'), impSize = $('#impSize'), impDur = $('#impDur')
    const typeText = $('#typeText'), typeSize = $('#typeSize'), typeWeight = $('#typeWeight'),
      typeSpeed = $('#typeSpeed'), typeSpeedLab = $('#typeSpeedLab')

    const cl = (v: number) => Math.max(0, Math.min(1, v))

    const ensureFonts = () =>
      loadFonts([
        '400 300px "Anton"',
        '400 300px "Noto Sans TC"',
        '500 300px "Noto Sans TC"',
        '700 300px "Noto Sans TC"',
        '900 300px "Noto Sans TC"',
      ])

    // ===== 衝擊卡 =====
    function drawImpact(scaleMul: number, alpha: number) {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
      ctx.fillStyle = '#C01812'; ctx.fillRect(0, 0, W, H)
      const fs = (+impSize.value / 100 * W) * scaleMul
      ctx.font = '900 ' + fs + 'px "Anton","Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
      try { ctx.letterSpacing = (fs * 0.02) + 'px' } catch (e) {}
      ctx.globalAlpha = cl(alpha); ctx.fillStyle = '#FAFAFA'
      const txt = impText.value || ''
      const m = ctx.measureText(txt)
      const top = m.actualBoundingBoxAscent || fs * 0.7, bot = m.actualBoundingBoxDescent || 0
      const yc = H / 2 + (top - bot) / 2
      ctx.fillText(txt, W / 2, yc)
      try { ctx.letterSpacing = '0px' } catch (e) {}
      ctx.globalAlpha = 1
    }

    // ===== 打字跳字 =====
    function parseBeats(text: string) {
      const lines: any[] = []; let cur: any[] = []; let beat = 0; const s = text || ''
      for (let i = 0; i < s.length;) {
        const ch = s[i]
        if (ch === '\n') { lines.push(cur); cur = []; i++; continue }
        if (ch === '[') {
          i++; const grp: string[] = []
          while (i < s.length && s[i] !== ']' && s[i] !== '\n') { grp.push(s[i]); i++ }
          if (s[i] === ']') i++
          grp.forEach((g) => cur.push({ ch: g, beat })); beat++; continue
        }
        cur.push({ ch, beat }); beat++; i++
      }
      lines.push(cur); return { lines, beatCount: beat }
    }
    function drawTyping(t: number) {
      const fs = +typeSize.value / 100 * W, lh = fs * 1.34, interval = +typeSpeed.value, wt = typeWeight.value
      const { lines } = parseBeats(typeText.value)
      const totalH = lines.length * lh
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#6F6F71'); g.addColorStop(.24, '#BFBFC0'); g.addColorStop(.55, '#F1F1F0'); g.addColorStop(1, '#F7F7F6')
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      ctx.font = wt + ' ' + fs + 'px "Noto Sans TC", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#141414'
      const lineWs = lines.map((line: any[]) => line.reduce((s: number, it: any) => s + ctx.measureText(it.ch).width, 0))
      const blockLeft = W / 2 - Math.max(0, ...lineWs) / 2
      const startY = H / 2 - totalH / 2 + lh / 2
      lines.forEach((line: any[], li: number) => {
        let x = blockLeft; const y = startY + li * lh
        line.forEach((it: any) => {
          const w = ctx.measureText(it.ch).width; const bt = it.beat * interval
          if (t === Infinity || t >= bt) ctx.fillText(it.ch, x, y); x += w
        })
      })
    }
    function typingTotal() { const { beatCount } = parseBeats(typeText.value); return beatCount * (+typeSpeed.value) + 800 }

    function paintStatic() { if (mode === 'A') drawImpact(1, 1); else drawTyping(Infinity) }

    // ===== 錄影 / 播放 =====
    let busy = false
    const ids = ['#impRec', '#typePrev', '#typeRec', '#tabA', '#tabB']
    const setBusy = (b: boolean) => { busy = b; ids.forEach((id) => { $(id).disabled = b }) }

    function runImpact(record: boolean) {
      return new Promise<void>(async (resolve) => {
        await ensureFonts()
        const total = Math.max(0.3, +impDur.value) * 1000
        let rec: MediaRecorder | null = null
        if (record) {
          rec = createRecorder(cv, () => impText.value || 'PART', () => { root.classList.remove('recording'); resolve() })
          if (!rec) return resolve()
          rec.start(); root.classList.add('recording')
        }
        const t0 = performance.now()
        function tick(now: number) {
          const e = now - t0; drawImpact(1, 1)
          if (e < total) requestAnimationFrame(tick)
          else { if (rec) rec.stop(); else resolve(); drawImpact(1, 1) }
        }
        requestAnimationFrame(tick)
      })
    }

    function runTyping(record: boolean) {
      return new Promise<void>(async (resolve) => {
        await ensureFonts()
        const total = typingTotal()
        let rec: MediaRecorder | null = null
        if (record) {
          rec = createRecorder(cv, () => '打字' + (typeText.value.split('\n')[0] || ''), () => { root.classList.remove('recording'); resolve() })
          if (!rec) return resolve()
          rec.start(); root.classList.add('recording')
        }
        const t0 = performance.now()
        function tick(now: number) {
          const e = now - t0; drawTyping(e)
          if (e < total) requestAnimationFrame(tick)
          else { if (rec) rec.stop(); else resolve(); drawTyping(Infinity) }
        }
        requestAnimationFrame(tick)
      })
    }

    // ===== 綁定 =====
    function setMode(m: string) {
      mode = m
      $('#tabA').classList.toggle('on', m === 'A')
      $('#tabB').classList.toggle('on', m === 'B')
      $('#panelA').classList.toggle('hide', m !== 'A')
      $('#panelB').classList.toggle('hide', m !== 'B')
      paintStatic()
    }
    $('#tabA').addEventListener('click', () => setMode('A'))
    $('#tabB').addEventListener('click', () => setMode('B'))

    ;[impText, impSize].forEach((el: any) => el.addEventListener('input', () => { if (mode === 'A') paintStatic() }))
    ;[typeText, typeSize, typeWeight].forEach((el: any) => el.addEventListener('input', () => { if (mode === 'B') paintStatic() }))
    typeWeight.addEventListener('change', () => { if (mode === 'B') paintStatic() })
    typeSpeed.addEventListener('input', () => { typeSpeedLab.textContent = typeSpeed.value + 'ms' })

    $('#impRec').addEventListener('click', async () => { if (busy) return; setBusy(true); await runImpact(true); setBusy(false); paintStatic() })
    $('#typePrev').addEventListener('click', async () => { if (busy) return; setBusy(true); await runTyping(false); setBusy(false); paintStatic() })
    $('#typeRec').addEventListener('click', async () => { if (busy) return; setBusy(true); await runTyping(true); setBusy(false); paintStatic() })
    $('#impPng').addEventListener('click', async () => {
      await ensureFonts(); drawImpact(1, 1)
      const a = document.createElement('a'); a.download = (impText.value || 'part') + '.png'; a.href = cv.toDataURL('image/png'); a.click()
    })

    ensureFonts().then(paintStatic)
  }, [])

  return (
    <div className="tool tool-impact" ref={rootRef}>
      <div className="wrap">
        <div className="panel">
          <div className="tabs">
            <button id="tabA" className="on">衝擊卡</button>
            <button id="tabB">打字跳字</button>
          </div>

          <div id="panelA">
            <div className="field"><label>文字</label>
              <input id="impText" type="text" defaultValue="PART 1" maxLength={16} autoComplete="off" />
            </div>
            <div className="row">
              <div className="grp"><span className="lab">字級</span><input id="impSize" type="range" min="8" max="26" step="0.5" defaultValue="14" /></div>
              <div className="grp"><span className="lab">影片秒數</span><input id="impDur" type="number" min="0.3" max="10" step="0.5" defaultValue="2" /></div>
              <span className="spacer"></span>
              <button className="btn dark" id="impPng">下載 PNG</button>
              <button className="btn" id="impRec"><span className="dot"></span>● 錄影</button>
            </div>
            <p className="hint">大紅底 + 白色超粗字(Anton/黑體),置中。打「PART 1」「重點」都行。要靜態圖按「下載 PNG」;要一段紅底影片(放進剪輯軟體用)按「錄影」,長度看「影片秒數」。</p>
          </div>

          <div id="panelB" className="hide">
            <div className="field"><label>文字(Enter 換行;要一起蹦出的字用 [ ] 框起來)</label>
              <textarea id="typeText" defaultValue={'不知道要\n拍[什麼]'}></textarea>
            </div>
            <div className="row">
              <div className="grp"><span className="lab">字級</span><input id="typeSize" type="range" min="6" max="20" step="0.5" defaultValue="11" /></div>
              <div className="grp"><span className="lab">字重</span>
                <select id="typeWeight" defaultValue="700">
                  <option value="400">細</option>
                  <option value="500">中</option>
                  <option value="700">粗</option>
                  <option value="900">特粗</option>
                </select>
              </div>
              <div className="grp"><span className="lab">打字速度</span><input id="typeSpeed" type="range" min="60" max="400" step="10" defaultValue="160" /><span className="lab" id="typeSpeedLab">160ms</span></div>
              <span className="spacer"></span>
              <button className="btn" id="typePrev">▶ 預覽</button>
              <button className="btn" id="typeRec"><span className="dot"></span>● 錄影</button>
            </div>
            <p className="hint">灰→白漸層底、黑粗字,每個字蹦一下依序出現。<b>例:</b><code>不知道要⏎拍[什麼]</code> → 前面一個一個蹦,最後「什麼」兩字一起蹦。</p>
          </div>
        </div>
        <div className="stage"><canvas id="cv" width="1920" height="1080"></canvas></div>
      </div>
    </div>
  )
}
