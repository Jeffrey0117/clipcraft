import { useEffect, useRef } from 'react'
import { createRecorder } from '../../lib/recorder'
import { loadFonts } from '../../lib/fonts'
import { GRAIN_SRC } from './grain'
import './keypoint.css'

export default function KeypointCard() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current!
    const $ = (s: string) => root.querySelector(s) as any

    const cv = $('#cv') as HTMLCanvasElement
    const ctx = cv.getContext('2d') as any
    const W = 1920, H = 1080, RED = '#82302B'
    const inText = $('#inText')
    const sizeEl = $('#size'), boldEl = $('#bold'), fontEl = $('#font')
    const durEl = $('#dur'), shuffleEl = $('#shuffle'), speedEl = $('#speed')
    const loopfxEl = $('#loopfx'), ampEl = $('#amp'), loopsecEl = $('#loopsec'), cyclesEl = $('#cycles')

    const FONTS = [
      { fam: '"Noto Serif TC", serif', wt: 900 },
      { fam: '"Noto Sans TC", sans-serif', wt: 900 },
      { fam: '"LXGW WenKai TC", serif', wt: 700 },
    ]

    const grain = new Image()
    let grainPat: any = null
    grain.onload = () => { grainPat = ctx.createPattern(grain, 'repeat'); redraw() }
    grain.src = GRAIN_SRC

    let cur: any = { nx: 0.5, ny: 0.5, fs: 15, bold: 40, fontIdx: 0 }
    let START: any = { nx: 0.40, ny: 0.54, fs: 20, bold: 12, fontIdx: 0 }
    let END: any = { nx: 0.50, ny: 0.50, fs: 11, bold: 60, fontIdx: 0 }

    const boldStroke = (fs: number, bold: number) => (bold / 100) * fs * 0.05
    const cl = (v: number) => Math.max(0, Math.min(1, v))

    function paint(s: any, mod?: any) {
      mod = mod || {}
      const g = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.78)
      g.addColorStop(0, '#F2F2F6'); g.addColorStop(.56, '#E8E8EE'); g.addColorStop(1, '#DADAE1')
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      if (grainPat) {
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .9
        try { grainPat.setTransform(new DOMMatrix().scale(2)) } catch (e) {}
        ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W, H); ctx.restore()
      }
      const fs = (s.fs / 100 * W) * (mod.scaleMul || 1)
      const fam = s.fam || FONTS[cur.fontIdx].fam, wt = s.wt || FONTS[cur.fontIdx].wt
      const x = s.nx * W + (mod.dx || 0) / 100 * W, y = s.ny * H + (mod.dy || 0) / 100 * W
      const t = inText.value || ''
      ctx.font = wt + ' ' + fs + 'px ' + fam; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.globalAlpha = (mod.alpha != null ? mod.alpha : 1); ctx.fillStyle = RED; ctx.strokeStyle = RED
      const lw = boldStroke(fs, s.bold)
      ctx.save(); ctx.translate(x, y); if (mod.rot) ctx.rotate(mod.rot * Math.PI / 180)
      if (lw > 0) { ctx.lineWidth = lw; ctx.strokeText(t, 0, 0) } ctx.fillText(t, 0, 0); ctx.restore()
      ctx.globalAlpha = 1
    }
    function redraw() { paint({ ...cur, fam: FONTS[cur.fontIdx].fam, wt: FONTS[cur.fontIdx].wt }) }

    inText.addEventListener('input', redraw)
    sizeEl.addEventListener('input', () => { cur.fs = +sizeEl.value; redraw() })
    boldEl.addEventListener('input', () => { cur.bold = +boldEl.value; redraw() })
    fontEl.addEventListener('change', () => { cur.fontIdx = +fontEl.value; redraw() })
    $('#center').addEventListener('click', () => { cur.nx = .5; cur.ny = .5; redraw() })

    let drag = false, px = 0, py = 0, snx = 0, sny = 0
    cv.addEventListener('pointerdown', (e: any) => { drag = true; cv.classList.add('dragging'); cv.setPointerCapture(e.pointerId); px = e.clientX; py = e.clientY; snx = cur.nx; sny = cur.ny })
    cv.addEventListener('pointermove', (e: any) => { if (!drag) return; const r = cv.getBoundingClientRect(); cur.nx = snx + (e.clientX - px) / r.width; cur.ny = sny + (e.clientY - py) / r.height; redraw() })
    const endDrag = () => { drag = false; cv.classList.remove('dragging') }
    cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag)

    function syncUI() { sizeEl.value = cur.fs; boldEl.value = cur.bold; fontEl.value = cur.fontIdx }
    const flash = (el: any) => { el.classList.add('set'); setTimeout(() => el.classList.remove('set'), 900) }
    $('#setStart').addEventListener('click', (e: any) => { START = { ...cur }; flash(e.target) })
    $('#setEnd').addEventListener('click', (e: any) => { END = { ...cur }; flash(e.target) })
    $('#goStart').addEventListener('click', () => { cur = { ...START }; syncUI(); redraw() })
    $('#goEnd').addEventListener('click', () => { cur = { ...END }; syncUI(); redraw() })

    const easeInOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, lerp = (a: number, b: number, p: number) => a + (b - a) * p
    function frameState(p: number) { return { nx: lerp(START.nx, END.nx, p), ny: lerp(START.ny, END.ny, p), fs: lerp(START.fs, END.fs, p), bold: lerp(START.bold, END.bold, p) } as any }

    function loopMod(fx: string, amp: number, phase: number) {
      const s = Math.sin(phase), a = amp / 100
      if (fx === 'bob') return { dy: -a * 8 * s }
      if (fx === 'sway') return { dx: a * 8 * s }
      if (fx === 'pulse') return { scaleMul: 1 + a * 0.25 * s }
      if (fx === 'breathe') return { alpha: 1 - a * 0.6 * (0.5 - 0.5 * Math.cos(phase)) }
      if (fx === 'rock') return { rot: a * 8 * s }
      return {}
    }

    let busy = false
    const ctrlIds = ['#preview', '#record', '#loopprev', '#looprec', '#setStart', '#setEnd', '#goStart', '#goEnd']
    const setBusy = (b: boolean) => { busy = b; ctrlIds.forEach((id) => { $(id).disabled = b }) }
    const ensureFonts = () => loadFonts(FONTS.map((f) => f.wt + ' 300px ' + f.fam))

    function recorder(onstop: () => void) {
      return createRecorder(cv, () => inText.value || 'card', () => { root.classList.remove('recording'); onstop && onstop() })
    }

    function runTween(record: boolean) {
      return new Promise<void>(async (resolve) => {
        await ensureFonts()
        const dur = Math.max(0.3, +durEl.value) * 1000, head = 200, tail = 450, total = head + dur + tail
        const useShuffle = shuffleEl.checked, interval = +speedEl.value, finalFont = FONTS[cur.fontIdx]
        let rec: MediaRecorder | null = null
        if (record) { rec = recorder(resolve); if (!rec) return resolve(); rec.start(); root.classList.add('recording') }
        const t0 = performance.now()
        function tick(now: number) {
          const e = now - t0; let p; if (e < head) p = 0; else if (e > head + dur) p = 1; else p = easeInOut((e - head) / dur)
          const st = frameState(p)
          if (useShuffle && e > head && e < head + dur * 0.85) { const idx = Math.floor((e - head) / interval) % FONTS.length; st.fam = FONTS[idx].fam; st.wt = FONTS[idx].wt }
          else { st.fam = finalFont.fam; st.wt = finalFont.wt }
          paint(st)
          if (e < total) requestAnimationFrame(tick); else { cur = { ...END }; syncUI(); if (rec) rec.stop(); else resolve() }
        }
        requestAnimationFrame(tick)
      })
    }

    function runLoop(record: boolean) {
      return new Promise<void>(async (resolve) => {
        await ensureFonts()
        const total = Math.max(0.5, +loopsecEl.value) * 1000, cycles = Math.max(1, Math.round(+cyclesEl.value))
        const fx = loopfxEl.value, amp = +ampEl.value
        const base = { ...cur, fam: FONTS[cur.fontIdx].fam, wt: FONTS[cur.fontIdx].wt }
        let rec: MediaRecorder | null = null
        if (record) { rec = recorder(resolve); if (!rec) return resolve(); rec.start(); root.classList.add('recording') }
        const t0 = performance.now()
        function tick(now: number) {
          const e = now - t0; const phase = 2 * Math.PI * cycles * (e / total)
          paint(base, loopMod(fx, amp, phase))
          if (e < total) requestAnimationFrame(tick); else { paint(base, loopMod(fx, amp, 0)); if (rec) rec.stop(); else resolve() }
        }
        requestAnimationFrame(tick)
      })
    }

    $('#preview').addEventListener('click', async () => { if (busy) return; setBusy(true); await runTween(false); setBusy(false); redraw() })
    $('#record').addEventListener('click', async () => { if (busy) return; setBusy(true); await runTween(true); setBusy(false); redraw() })
    $('#loopprev').addEventListener('click', async () => { if (busy) return; setBusy(true); await runLoop(false); setBusy(false); redraw() })
    $('#looprec').addEventListener('click', async () => { if (busy) return; setBusy(true); await runLoop(true); setBusy(false); redraw() })
    $('#dlpng').addEventListener('click', async () => {
      await ensureFonts(); redraw()
      const a = document.createElement('a'); a.download = (inText.value || 'card') + '.png'; a.href = cv.toDataURL('image/png'); a.click()
    })

    ensureFonts().then(redraw)
  }, [])

  return (
    <div className="tool tool-keypoint" ref={rootRef}>
      <div className="wrap">
        <div className="panel">
          <div className="field"><label>大字</label>
            <input id="inText" type="text" defaultValue="成就模仿" maxLength={12} autoComplete="off" />
          </div>

          <div className="row">
            <div className="grp"><span className="lab">字級</span><input id="size" type="range" min="7" max="26" step="0.5" defaultValue="15" /></div>
            <div className="grp"><span className="lab">粗細</span><input id="bold" type="range" min="0" max="100" step="1" defaultValue="40" /></div>
            <div className="grp"><span className="lab">字體</span>
              <select id="font" defaultValue="0">
                <option value="0">明體</option><option value="1">黑體</option><option value="2">楷體</option>
              </select>
            </div>
            <button className="chip" id="center">置中</button>
            <span className="spacer"></span>
            <button className="btn dark" id="dlpng">下載目前畫面 (PNG)</button>
          </div>

          <div className="sect">
            <h3>① 位移／縮放動畫(起點 → 終點)</h3>
            <p className="sub">擺好位置、字級、粗細後設「起點」;改成另一個位置/字級再設「終點」。字級也會被記進去——起點大字+終點小字就會慢慢縮小。</p>
            <div className="row">
              <button className="chip" id="setStart">設為起點</button>
              <button className="chip" id="setEnd">設為終點</button>
              <button className="chip" id="goStart">跳到起點</button>
              <button className="chip" id="goEnd">跳到終點</button>
              <div className="grp"><span className="lab">時間(秒)</span><input id="dur" type="number" min="0.5" max="15" step="0.5" defaultValue="3" /></div>
              <label className="chk"><input type="checkbox" id="shuffle" /> 字體切換特效</label>
              <div className="grp"><span className="lab">切換速度</span><input id="speed" type="range" min="40" max="200" step="10" defaultValue="80" /></div>
              <span className="spacer"></span>
              <button className="btn" id="preview">▶ 預覽</button>
              <button className="btn" id="record"><span className="dot"></span>● 錄影</button>
            </div>
          </div>

          <div className="sect">
            <h3>② 循環特效(無縫 loop)</h3>
            <p className="sub">以目前的字／位置／大小為基準,做會循環接回的小動態,錄出來的短片可無限重複。</p>
            <div className="row">
              <div className="grp"><span className="lab">效果</span>
                <select id="loopfx" defaultValue="bob">
                  <option value="bob">上下跳動</option><option value="sway">左右晃動</option>
                  <option value="pulse">放大縮小</option><option value="breathe">呼吸(淡)</option>
                  <option value="rock">搖擺(旋轉)</option>
                </select>
              </div>
              <div className="grp"><span className="lab">幅度</span><input id="amp" type="range" min="0" max="100" step="1" defaultValue="45" /></div>
              <div className="grp"><span className="lab">循環秒數</span><input id="loopsec" type="number" min="1" max="10" step="0.5" defaultValue="3" /></div>
              <div className="grp"><span className="lab">每圈次數</span><input id="cycles" type="number" min="1" max="12" step="1" defaultValue="3" /></div>
              <span className="spacer"></span>
              <button className="btn" id="loopprev">▶ 預覽循環</button>
              <button className="btn" id="looprec"><span className="dot"></span>● 錄循環</button>
            </div>
          </div>

          <p className="hint">拖曳大字可移動位置。所有錄影輸出 .webm、不含游標。循環是用正弦波做的,頭尾會接回同一點,所以可以無縫重複播放。</p>
        </div>
        <div className="stage"><canvas id="cv" width="1920" height="1080"></canvas></div>
      </div>
    </div>
  )
}
