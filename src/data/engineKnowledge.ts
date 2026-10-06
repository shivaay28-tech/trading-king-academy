import { instruments } from '@/data/instruments'

export const TOPIC_COURSES: Record<string, { title: string; slug: string }> = {
  pairs: { title: 'Understanding Currency Pairs', slug: 'understanding-currency-pairs' },
  sessions: { title: 'Introduction to Forex Trading', slug: 'introduction-to-forex-trading' },
  orders: { title: 'How Buy and Sell Orders Work', slug: 'how-buy-and-sell-orders-work' },
  risk: { title: 'Pips, Lots, Leverage and Margin', slug: 'pips-lots-leverage-and-margin' },
  mt5: { title: 'Introduction to MetaTrader 5', slug: 'introduction-to-metatrader-5' },
  ta: { title: 'Technical Analysis Essentials', slug: 'technical-analysis-essentials' },
  fundamentals: { title: 'Fundamental Market Analysis', slug: 'fundamental-market-analysis' },
  psychology: { title: 'Trading Psychology', slug: 'trading-psychology' },
  cfd: { title: 'Understanding Financial Markets', slug: 'understanding-financial-markets' },
  ib: { title: 'Introducing Broker Fundamentals', slug: 'introducing-broker-fundamentals' },
  chart: { title: 'Technical Analysis Essentials', slug: 'technical-analysis-essentials' },
  instrument: { title: 'Understanding Currency Pairs', slug: 'understanding-currency-pairs' },
  brief: { title: 'Fundamental Market Analysis', slug: 'fundamental-market-analysis' },
  signals: { title: 'Risk Management Fundamentals', slug: 'risk-management-fundamentals' },
}

export const INSTRUMENT_STUDY: Record<
  string,
  { product: string; howQuoted: string; whatMovesIt: string; studyFocus: string }
> = {
  EURUSD: {
    product: 'EURUSD is a major FX pair: euro versus US dollar. On most retail platforms it is quoted to five decimal places, where the fourth decimal is the pip.',
    howQuoted: 'If the quote is 1.08540, one euro costs 1.08540 dollars. The bid is the price a dealer will buy the base (EUR) from you; the ask is the price they will sell it to you. The gap is the spread — a cost, not a forecast.',
    whatMovesIt: 'It often reacts to euro-area and US data: inflation, employment, and central-bank communication from the ECB and the Federal Reserve. Liquidity typically improves in the London–New York overlap.',
    studyFocus: 'For study, mark session times, the next high-impact US or euro print, and whether you are looking at a demo or a live account. Do not treat a colour change on the candle as an instruction.',
  },
  XAUUSD: {
    product: 'XAUUSD is gold quoted against the US dollar. On CFD platforms the contract size and tick value are not the same as an FX pip. Always open the specification before talking about size.',
    howQuoted: 'Gold can print in two decimals (for example 2645.30). A one-dollar move is not “one pip” in the FX sense. Overnight financing and spread behaviour around US hours belong in the product document.',
    whatMovesIt: 'Learners usually track real yields, the US dollar, and risk-sentiment headlines. Moves can be fast around CPI, FOMC, and geopolitical news. Speed is a risk topic, not a reason to trade.',
    studyFocus: 'On a gold chart, name the timeframe first, then the most recent swing high and swing low. Ask how wide that range is in dollars, then in account currency at a tiny size. That is literacy, not a call.',
  },
  GBPUSD: {
    product: 'GBPUSD (cable) is pound sterling versus the US dollar. It can be more volatile than EURUSD around UK data and BoE events.',
    howQuoted: 'Quoted like other dollar majors. Spreads often tighten in London hours and can jump around UK CPI, labour data, and MPC communication.',
    whatMovesIt: 'UK inflation, growth, and Bank of England language, plus anything that moves the dollar. Thin holiday sessions can exaggerate wicks.',
    studyFocus: 'Compare London morning structure with the New York overlap on the same timeframe. You are practising observation, not prediction.',
  },
  US30: {
    product: 'US30 is a cash index CFD linked to the US 30 share benchmark. It follows US equity hours more than the FX calendar.',
    howQuoted: 'Quoted in index points, not FX pips. Contract specs, min tick, and margin are platform-specific. Gaps around the cash-session open are a common educational example of overnight risk.',
    whatMovesIt: 'US index CFDs often react to US economic data, earnings clusters, and Federal Reserve events. Overnight and weekend gaps are part of the product, not an anomaly.',
    studyFocus: 'Note whether the chart is in the cash session or in off-hours. A quiet Asian print on an index CFD is not the same market as the US cash open.',
  },
  NAS100: {
    product: 'NAS100 is a cash index CFD linked to a large US technology-heavy benchmark. Volatility can be higher than the US 30 around mega-cap news.',
    howQuoted: 'Point value and margin differ from FX. Confirm the specification. A 50-point swing is meaningless until you convert it to cash at a stated volume.',
    whatMovesIt: 'US hours, mega-cap headlines, and rates narratives. Correlation with risk appetite can be strong — still not a signal.',
    studyFocus: 'Practise converting a recent swing into account currency at 0.1 and 1.0 volume so you see why size dominates the chart.',
  },
  USOIL: {
    product: 'USOIL is typically a WTI crude oil CFD. Energy products have their own inventory calendar, contract months, and financing.',
    howQuoted: 'Quoted in dollars per barrel (and fractions). Tick value is not an FX pip. Some accounts use futures-style months — read the name of the symbol on the Market Watch.',
    whatMovesIt: 'Weekly inventory data, OPEC headlines, USD moves, and supply disruptions. Spreads can widen in thin hours.',
    studyFocus: 'Write down the symbol name, the contract unit, and the next scheduled inventory release. Product literacy comes before any chart story.',
  },
}

