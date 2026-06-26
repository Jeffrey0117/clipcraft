import { lazy, type LazyExoticComponent, type ComponentType } from 'react'
import { Zap, Image, Presentation, Clapperboard, Target } from 'lucide-react'

export interface Tool {
  id: string
  path: string                       // 路由,例如 /impact
  name: string                       // 側邊欄/卡片標題
  desc: string                       // 一句話用途
  Icon: ComponentType<any>           // Lucide 線條 icon(不用 emoji)
  color: string                      // 工具的 accent 色
  output: string                     // 產出格式標籤
  group: string                      // 側邊欄分組
  Component: LazyExoticComponent<() => JSX.Element>
}

// ★ 全站單一資料源:側邊欄導覽 + 首頁工具網格都讀這份
export const tools: Tool[] = [
  {
    id: 'impact',
    path: '/impact',
    name: '衝擊卡 / 打字跳字',
    desc: '大紅底白粗字的衝擊卡,或一個字一個字蹦出的打字動畫。',
    Icon: Zap,
    color: '#C01814',
    output: 'PNG · 錄影 webm',
    group: '圖卡 / 封面',
    Component: lazy(() => import('./ImpactTyping/ImpactTyping')),
  },
  {
    id: 'cover',
    path: '/cover',
    name: '封面產生器',
    desc: '16:9 影片封面,大標 + 小標,一鍵輸出 1920×1080。',
    Icon: Image,
    color: '#C01814',
    output: 'PNG 1920×1080',
    group: '圖卡 / 封面',
    Component: lazy(() => import('./CoverMaker/CoverMaker')),
  },
  {
    id: 'slide',
    path: '/slide',
    name: '內頁產生器',
    desc: '黑底教學內頁,逐句顯示、關鍵字標紅、可配圖,逐格輸出。',
    Icon: Presentation,
    color: '#0D0D0B',
    output: 'PNG 逐格',
    group: '圖卡 / 封面',
    Component: lazy(() => import('./SlideMaker/SlideMaker')),
  },
  {
    id: 'kinetic',
    path: '/kinetic',
    name: '動態字卡序列',
    desc: '句子從中央浮現→停留→往上飛走,支援 SRT 匯入與合併。',
    Icon: Clapperboard,
    color: '#0D0D0B',
    output: '錄影 webm',
    group: '動態字卡',
    Component: lazy(() => import('./KineticText/KineticText')),
  },
  {
    id: 'keypoint',
    path: '/keypoint',
    name: '重點卡動畫',
    desc: '大字位移/縮放(起點→終點)與無縫循環特效,可拖曳定位。',
    Icon: Target,
    color: '#82302B',
    output: 'PNG · 錄影 webm',
    group: '動態字卡',
    Component: lazy(() => import('./KeypointCard/KeypointCard')),
  },
]

export const groups = ['圖卡 / 封面', '動態字卡']
