export const TRADING_VIEW_SYMBOLS = [
  { symbol: 'EURUSD', ticker: 'FX:EURUSD', market: 'forex' },
  { symbol: 'GBPUSD', ticker: 'FX:GBPUSD', market: 'forex' },
  { symbol: 'USDJPY', ticker: 'FX:USDJPY', market: 'forex' },
  { symbol: 'USDCHF', ticker: 'FX:USDCHF', market: 'forex' },
  { symbol: 'AUDUSD', ticker: 'FX:AUDUSD', market: 'forex' },
  { symbol: 'USDCAD', ticker: 'FX:USDCAD', market: 'forex' },
  { symbol: 'NZDUSD', ticker: 'FX:NZDUSD', market: 'forex' },
  { symbol: 'EURGBP', ticker: 'FX:EURGBP', market: 'forex' },
  { symbol: 'EURJPY', ticker: 'FX:EURJPY', market: 'forex' },
  { symbol: 'EURCHF', ticker: 'FX:EURCHF', market: 'forex' },
  { symbol: 'EURAUD', ticker: 'FX:EURAUD', market: 'forex' },
  { symbol: 'GBPJPY', ticker: 'FX:GBPJPY', market: 'forex' },
  { symbol: 'GBPAUD', ticker: 'FX:GBPAUD', market: 'forex' },
  { symbol: 'GBPCAD', ticker: 'FX:GBPCAD', market: 'forex' },
  { symbol: 'AUDJPY', ticker: 'FX:AUDJPY', market: 'forex' },
  { symbol: 'CADJPY', ticker: 'FX:CADJPY', market: 'forex' },
  { symbol: 'NZDJPY', ticker: 'FX:NZDJPY', market: 'forex' },
  { symbol: 'XAUUSD', ticker: 'OANDA:XAUUSD', market: 'cfd' },
  { symbol: 'XAGUSD', ticker: 'TVC:SILVER', market: 'cfd' },
  { symbol: 'US30', ticker: 'OANDA:US30USD', market: 'cfd' },
  { symbol: 'NAS100', ticker: 'NASDAQ:NDX', market: 'america' },
  { symbol: 'US500', ticker: 'SP:SPX', market: 'america' },
  { symbol: 'GER40', ticker: 'OANDA:DE30EUR', market: 'cfd' },
  { symbol: 'UK100', ticker: 'TVC:UKX', market: 'cfd' },
  { symbol: 'JP225', ticker: 'TVC:NI225', market: 'cfd' },
  { symbol: 'USOIL', ticker: 'FX:USOIL', market: 'cfd' },
  { symbol: 'UKOIL', ticker: 'FX:UKOIL', market: 'cfd' },
] as const

export type TradingViewMarket = (typeof TRADING_VIEW_SYMBOLS)[number]['market']

const SYMBOL_ALIASES: Array<{ symbol: string; keys: string[] }> = [
  { symbol: 'EURUSD', keys: ['eurusd', 'eur/usd', 'eur usd', 'euro dollar'] },
  { symbol: 'GBPUSD', keys: ['gbpusd', 'gbp/usd', 'gbp usd', 'cable', 'pound'] },
  { symbol: 'USDJPY', keys: ['usdjpy', 'usd/jpy', 'usd jpy', 'yen'] },
  { symbol: 'USDCHF', keys: ['usdchf', 'usd/chf', 'swissy'] },
  { symbol: 'AUDUSD', keys: ['audusd', 'aud/usd', 'aussie'] },
  { symbol: 'USDCAD', keys: ['usdcad', 'usd/cad', 'loonie'] },
  { symbol: 'NZDUSD', keys: ['nzdusd', 'nzd/usd', 'kiwi'] },
  { symbol: 'EURGBP', keys: ['eurgbp', 'eur/gbp'] },
  { symbol: 'EURJPY', keys: ['eurjpy', 'eur/jpy'] },
  { symbol: 'EURCHF', keys: ['eurchf', 'eur/chf'] },
  { symbol: 'EURAUD', keys: ['euraud', 'eur/aud'] },
  { symbol: 'GBPJPY', keys: ['gbpjpy', 'gbp/jpy'] },
  { symbol: 'GBPAUD', keys: ['gbpaud', 'gbp/aud'] },
  { symbol: 'GBPCAD', keys: ['gbpcad', 'gbp/cad'] },
  { symbol: 'AUDJPY', keys: ['audjpy', 'aud/jpy'] },
  { symbol: 'CADJPY', keys: ['cadjpy', 'cad/jpy'] },
  { symbol: 'NZDJPY', keys: ['nzdjpy', 'nzd/jpy'] },
  { symbol: 'XAUUSD', keys: ['xauusd', 'xau', 'gold'] },
  { symbol: 'XAGUSD', keys: ['xagusd', 'xag', 'silver'] },
  { symbol: 'US30', keys: ['us30', 'dow', 'djia', 'wall street'] },
  { symbol: 'NAS100', keys: ['nas100', 'nasdaq', 'us100', 'ustec'] },
  { symbol: 'US500', keys: ['us500', 'spx', 's&p', 'sp500'] },
  { symbol: 'GER40', keys: ['ger40', 'dax', 'de30', 'ger30'] },
  { symbol: 'UK100', keys: ['uk100', 'ftse'] },
  { symbol: 'JP225', keys: ['jp225', 'nikkei', 'jpn225'] },
  { symbol: 'USOIL', keys: ['usoil', 'wti', 'crude', 'oil'] },
  { symbol: 'UKOIL', keys: ['ukoil', 'brent'] },
  { symbol: 'BTCUSD', keys: ['btcusd', 'bitcoin'] },
  { symbol: 'ETHUSD', keys: ['ethusd', 'ethereum'] },
]

const CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD', 'XAU', 'XAG', 'XPT', 'XPD',
  'BTC', 'ETH', 'TRY', 'ZAR', 'MXN', 'SEK', 'NOK', 'SGD', 'HKD', 'CNH', 'PLN', 'HUF',
])

const BOARD_CODES = TRADING_VIEW_SYMBOLS.map((item) => item.symbol).join('|')

export function tradingViewTicker(symbol: string) {
  return TRADING_VIEW_SYMBOLS.find((item) => item.symbol === symbol)?.ticker
}

export function tradingViewSymbol(symbol: string) {
  return TRADING_VIEW_SYMBOLS.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase())
}

function hasAlias(haystack: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(haystack)
}

function isCurrencyPair(token: string) {
  if (!/^[A-Z]{6}$/.test(token)) return false
  return CURRENCIES.has(token.slice(0, 3)) && CURRENCIES.has(token.slice(3))
}

export function symbolsInText(text: string, selected?: string) {
  const found = new Set<string>()
  if (selected && (tradingViewSymbol(selected) || isCurrencyPair(selected.toUpperCase()) || SYMBOL_ALIASES.some((item) => item.symbol === selected.toUpperCase()))) {
    found.add(selected.toUpperCase())
  }
  const haystack = text.toLowerCase()
  for (const item of SYMBOL_ALIASES) {
    if (item.keys.some((key) => hasAlias(haystack, key))) found.add(item.symbol)
  }
  const upper = text.toUpperCase()
  for (const match of upper.match(new RegExp(`\\b(?:${BOARD_CODES})\\b`, 'g')) ?? []) found.add(match)
  for (const match of upper.match(/\b[A-Z]{6}\b/g) ?? []) {
    if (isCurrencyPair(match)) found.add(match)
  }
  return [...found]
}