export function instrumentName(symbol?: string) {
  return instruments.find((item) => item.symbol === symbol)?.name ?? symbol ?? 'this market'
}

export function instrumentSession(symbol?: string) {
  return instruments.find((item) => item.symbol === symbol)?.sessionNote
}

export const ORDER_NOTE = `A market order is a request to transact now at the available bid or ask. A limit waits for a more favourable price and may never fill. A stop becomes a market order when a trigger is reached — it is designed as a risk or entry mechanism, not a promise. Pending orders (buy limit, sell limit, buy stop, sell stop) are the same ideas parked on the ticket. None of them is a recommendation; they are tools on MetaTrader 5 and similar terminals.`

export const RISK_NOTE = `Leverage is a multiplier on exposure, not a bonus. Margin is collateral the platform holds while a position is open. If equity falls far enough, a stop-out can close positions automatically. A useful study drill: pick a tiny volume (for example 0.01 on FX), measure a recent swing in pips or points, and convert that swing into cash. Then repeat at 10× the volume. The chart did not change — the damage did.`

export const MT5_NOTE = `On MetaTrader 5, start with Market Watch (symbols), the chart (timeframe + template), and the Toolbox (Trade, History, Journal). Open a demo ticket: symbol, volume, market versus pending, then optional stop and limit prices. Keep one-click trading off until the ticket is comfortable. The Journal is the record of what the terminal actually sent — more reliable than memory.`

export const PAIRS_NOTE = `A pair is base/quote. In EURUSD the base is EUR. A five-digit FX quote uses the fourth decimal as the pip; gold and index CFDs do not. Majors include EURUSD, GBPUSD, USDJPY. Crosses omit the dollar (EURGBP). Exotics pair a major with a smaller currency and often have wider spreads. Always read the live bid/ask on the platform you would use, not a delayed screenshot.`

export const SESSION_NOTE = `The weekday FX market is a chain of regional sessions. A teaching model in UTC: Tokyo about 00:00–09:00, London 07:00–16:00, New York 12:00–21:00. Overlaps (especially London–New York) usually mean more quotes and tighter spreads. Index CFDs care more about the US cash session. Sitting out of a session is a valid educational choice.`

export const TA_NOTE = `Technical analysis here is a labelling language: swing high, swing low, range versus a series of higher highs, and whether an indicator is describing the past. Support and resistance are areas where price reacted before — they are not walls. Indicators such as RSI or a moving average summarise history; they do not authorise a trade. Timeframe first, then structure, then risk distance.`

export const FUNDAMENTALS_NOTE = `A calendar is a study tool. High-impact prints (CPI, NFP, central-bank decisions) can gap prices and widen spreads. You do not need a forecast. You need to know which currencies or products are in focus, whether you are on demo or live, and that “no position” is an allowed outcome of reading the calendar.`

export const PSYCH_NOTE = `Charts invite action. Education asks you to delay it. Common traps: revenge after a loss, increasing size to “get it back”, and treating a demo win as a live edge. A written rule such as “I study this timeframe and I do not place a live order today” is more useful than a new indicator.`

export const CFD_NOTE = `A CFD (contract for difference) tracks an underlying price without delivering the asset. You are exposed to the price difference, plus spread, possible commissions, and overnight financing. Oil, indices, and gold on retail platforms are usually CFDs. That is why the specification — not a YouTube chart — decides tick value.`

export function sessionClock(now = new Date()) {
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60
  const tokyo = hour >= 0 && hour < 9
  const london = hour >= 7 && hour < 16
  const newYork = hour >= 12 && hour < 21
  const parts: string[] = []
  if (tokyo) parts.push('Tokyo hours are open on this teaching clock')
  if (london) parts.push('London hours are open')
  if (newYork) parts.push('New York hours are open')
  if (!parts.length) parts.push('this UTC snapshot sits outside the main Tokyo/London/New York windows')
  let overlap = 'No major overlap on this simplified clock.'
  if (london && newYork) overlap = 'London and New York overlap — often the busiest FX window.'
  else if (tokyo && london) overlap = 'Tokyo and London overlap — a common hand-over into Europe.'
  return { hour, tokyo, london, newYork, summary: `${parts.join('; ')}. ${overlap}` }
}

export function weekdayLabel(now = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(now)
}
