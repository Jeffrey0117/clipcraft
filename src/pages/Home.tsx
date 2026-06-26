import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { tools } from '../tools/registry'
import GitHubStar from '../components/GitHubStar'
import './home.css'

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export default function Home() {
  const navigate = useNavigate()
  const base = import.meta.env.BASE_URL // 本機是 '/',Pages 上是 '/clipcraft/'
  const rootRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const reelARef = useRef<HTMLVideoElement>(null)
  const reelBRef = useRef<HTMLVideoElement>(null)

  // 首頁期間 body 底色設深黑(離開時還原)
  useEffect(() => {
    document.body.classList.add('home-dark')
    return () => document.body.classList.remove('home-dark')
  }, [])

  // 兩支影片疊放,播完一支「淡入」下一支(切頻道感,不會閃到封面)
  useEffect(() => {
    const a = reelARef.current, b = reelBRef.current
    if (!a || !b) return
    const fadeTo = (show: HTMLVideoElement, hide: HTMLVideoElement) => {
      show.currentTime = 0; show.play().catch(() => {})
      show.style.opacity = '1'; hide.style.opacity = '0'
    }
    const onA = () => fadeTo(b, a)
    const onB = () => fadeTo(a, b)
    a.addEventListener('ended', onA); b.addEventListener('ended', onB)
    return () => { a.removeEventListener('ended', onA); b.removeEventListener('ended', onB) }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // 捲動驅動:把捲動進度 p(0→1)映射到影片縮放、暗化、標題浮現
    let ticking = false
    const apply = () => {
      ticking = false
      const rect = scene.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const p = total > 0 ? clamp(-rect.top / total, 0, 1) : 0
      if (videoRef.current) videoRef.current.style.transform = `scale(${(1 + p * 0.12).toFixed(4)})`
      // 影片在標題浮現前就完全淡成純黑(p≈0.4 時全黑,背後乾淨無鬼影)
      if (veilRef.current) veilRef.current.style.opacity = String(clamp((p - 0.05) / 0.35, 0, 1))
      if (copyRef.current) {
        const cp = clamp((p - 0.42) / 0.32, 0, 1)
        copyRef.current.style.opacity = String(cp)
        copyRef.current.style.transform = `translateY(${((1 - cp) * 40).toFixed(1)}px)`
      }
      if (cueRef.current) cueRef.current.style.opacity = String(clamp(1 - p * 7, 0, 1))
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply) } }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    apply()

    // 下方區塊捲入時淡入
    const els = rootRef.current ? Array.from(rootRef.current.querySelectorAll('.reveal')) : []
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.2 },
    )
    els.forEach((el) => io.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      io.disconnect()
    }
  }, [])

  return (
    <div className="home" ref={rootRef}>
      {/* ── 捲動舞台:影片釘住,捲動時溶進同一個深色底,標題浮現 ── */}
      <section className="scene" ref={sceneRef}>
        <div className="scene-pin">
          <video className="scene-video" ref={videoRef} src={`${base}hometop.webm`} autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
          <div className="scene-veil" ref={veilRef} />
          <div className="scene-headline" ref={copyRef}>
            <video ref={reelARef} className="reel" src={`${base}headline.webm`} poster={`${base}headline.png`} autoPlay muted playsInline preload="auto" aria-hidden="true" />
            <video ref={reelBRef} className="reel reel-b" src={`${base}demo.webm`} muted playsInline preload="auto" aria-hidden="true" />
          </div>
          <div className="scroll-ind" ref={cueRef} aria-hidden="true"><span /></div>
        </div>
      </section>

      {/* ── 網站介紹(同一個深色底)── */}
      <section className="story">
        <div className="story-intro reveal">
          <p className="eyebrow">關於 FREEFORCUT</p>
          <h2>剪輯字卡神器</h2>
          <p className="story-text">
            FreeForCut 是一套免費的線上剪輯字卡工具 —— 衝擊卡、打字動畫、動態字幕、封面、教學內頁,
            短影音最常用的五種字卡素材,全部在瀏覽器裡做完。打開分頁、打上字、一鍵輸出
            1920×1080 的圖片或影片,直接丟進剪輯軟體就收工。不用安裝、不用設計底子,
            就能讓你的影片質感升級。
          </p>
          <button className="btn-primary" onClick={() => navigate(tools[0].path)}>
            開始做字卡 <ArrowRight className="ar" size={19} strokeWidth={2.4} />
          </button>
        </div>
      </section>

      {/* ── 頁尾 ── */}
      <section className="home-body">
        <div className="home-foot">
          <GitHubStar className="gh-star foot-ghstar" />
          <p className="foot-text">
            <b>FreeForCut</b> · 為每一位做剪輯的人打造。<br />
            覺得好用的話,歡迎到 GitHub 給顆星。
          </p>
        </div>
      </section>
    </div>
  )
}
