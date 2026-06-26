import { useEffect, useRef } from 'react'
import { createRecorder } from '../../lib/recorder'
import { DUST_SRC } from './dust'
import './kinetic.css'

export default function KineticText() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current!
    const $ = (s: string) => root.querySelector(s) as any

    const cv = $('#cv') as HTMLCanvasElement
    const ctx = cv.getContext('2d') as any
    const W = 1920, H = 1080
    const WHITE = '#F6F6F4', RED = '#E0241B'
    const animEl = $('#anim'), animlab = $('#animlab')
    const staggerEl = $('#stagger'), staglab = $('#staglab')
    const lastStayEl = $('#laststay'), totalEl = $('#total'), cardsBox = $('#cards')

    let cards: any[] = [
      { text: '跨境電商', gap: 0.3, hold: 1.4, byLine: false, size: 14, lh: 1.18 },
      { text: '這個月\n即將突破\n30萬*美金*', gap: 0.3, hold: 1.8, byLine: true, size: 9, lh: 1.3 },
    ]
    let previewIdx = 0

    const dust = new Image(); let dustReady = false
    dust.onload = () => { dustReady = true; drawCurrent() }
    dust.src = DUST_SRC

    const cl = (v: number) => Math.max(0, Math.min(1, v)), fmt = (ms: number) => (ms / 1000).toFixed(1) + 's'
    const fmtClock = (s: number) => { s = Math.max(0, s); const m = Math.floor(s / 60), ss = (s % 60); return m + ':' + (ss < 10 ? '0' : '') + ss.toFixed(1) }
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3), easeIn = (t: number) => t * t * t

    function lineStarts(card: any, enterMs: number, staggerMs: number) {
      const lines = (card.text || '').split('\n')
      if (card.lineGaps && card.lineGaps.length === lines.length) return card.lineGaps.map((g: number) => g * 1000)
      return lines.map((_: any, i: number) => i * staggerMs)
    }
    function buildSchedule() {
      const enter = +animEl.value * 1000, exit = +animEl.value * 1000, stagger = +staggerEl.value * 1000, laststay = lastStayEl.checked
      let t = 0; const sch: any[] = []
      cards.forEach((c, i) => {
        t += Math.max(0, c.gap) * 1000
        const tIn = t, hold = Math.max(0, c.hold) * 1000
        const nl = (c.text || '').split('\n').length, byLine = c.byLine && nl > 1
        let enterTotal = enter; if (byLine) { const ls = lineStarts(c, enter, stagger); enterTotal = Math.max(0, ...ls) + enter }
        const isLast = (i === cards.length - 1) && laststay, ex = isLast ? 0 : exit
        const holdEnd = tIn + enterTotal + hold, tOut = holdEnd + ex
        sch.push({ c, tIn, enter, enterTotal, stagger, byLine, holdEnd, exit: ex, tOut, isLast }); t = tOut
      })
      return { sch, total: t + (laststay ? 900 : 250) }
    }

    function bg() {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
      if (dustReady) { ctx.globalAlpha = .55; ctx.drawImage(dust, 0, 0, W, H); ctx.globalAlpha = 1 }
    }
    function segs(line: string) { const parts = (line || '').split('*'); const out: any[] = []; parts.forEach((p, i) => { if (p === '') return; out.push({ t: p, red: i % 2 === 1 }) }); return out.length ? out : [{ t: '', red: false }] }
    function metrics(text: string, size: number, lhMul: number) { const fs = size / 100 * W; return { fs, lh: fs * (lhMul || 1.18), lines: (text || '').split('\n') } }
    function drawLine(line: string, y: number, alpha: number, fs: number) {
      ctx.font = '900 ' + fs + 'px "Noto Sans TC", sans-serif'; ctx.textBaseline = 'middle'; ctx.globalAlpha = cl(alpha)
      const parts = segs(line); ctx.textAlign = 'left'
      const ws = parts.map((p) => ctx.measureText(p.t).width), total = ws.reduce((a: number, b: number) => a + b, 0)
      ctx.save(); ctx.translate(W / 2, 0); ctx.scale(1.05, 1); let x = -total / 2
      parts.forEach((p, i) => { ctx.fillStyle = p.red ? RED : WHITE; ctx.fillText(p.t, x, y); x += ws[i] })
      ctx.restore(); ctx.globalAlpha = 1; ctx.textAlign = 'center'
    }
    function drawBlock(text: string, yOff: number, alpha: number, size: number, lhMul: number) {
      const { fs, lh, lines } = metrics(text, size, lhMul); const startY = H / 2 - (lines.length - 1) * lh / 2
      lines.forEach((ln: string, i: number) => drawLine(ln, startY + i * lh + yOff, alpha, fs))
    }
    function drawByLine(card: any, local: number, enterMs: number, staggerMs: number, size: number, lhMul: number) {
      const { fs, lh, lines } = metrics(card.text, size, lhMul)
      const startY = H / 2 - (lines.length - 1) * lh / 2; const OFF = H * 0.16; const ls = lineStarts(card, enterMs, staggerMs)
      lines.forEach((ln: string, i: number) => { const p = cl((local - ls[i]) / enterMs); if (p <= 0) return; drawLine(ln, startY + i * lh + OFF * (1 - easeOut(p)), p, fs) })
    }
    function drawCurrent() { bg(); const c = cards[previewIdx] || cards[0]; if (c) drawBlock(c.text, 0, 1, c.size, c.lh) }

    function paintAt(tau: number, sch: any[]) {
      bg(); const ENTER_OFF = H * 0.16, EXIT_OFF = H * 0.95
      for (const s of sch) {
        if (tau < s.tIn) break; const local = tau - s.tIn, sz = s.c.size, lh = s.c.lh
        if (s.isLast) {
          if (s.byLine) { if (local < s.enterTotal) drawByLine(s.c, local, s.enter, s.stagger, sz, lh); else drawBlock(s.c.text, 0, 1, sz, lh) }
          else { if (local < s.enter) { const p = local / s.enter; drawBlock(s.c.text, ENTER_OFF * (1 - easeOut(p)), p, sz, lh) } else drawBlock(s.c.text, 0, 1, sz, lh) }
          continue
        }
        if (tau >= s.tOut) continue
        if (local < s.enterTotal) {
          if (s.byLine) drawByLine(s.c, local, s.enter, s.stagger, sz, lh)
          else { const p = local / s.enter; drawBlock(s.c.text, ENTER_OFF * (1 - easeOut(p)), p, sz, lh) }
        } else if (tau < s.holdEnd) { drawBlock(s.c.text, 0, 1, sz, lh) }
        else { const p = (tau - s.holdEnd) / s.exit, e = easeIn(p); drawBlock(s.c.text, -EXIT_OFF * e, 1 - p * p, sz, lh) }
      }
    }

    function renderCards() {
      cardsBox.innerHTML = ''
      cards.forEach((c, i) => {
        if (c.lh === undefined) c.lh = 1.18
        const el = document.createElement('div'); el.className = 'card' + (c._sel ? ' sel' : '')
        el.innerHTML =
          '<div class="idxcol"><input type="checkbox" data-f="sel"' + (c._sel ? ' checked' : '') + '><div class="idx">' + (i + 1) + '</div></div>' +
          '<div class="tcell"><textarea data-f="text" rows="1">' + c.text.replace(/</g, '&lt;') + '</textarea>' +
          '<div class="cardopts"><label class="chk"><input type="checkbox" data-f="byline"' + (c.byLine ? ' checked' : '') + '> 逐行飛入</label>' +
          '<span class="nf">字級 <input data-f="size" type="number" min="4" max="24" step="0.5" value="' + c.size + '"></span>' +
          '<span class="nf">行距 <input data-f="lh" type="number" min="1" max="3" step="0.05" value="' + c.lh + '"></span>' +
          '<button class="redbtn" data-op="red">標紅</button></div></div>' +
          '<div class="mini"><label>前置空白(秒)</label><input data-f="gap" type="number" min="0" step="0.1" value="' + c.gap + '"></div>' +
          '<div class="mini"><label>停留(秒)</label><input data-f="hold" type="number" min="0" step="0.1" value="' + c.hold + '"></div>' +
          '<div class="tc" data-tc></div>' +
          '<div class="ops"><button data-op="up">↑</button><button data-op="down">↓</button><button data-op="del">✕</button></div>'
        const focusThis = () => { previewIdx = i; drawCurrent() }
        const tx = el.querySelector('[data-f=text]') as any
        tx.addEventListener('focus', focusThis)
        tx.addEventListener('input', (e: any) => { c.text = e.target.value; focusThis(); updateTimeline() })
        ;(el.querySelector('[data-f=byline]') as any).addEventListener('change', (e: any) => { c.byLine = e.target.checked; focusThis(); updateTimeline() })
        const sz = el.querySelector('[data-f=size]') as any; sz.addEventListener('focus', focusThis)
        sz.addEventListener('input', (e: any) => { c.size = parseFloat(e.target.value) || 10; focusThis() })
        const lh = el.querySelector('[data-f=lh]') as any; lh.addEventListener('focus', focusThis)
        lh.addEventListener('input', (e: any) => { c.lh = parseFloat(e.target.value) || 1.18; focusThis() })
        ;(el.querySelector('[data-op=red]') as any).addEventListener('mousedown', (e: any) => e.preventDefault())
        ;(el.querySelector('[data-op=red]') as any).addEventListener('click', () => {
          const s = tx.selectionStart, e2 = tx.selectionEnd
          if (s === e2) { alert('請先在這張卡片的文字框中,反白選取要標紅的字。'); return }
          const v = tx.value, sel = v.slice(s, e2); let nv
          if (sel.length > 1 && sel[0] === '*' && sel[sel.length - 1] === '*') nv = v.slice(0, s) + sel.slice(1, -1) + v.slice(e2)
          else nv = v.slice(0, s) + '*' + sel + '*' + v.slice(e2)
          tx.value = nv; c.text = nv; focusThis(); updateTimeline()
        })
        ;(el.querySelector('[data-f=gap]') as any).addEventListener('input', (e: any) => { c.gap = parseFloat(e.target.value) || 0; updateTimeline() })
        ;(el.querySelector('[data-f=hold]') as any).addEventListener('input', (e: any) => { c.hold = parseFloat(e.target.value) || 0; updateTimeline() })
        ;(el.querySelector('[data-f=sel]') as any).addEventListener('change', (e: any) => { c._sel = e.target.checked; el.classList.toggle('sel', c._sel) })
        ;(el.querySelector('[data-op=up]') as any).addEventListener('click', () => { if (i > 0) { [cards[i - 1], cards[i]] = [cards[i], cards[i - 1]]; renderCards() } })
        ;(el.querySelector('[data-op=down]') as any).addEventListener('click', () => { if (i < cards.length - 1) { [cards[i + 1], cards[i]] = [cards[i], cards[i + 1]]; renderCards() } })
        ;(el.querySelector('[data-op=del]') as any).addEventListener('click', () => { cards.splice(i, 1); if (previewIdx >= cards.length) previewIdx = Math.max(0, cards.length - 1); renderCards(); drawCurrent() })
        cardsBox.appendChild(el)
      })
      updateTimeline()
    }
    function updateTimeline() {
      const { sch, total } = buildSchedule()
      ;[...cardsBox.children].forEach((el: any, i: number) => {
        const s = sch[i]; if (!s) return
        el.querySelector('[data-tc]').innerHTML = '進場 <b>' + fmt(s.tIn) + '</b><br>離場 <b>' + fmt(s.isLast ? total : s.tOut) + '</b>'
      })
      totalEl.textContent = '總長 ' + fmt(total)
    }

    $('#merge').addEventListener('click', () => {
      const idxs = cards.map((c, i) => c._sel ? i : -1).filter((i) => i >= 0)
      if (idxs.length < 2) { alert('請先勾選至少兩句(要連續的)。'); return }
      for (let k = 1; k < idxs.length; k++) if (idxs[k] !== idxs[k - 1] + 1) { alert('請勾選「連續」的句子來合併。'); return }
      const a = idxs[0], b = idxs[idxs.length - 1]
      const { sch } = buildSchedule(); const tInA = sch[a].tIn; let lines: string[] = [], lineGaps: number[] = []
      for (let i = a; i <= b; i++) {
        const g = +(((sch[i].tIn - tInA) / 1000)).toFixed(2)
        ;(cards[i].text || '').split('\n').forEach((sl: string) => { lines.push(sl); lineGaps.push(g) })
      }
      const enterMs = +animEl.value * 1000, maxGap = Math.max(0, ...lineGaps) * 1000, enterTotal = maxGap + enterMs
      const holdMs = (sch[b].holdEnd - tInA) - enterTotal
      const merged = { text: lines.join('\n'), gap: cards[a].gap, hold: +Math.max(0.2, holdMs / 1000).toFixed(2), byLine: true, size: Math.max(4, cards[a].size - 2), lh: 1.3, lineGaps }
      cards.splice(a, b - a + 1, merged); cards.forEach((c) => c._sel = false); previewIdx = a; renderCards(); drawCurrent()
    })

    function parseSRT(txt: string) {
      txt = txt.replace(/﻿/g, '').replace(/\r/g, ''); const blocks = txt.split(/\n\s*\n/); const out: any[] = []
      for (const bk of blocks) {
        const ls = bk.split('\n').filter((l) => l.trim() !== ''); const ti = ls.findIndex((l) => l.includes('-->')); if (ti < 0) continue
        const m = ls[ti].match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/); if (!m) continue
        const S = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000, E = (+m[5]) * 3600 + (+m[6]) * 60 + (+m[7]) + (+m[8]) / 1000
        const text = ls.slice(ti + 1).map((l) => l.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join('\n'); if (text) out.push({ S, E, text })
      }
      return out
    }
    function srtToCards(entries: any[]) {
      const enter = +animEl.value, exit = +animEl.value, off = entries.length ? entries[0].S : 0; let prevOut = 0; const arr: any[] = []
      entries.forEach((e) => { const S = e.S - off, E = e.E - off, gap = Math.max(0, S - prevOut), hold = Math.max(0.2, (E - S) - enter); prevOut = S + enter + hold + exit; arr.push({ text: e.text, gap: +gap.toFixed(2), hold: +hold.toFixed(2), byLine: false, size: 11, lh: 1.18 }) })
      return arr
    }
    function applyEntries(ents: any[]) {
      if (!ents.length) { alert('讀不到字幕,請確認是標準 SRT。'); return }
      cards = srtToCards(ents); previewIdx = 0; renderCards(); drawCurrent()
      alert('已產生 ' + ents.length + ' 句。第一句原本在 ' + fmtClock(ents[0].S) + ',已平移到 0 秒。\n後面要疊成逐行的句子,勾選它們再按「合併選取的句子」。')
    }
    $('#srtbtn').addEventListener('click', () => $('#srtfile').click())
    $('#srtfile').addEventListener('change', (e: any) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = (ev: any) => applyEntries(parseSRT(ev.target.result)); rd.readAsText(f, 'utf-8'); e.target.value = '' })
    const pastebox = $('#pastebox')
    $('#pastebtn').addEventListener('click', () => { pastebox.style.display = pastebox.style.display === 'none' ? 'block' : 'none'; if (pastebox.style.display === 'block') $('#srttext').focus() })
    $('#pastecancel').addEventListener('click', () => { pastebox.style.display = 'none' })
    $('#pasteapply').addEventListener('click', () => { applyEntries(parseSRT($('#srttext').value)); pastebox.style.display = 'none' })

    $('#add').addEventListener('click', () => { cards.push({ text: '新句子', gap: 0.2, hold: 1.2, byLine: false, size: 11, lh: 1.18 }); previewIdx = cards.length - 1; renderCards(); drawCurrent() })
    animEl.addEventListener('input', () => { animlab.textContent = (+animEl.value).toFixed(2) + 's'; updateTimeline() })
    staggerEl.addEventListener('input', () => { staglab.textContent = (+staggerEl.value).toFixed(2) + 's'; updateTimeline(); drawCurrent() })
    lastStayEl.addEventListener('change', updateTimeline)

    let busy = false
    const setBusy = (b: boolean) => { busy = b; ['#preview', '#record', '#add', '#srtbtn', '#pastebtn', '#merge'].forEach((id) => { $(id).disabled = b }) }
    async function ensureFont() { if ((document as any).fonts) { try { await (document as any).fonts.load('900 300px "Noto Sans TC"') } catch (e) {} } }

    function run(record: boolean) {
      return new Promise<void>(async (resolve) => {
        await ensureFont(); const { sch, total } = buildSchedule(); let rec: MediaRecorder | null = null
        if (record) {
          rec = createRecorder(cv, () => '動態字卡', () => { root.classList.remove('recording'); resolve() })
          if (!rec) return resolve()
          rec.start(); root.classList.add('recording')
        }
        const t0 = performance.now()
        function tick(now: number) { const tau = now - t0; paintAt(tau, sch); if (tau < total) requestAnimationFrame(tick); else { if (rec) rec.stop(); else resolve(); drawCurrent() } }
        requestAnimationFrame(tick)
      })
    }
    $('#preview').addEventListener('click', async () => { if (busy) return; setBusy(true); await run(false); setBusy(false) })
    $('#record').addEventListener('click', async () => { if (busy) return; setBusy(true); await run(true); setBusy(false) })

    renderCards(); ensureFont().then(drawCurrent)
  }, [])

  return (
    <div className="tool tool-kinetic" ref={rootRef}>
      <div className="wrap">
        <div className="panel">
          <h2>句子序列(每句:從中央浮現 → 停留 → 往上飛走)</h2>
          <div className="selbar">勾選連續的多句 → 可合併成一張「逐行堆疊」卡片
            <button className="mergebtn" id="merge">🔗 合併選取的句子</button></div>
          <div className="cards" id="cards"></div>
          <div className="underrow">
            <button className="addbtn" id="add">＋ 新增句子</button>
            <button className="srtbtn" id="srtbtn">⬆ 匯入 SRT 檔</button>
            <button className="srtbtn" id="pastebtn">📋 貼上 SRT</button>
            <input id="srtfile" type="file" accept=".srt,text/plain" hidden />
          </div>
          <div className="pastebox" id="pastebox" style={{ display: 'none' }}>
            <textarea id="srttext" placeholder="把 SRT 整段貼進來"></textarea>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}><span className="spacer"></span>
              <button className="addbtn" id="pastecancel" style={{ flex: '0 0 auto', padding: '10px 18px' }}>取消</button>
              <button className="btn" id="pasteapply">產生卡片</button></div>
          </div>

          <div className="row">
            <div className="grp"><span className="lab">進出場速度</span><input id="anim" type="range" min="0.15" max="0.9" step="0.05" defaultValue="0.4" /><span className="lab" id="animlab">0.40s</span></div>
            <div className="grp"><span className="lab">逐行間隔(手動)</span><input id="stagger" type="range" min="0.15" max="0.8" step="0.05" defaultValue="0.35" /><span className="lab" id="staglab">0.35s</span></div>
            <label className="topchk"><input type="checkbox" id="laststay" defaultChecked /> 最後一句停住</label>
            <span className="spacer"></span><span className="total" id="total">總長 0.0s</span>
          </div>
          <div className="row"><span className="spacer"></span>
            <button className="btn dark" id="preview">▶ 預覽</button>
            <button className="btn" id="record"><span className="dot"></span>● 播放並錄影</button>
          </div>

          <p className="hint">
            <b>每張卡片:</b>字級、行距(行與行距離,合併多行時拉開用)各自獨立;改動時下方預覽會顯示「那一張」即時更新。<br />
            <b>標紅:</b>在文字框反白選取關鍵字 → 按「標紅」(用 *字* 標記,再按一次取消)。<b>合併:</b>勾連續句 → 「合併選取的句子」,各行照原字幕時間飛入。輸出 .webm。
          </p>
        </div>
        <div className="stage"><canvas id="cv" width="1920" height="1080"></canvas></div>
      </div>
    </div>
  )
}
