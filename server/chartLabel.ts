import { createWorker, PSM } from 'tesseract.js'
import { TRADING_VIEW_SYMBOLS, symbolsInText } from './tradingViewSymbols.js'

export interface ServerChartLabel {
  symbol?: string
  timeframe?: string
  printedPrice?: number
}

const TIMEFRAME_RULES: Array<[RegExp, string]> = [
  [/\b(?:1D|D1|DAILY)\b/, '1D'],
  [/\b(?:1W|W1|WEEKLY)\b/, '1W'],
  [/\b(?:4H|H4)\b/, '4H'],
  [/\b(?:1H|H1)\b/, '1H'],
  [/\b(?:30M|M30)\b/, '30m'],
  [/\b(?:15M|M15)\b/, '15m'],
  [/\b(?:5M|M5)\b/, '5m'],
  [/\b(?:1M|M1)\b/, '1m'],
  [/\b240\b/, '4H'],
  [/\b60\b/, '1H'],
  [/\b30\b/, '30m'],
  [/\b15\b/, '15m'],
  [/\b5\b/, '5m'],
  [/(^|[^\d.])1(?![\d.])/, '1m'],
]

function intervalLabel(token: string) {
  const upper = token.toUpperCase()
  if (upper === '1' || upper === '1M' || upper === 'M1') return '1m'
  if (upper === '5' || upper === '5M' || upper === 'M5') return '5m'
  if (upper === '15' || upper === '15M' || upper === 'M15') return '15m'
  if (upper === '30' || upper === '30M' || upper === 'M30') return '30m'
  if (upper === '60' || upper === '1H' || upper === 'H1') return '1H'
  if (upper === '240' || upper === '4H' || upper === 'H4') return '4H'
  if (upper === '1D' || upper === 'D1' || upper === 'DAILY') return '1D'
  if (upper === '1W' || upper === 'W1' || upper === 'WEEKLY') return '1W'
  return undefined
}

function headerInterval(text: string) {
  const upper = text.toUpperCase()
  const match = upper.match(
    /(?:DOLLAR|XAUUSD|XAGUSD|EURUSD|GBPUSD|USDJPY|BTCUSD|ETHUSD|SPOT)\W{0,8}(1D|1W|4H|1H|30M|15M|5M|1M|240|60|30|15|5|1)(?!\d)/,
  )
  return match?.[1] ? intervalLabel(match[1]) : undefined
}

function normalizeTimeframe(text: string) {
  const fromHeader = headerInterval(text)
  if (fromHeader) return fromHeader
  const upper = text.toUpperCase()
  for (const [pattern, label] of TIMEFRAME_RULES) {
    if (pattern.test(upper)) return label
  }
  return undefined
}

function symbolFromText(text: string) {
  const direct = symbolsInText(text)[0]
  if (direct) return direct
  const compact = text.toUpperCase().replace(/[^A-Z0-9]/g, '')
  let best: { symbol: string; index: number } | undefined
  for (const item of TRADING_VIEW_SYMBOLS) {
    const index = compact.indexOf(item.symbol)
    if (index >= 0 && (best === undefined || index < best.index)) best = { symbol: item.symbol, index }
  }
  if (best) return best.symbol
  if (compact.includes('XAU') || compact.includes('GOLD')) return 'XAUUSD'
  if (compact.includes('XAG') || compact.includes('SILVER')) return 'XAGUSD'
  if (compact.includes('SPOT') && compact.includes('DOLLAR')) return 'XAUUSD'
  return undefined
}

function printedClose(text: string) {
  const flat = text.replace(/,/g, '')
  const labeled = flat.match(/C\s*(\d{3,5}\.\d{2,3})/i)
  const value = labeled ? Number(labeled[1]) : undefined
  return value && value > 0 ? value : undefined
}

export function labelFromText(text: string): ServerChartLabel {
  const lines = text.split('\n').map((item) => item.trim()).filter(Boolean)
  const symbolLine = lines.find((line) => symbolFromText(line)) ?? text
  return {
    symbol: symbolFromText(symbolLine) ?? symbolFromText(text),
    timeframe: normalizeTimeframe(symbolLine) ?? normalizeTimeframe(text),
    printedPrice: printedClose(symbolLine) ?? printedClose(text),
  }
}

function imageSize(image: Buffer) {
  if (image.length >= 24 && image[0] === 0x89 && image[1] === 0x50) {
    return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) }
  }
  if (image[0] !== 0xff || image[1] !== 0xd8) return undefined
  let offset = 2
  while (offset + 9 < image.length) {
    if (image[offset] !== 0xff) break
    const marker = image[offset + 1] ?? 0
    const length = image.readUInt16BE(offset + 2)
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { width: image.readUInt16BE(offset + 7), height: image.readUInt16BE(offset + 5) }
    }
    if (length < 2) break
    offset += 2 + length
  }
  return undefined
}

export async function readChartBuffer(image: Buffer): Promise<ServerChartLabel> {
  const worker = await createWorker('eng')
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK })
    const size = imageSize(image)
    const header = size
      ? { left: 0, top: 0, width: size.width, height: Math.max(48, Math.round(size.height * 0.22)) }
      : undefined
    const headerText = header ? (await worker.recognize(image, { rectangle: header })).data.text : ''
    const headerLabel = labelFromText(headerText)
    if (headerLabel.symbol) return headerLabel
    const fullText = (await worker.recognize(image)).data.text
    return labelFromText(`${headerText}\n${fullText}`)
  } finally {
    await worker.terminate()
  }
}
