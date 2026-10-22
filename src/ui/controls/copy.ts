/**
 * Practice bottom-bar Chinese chrome.
 * Song titles stay in their original language and are not listed here.
 */
export const controlBarCopy = {
  toolbarLabel: '练习控件',
  play: '播放',
  pause: '暂停',
  tempo: '速度',
  abLoop: 'A–B 循环',
  setA: '设为 A',
  setB: '设为 B',
  metronome: '节拍器',
  on: '开',
  off: '关',
  /** Placeholder when measure progress is not yet available. */
  measure: '小节',
  measureProgress: (n: number, total: number) => `小节 ${n} / ${total}`,
  measureScrubLabel: '小节进度',
} as const
