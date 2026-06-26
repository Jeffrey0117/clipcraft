// 三個 canvas 工具共用的「擷取畫面 → 錄成 webm → 下載」邏輯。
// getFilename 在停止時才呼叫,確保抓到當下最新的檔名。
export function createRecorder(
  canvas: HTMLCanvasElement,
  getFilename: () => string,
  onstop?: () => void,
): MediaRecorder | null {
  const stream = (canvas as any).captureStream(30) as MediaStream
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  const mime = types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t))
  if (!mime) {
    alert('此瀏覽器不支援錄影,請用較新的 Chrome / Edge。')
    return null
  }
  const chunks: BlobPart[] = []
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 })
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    const a = document.createElement('a')
    a.download = getFilename() + '.webm'
    a.href = URL.createObjectURL(blob)
    a.click()
    onstop && onstop()
  }
  return rec
}
