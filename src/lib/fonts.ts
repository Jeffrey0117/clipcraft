// 字體載入小工具,確保畫到 canvas 前 web font 已就緒。
export async function loadFonts(specs: string[]): Promise<void> {
  if (!(document as any).fonts) return
  await Promise.all(specs.map((s) => (document as any).fonts.load(s).catch(() => {})))
}

export async function fontsReady(): Promise<void> {
  if ((document as any).fonts && (document as any).fonts.ready) {
    await (document as any).fonts.ready
  }
}
