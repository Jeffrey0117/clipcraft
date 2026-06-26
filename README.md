# FreeForCut 剪輯字卡神器

FreeForCut 是一套免費的線上剪輯字卡工具。短影音創作者常用的五種字卡素材，全部在瀏覽器裡完成，一鍵輸出 1920x1080 的圖片或影片，可以直接放進剪輯軟體使用。不需安裝，不需設計底子。

## 功能

| 工具 | 說明 | 輸出 |
|------|------|------|
| 衝擊卡 / 打字跳字 | 大紅底白粗字的衝擊卡，或文字逐字蹦出的打字動畫 | PNG、錄影 webm |
| 封面產生器 | 16:9 影片封面，大標加小標 | PNG 1920x1080 |
| 內頁產生器 | 黑底教學內頁，逐句顯示、關鍵字標紅、可放配圖 | PNG 逐格 |
| 動態字卡序列 | 句子由中央浮現、停留、往上飛走，支援 SRT 匯入與合併 | 錄影 webm |
| 重點卡動畫 | 大字位移與縮放、無縫循環特效，可拖曳定位 | PNG、錄影 webm |

## 技術

採用 React 18、Vite、TypeScript。頁面切換使用 React Router。動態輸出由 Canvas 與 MediaRecorder 處理，靜態圖由 html2canvas 處理，圖示使用 Lucide。

五個工具各自獨立成元件，三個 Canvas 工具共用同一套錄影與字體載入邏輯。工具清單由 `src/tools/registry.ts` 統一管理，側邊欄與工具頁都讀同一份資料。

## 開發

```bash
npm install
npm run dev      # 開發伺服器，預設 http://localhost:5180
npm run build    # 打包到 dist
npm run preview  # 預覽打包結果
```

## 專案結構

```
src/
  components/    側邊欄、頂部導覽、版型
  pages/         首頁
  tools/         五個工具,各自一個資料夾
  lib/           共用的錄影與字體工具
  theme/         設計變數與全域樣式
```
