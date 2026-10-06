import { TRADING_VIEW_SYMBOLS, symbolsInText, tradingViewSymbol } from './tradingViewSymbols.js'

export interface TradingViewQuote {
  symbol: string
  ticker: string
  close: number
  change: number
  high: number
  low: number
  bid: number
  ask: number
}

interface ScannerRow {
  s?: string
  d?: number[]
}

interface SearchHit {
  symbol?: string
  prefix?: string
  source_id?: string
  type?: string
}

const SEARCH_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  origin: 'https://www.tradingview.com',
  referer: 'https://www.tradingview.com/',
}

const cache = new Map<string, { quote: TradingViewQuote; at: number }>()
const CACHE_MS = 20_000

async function scanMarket(market: string, tickers: string[]) {
  if (!tickers.length) return []
  const response = await fetch(`https://scanner.tradingview.com/${market}/scan`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://www.tradingview.com',
      referer: 'https://www.tradingview.com/',
    },
    body: JSON.stringify({
      symbols: { tickers },
      columns: ['close', 'change', 'high', 'low', 'bid', 'ask'],
    }),
    signal: AbortSignal.timeout(3500),
  })
  if (!response.ok) return []
  const payload = (await response.json()) as { data?: ScannerRow[] }
  return payload.data ?? []
}

function quoteFrom(symbol: string, ticker: string, values: number[]): TradingViewQuote | null {
  const close = values[0]
  if (close === undefined || !Number.isFinite(close) || close <= 0) return null
  return {
    symbol,
    ticker,
    close,
    change: Number(values[1] ?? 0),
    high: Number(values[2] ?? close),
    low: Number(values[3] ?? close),
    bid: Number(values[4] ?? close),
    ask: Number(values[5] ?? close),
  }
}

function remember(quote: TradingViewQuote) {
  cache.set(quote.symbol, { quote, at: Date.now() })
  return quote
}

function cached(symbol: string) {
  const hit = cache.get(symbol)
  if (!hit || Date.now() - hit.at > CACHE_MS) return undefined
  return hit.quote
}

async function quotesForKnown(symbols: readonly { symbol: string; ticker: string; market: string }[]) {
  const markets = [...new Set(symbols.map((item) => item.market))]
  const batches = await Promise.all(
    markets.map((market) =>
      scanMarket(
        market,
        symbols.filter((item) => item.market === market).map((item) => item.ticker),
      ),
    ),
  )
  const byTicker = new Map(batches.flat().map((row) => [row.s, row.d ?? []]))
  const quotes: TradingViewQuote[] = []
  for (const item of symbols) {
    const values = byTicker.get(item.ticker)
    if (!values) continue
    const quote = quoteFrom(item.symbol, item.ticker, values)
    if (quote) quotes.push(remember(quote))
  }
  return quotes
}

function marketsFor(type?: string) {
  if (type === 'forex') return ['forex', 'cfd', 'america', 'crypto']
  if (type === 'crypto') return ['crypto', 'cfd', 'america', 'forex']
  if (type === 'stock' || type === 'index') return ['america', 'cfd', 'forex', 'crypto']
  return ['cfd', 'forex', 'america', 'crypto']
}

async function closeForTicker(ticker: string, type?: string) {
  for (const market of marketsFor(type)) {
    const rows = await scanMarket(market, [ticker])
    const values = rows.find((row) => row.s === ticker)?.d
    if (values) return values
  }
  return undefined
}

function tickerFromHit(hit: SearchHit) {
  const name = (hit.symbol ?? '').replace(/<[^>]+>/g, '').trim().toUpperCase()
  const prefix = (hit.prefix || hit.source_id || '').trim().toUpperCase()
  if (!name || !prefix) return null
  return `${prefix}:${name}`
}

async function lookupSymbol(raw: string): Promise<TradingViewQuote | null> {
  const symbol = raw.trim().toUpperCase()
  if (!symbol) return null
  const fresh = cached(symbol)
  if (fresh) return fresh
  const known = tradingViewSymbol(symbol)
  if (known) {
    const [quote] = await quotesForKnown([known])
    return quote ?? null
  }
  const response = await fetch(
    `https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(symbol)}&hl=1&lang=en`,
    { headers: SEARCH_HEADERS },
  )
  if (!response.ok) return null
  const hits = (await response.json()) as SearchHit[]
  for (const hit of hits.slice(0, 4)) {
    const ticker = tickerFromHit(hit)
    if (!ticker) continue
    const values = await closeForTicker(ticker, hit.type)
    if (!values) continue
    const quote = quoteFrom(symbol, ticker, values)
    if (quote) return remember(quote)
  }
  return null
}

function requestedNames(raw: string[]) {
  const wanted = new Set<string>()
  const unresolved: string[] = []
  for (const item of raw) {
    const text = item.trim()
    if (!text) continue
    const named = symbolsInText(text)
    if (named.length) named.forEach((symbol) => wanted.add(symbol))
    else unresolved.push(text.toUpperCase())
  }
  return { wanted: [...wanted], unresolved }
}

export async function fetchTradingViewQuotes(requested?: string[]): Promise<TradingViewQuote[]> {
  if (!requested?.length) return quotesForKnown(TRADING_VIEW_SYMBOLS)
  const { wanted, unresolved } = requestedNames(requested)
  const known = wanted.map((symbol) => tradingViewSymbol(symbol)).filter((item) => item !== undefined)
  const knownQuotes = known.length ? await quotesForKnown(known) : []
  const missing = [
    ...wanted.filter((symbol) => !knownQuotes.some((quote) => quote.symbol === symbol)),
    ...unresolved,
  ].slice(0, 4)
  const extras = await Promise.all(missing.map((symbol) => lookupSymbol(symbol)))
  return [...knownQuotes, ...extras.filter((quote): quote is TradingViewQuote => quote !== null)]
}
