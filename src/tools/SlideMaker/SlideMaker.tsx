import { useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import './slide.css'

export default function SlideMaker() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current!
    const $ = (s: string) => root.querySelector(s) as any

    const inCourse = $('#inCourse')
    const course = $('#course')
    const linesBox = $('#lines')
    const lineEls = [...linesBox.querySelectorAll('.line')] as any[]
    const segTotal = $('#segTotal')
    const shVal = $('#shVal')
    const img = $('#img')
    const inImg = $('#inImg')
    const clearImg = $('#clearImg')

    let total = 2, shown = 2

    function render() {
      total = Math.min(4, Math.max(1, total))
      shown = Math.min(total, Math.max(1, shown))
      lineEls.forEach((el, i) => {
        if (i < total) { el.style.display = 'block'; el.style.visibility = (i < shown) ? 'visible' : 'hidden' }
        else { el.style.display = 'none' }
      })
      ;[...segTotal.children].forEach((b: any) => b.classList.toggle('on', +b.dataset.n === total))
      shVal.textContent = shown + ' / ' + total
    }

    inCourse.addEventListener('input', () => { course.textContent = inCourse.value || ' ' })

    segTotal.addEventListener('click', (e: any) => { const b = e.target.closest('button'); if (!b) return; total = +b.dataset.n; shown = total; render() })
    $('#shMinus').addEventListener('click', () => { shown--; render() })
    $('#shPlus').addEventListener('click', () => { shown++; render() })

    function caretEnd(el: any) {
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false)
      const s = window.getSelection()!; s.removeAllRanges(); s.addRange(r)
    }
    lineEls.forEach((el, i) => {
      el.addEventListener('keydown', (e: any) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          let next = i + 1
          if (next >= total) { if (total < 4) { total = next + 1 } else return }
          shown = total; render(); lineEls[next].focus(); caretEnd(lineEls[next])
        }
      })
    })

    function colorSel(hex: string) {
      const sel = window.getSelection()!
      if (!sel.rangeCount || sel.isCollapsed || !linesBox.contains(sel.anchorNode)) {
        alert('請先在黑色預覽裡,用滑鼠選取要變色的文字。'); return
      }
      document.execCommand('styleWithCSS', false, 'true')
      document.execCommand('foreColor', false, hex)
    }
    $('#toRed').addEventListener('mousedown', (e: any) => e.preventDefault())
    $('#toWhite').addEventListener('mousedown', (e: any) => e.preventDefault())
    $('#toRed').addEventListener('click', () => colorSel('#C01814'))
    $('#toWhite').addEventListener('click', () => colorSel('#F4F4F1'))

    inImg.addEventListener('change', (e: any) => {
      const f = e.target.files[0]; if (!f) return
      const rd = new FileReader()
      rd.onload = (ev: any) => { img.src = ev.target.result; img.classList.add('show'); clearImg.style.display = 'inline-block' }
      rd.readAsDataURL(f)
    })
    clearImg.addEventListener('click', () => { img.src = ''; img.classList.remove('show'); clearImg.style.display = 'none'; inImg.value = '' })

    $('#dl').addEventListener('click', async () => {
      const btn = $('#dl'), label = btn.textContent
      btn.textContent = '產生中…'; btn.disabled = true
      ;(document.activeElement as any)?.blur(); window.getSelection()!.removeAllRanges()
      try {
        if ((document as any).fonts && (document as any).fonts.ready) await (document as any).fonts.ready
        await new Promise((r) => setTimeout(r, 80))
        const slide = $('#slide') as HTMLElement
        const scale = 1920 / slide.offsetWidth
        const canvas = await html2canvas(slide, { scale, backgroundColor: '#0D0D0B', useCORS: true, logging: false })
        const a = document.createElement('a')
        a.download = (inCourse.value || 'slide').trim() + '_' + shown + 'of' + total + '.png'
        a.href = canvas.toDataURL('image/png'); a.click()
      } catch (err) { alert('產生圖片時發生問題,請再試一次。'); console.error(err) }
      finally { btn.textContent = label; btn.disabled = false }
    })

    render()
  }, [])

  return (
    <div className="tool tool-slide" ref={rootRef}>
      <div className="wrap">
        <div className="panel">
          <div className="field">
            <label>課程名稱(左上角・固定)</label>
            <input id="inCourse" type="text" defaultValue="故事高手課" maxLength={20} autoComplete="off" />
          </div>

          <div className="ctrls">
            <div className="grp">
              <span className="lab">排版句數(動畫總數)</span>
              <div className="seg" id="segTotal">
                <button data-n="1">1</button><button data-n="2">2</button>
                <button data-n="3">3</button><button data-n="4">4</button>
              </div>
            </div>
            <div className="grp">
              <span className="lab">顯示到第幾句</span>
              <div className="step">
                <button id="shMinus">−</button><span className="val" id="shVal">2 / 2</span><button id="shPlus">+</button>
              </div>
            </div>
          </div>

          <div className="row">
            <button className="chip red" id="toRed">選取 → 標紅</button>
            <button className="chip" id="toWhite">選取 → 改白</button>
            <label className="filebtn">＋ 右側圖片(可不放)<input id="inImg" type="file" accept="image/*" hidden /></label>
            <button className="chip" id="clearImg" style={{ display: 'none' }}>移除圖片</button>
            <span className="spacer"></span>
            <button className="btn" id="dl">下載這一格 (PNG)</button>
          </div>

          <p className="hint">
            在黑色預覽裡直接打字,每句一行(按 Enter 補下一句)。要某幾個字變紅:選取後按「選取 → 標紅」。<br />
            <b>做動畫:</b>先把四句都打好、把「排版句數」設成 4 → 再用「顯示到第幾句」1、2、3、4 各下載一張,第一句位置永遠不動。<br />
            <b>單句:</b>排版句數設成 1,就會置中。
          </p>
        </div>

        <div className="stage">
          <div className="slide" id="slide">
            <div className="course" id="course">故事高手課</div>
            <div className="lines" id="lines">
              <div className="line" contentEditable spellCheck={false} suppressContentEditableWarning>觀眾投入情緒時</div>
              <div className="line" contentEditable spellCheck={false} suppressContentEditableWarning>會自動建立與你之間更深的<span style={{ color: '#C01814' }}>連結</span></div>
              <div className="line" contentEditable spellCheck={false} suppressContentEditableWarning></div>
              <div className="line" contentEditable spellCheck={false} suppressContentEditableWarning></div>
            </div>
            <img className="slideimg" id="img" alt="" />
          </div>
        </div>
      </div>
    </div>
  )
}
