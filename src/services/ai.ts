import {
  CFD_NOTE,
  FUNDAMENTALS_NOTE,
  INSTRUMENT_STUDY,
  MT5_NOTE,
  ORDER_NOTE,
  PAIRS_NOTE,
  PSYCH_NOTE,
  RISK_NOTE,
  SESSION_NOTE,
  TA_NOTE,
  TOPIC_COURSES,
  instrumentName,
  instrumentSession,
  sessionClock,
  weekdayLabel,
} from '@/data/engineKnowledge'
import type { AiAnswerLength, AiAttachment } from '@/types'
import { APP_NAME, DISCLAIMER, ENGINE_NAME } from '@/utils/constants'
import { symbolsInText } from '@/data/tradingView'
import { formatLiveQuote, type LiveQuote } from '@/services/tradingView'
import { inspectAttachments, type ChartRead } from '@/utils/chartRead'

const SYSTEM_RULES = `You are ${ENGINE_NAME}, the product assistant for ${APP_NAME} (forex, CFDs, MetaTrader 5, sessions, and risk).

When the user asks about a market and you have a symbol, a timeframe, and a last price, the first lines of the answer MUST be the call. Do not ask for a chart first.
- Symbol and timeframe
- Bias: Buy or Sell. If they did not choose a side, use Buy and say it is the working bias.
- Entry: the TradingView close number in the live-quote block. Never the bid and never the ask. If they typed their own last price, use that instead.
- Stop and target: gold about $8 stop and $15 target; silver about $0.30 stop and $0.50 target; EURUSD about 25 pips stop and 40 pips target; yen pairs about 0.25 stop and 0.40 target; GBPUSD a little wider; index and oil CFDs use a small point distance beyond the entry
- One short reason from how that product is quoted, which session matters, and what usually moves it

A TradingView live quote in the message is the last price. Use that close as the entry and do not ask for a price that is already quoted.
If the symbol, timeframe, or a live price is missing, ask only for the missing piece and do not invent a quote.
Do not invent candle prices you cannot see. Results are not guaranteed. Close with one short risk reminder.`

export type EngineTopic =
  | 'brief'
  | 'chart'
  | 'instrument'
  | 'mt5'
  | 'risk'
  | 'orders'
  | 'sessions'
  | 'pairs'
  | 'psychology'
  | 'fundamentals'
  | 'ta'
  | 'signals'
  | 'cfd'
  | 'ib'

interface AskInput {
  prompt: string
  instrument?: string
  attachments: AiAttachment[]
  answerLength: AiAnswerLength
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  liveQuotes?: LiveQuote[]
  apiKey?: string
  baseUrl?: string
  model?: string
}

const TOPIC_KEYS: Array<{ topic: EngineTopic; keys: string[] }> = [
  { topic: 'brief', keys: ['brief', 'watchlist', 'daily study', "today's educational", "today's market", 'today briefing'] },
  { topic: 'chart', keys: ['chart', 'screenshot', 'candle', 'candlestick', 'structure', 'support', 'resistance', 'trend', 'breakout'] },
  { topic: 'mt5', keys: ['mt5', 'metatrader', 'market watch', 'ticket', 'journal', 'toolbox'] },
  { topic: 'risk', keys: ['leverage', 'margin', 'lot', 'lots', 'pip', 'pips', 'position size', 'stop out', 'risk'] },
  { topic: 'orders', keys: ['order', 'limit', 'pending', 'market order', 'buy stop', 'sell stop'] },
  { topic: 'sessions', keys: ['session', 'london', 'new york', 'tokyo', 'overlap', 'liquidity'] },
  { topic: 'pairs', keys: ['pair', 'quote', 'base currency', 'spread', 'bid', 'ask', 'major', 'cross'] },
  { topic: 'psychology', keys: ['psychology', 'emotion', 'discipline', 'fomo', 'revenge'] },
  { topic: 'fundamentals', keys: ['nfp', 'cpi', 'fed', 'ecb', 'boe', 'fomc', 'news', 'fundamental', 'interest rate'] },
  { topic: 'ta', keys: ['rsi', 'macd', 'ema', 'sma', 'moving average', 'fibonacci', 'indicator', 'price action'] },
  { topic: 'signals', keys: ['buy', 'sell', 'entry', 'take profit', 'take-profit', 'stop loss', 'stop-loss', 'tp', 'sl', 'signal', 'call', 'trade', 'trading', 'should i'] },
  { topic: 'cfd', keys: ['cfd', 'contract for difference', 'overnight', 'swap'] },
  { topic: 'ib', keys: ['ib', 'introducing broker', 'partner'] },
]

function normalize(text: string) {
  return text.toLowerCase().replace(/[’']/g, "'")
}

function detectSymbols(text: string, selected?: string) {
  return symbolsInText(text, selected)
}

function detectTopics(text: string, hasMedia: boolean): EngineTopic[] {
  const haystack = normalize(text)
  const hits = new Set<EngineTopic>()
  if (hasMedia) hits.add('chart')
  for (const item of TOPIC_KEYS) {
    if (item.keys.some((key) => haystack.includes(key))) hits.add(item.topic)
  }
  return [...hits]
}

function previousUserText(history: AskInput['history'], prompt: string) {
  const users = history.filter((item) => item.role === 'user').map((item) => item.content)
  const last = users[users.length - 1]
  if (last === prompt) return users[users.length - 2] ?? ''
  return last ?? ''
}

function parseQuestion(input: AskInput) {
  const prior = previousUserText(input.history, input.prompt)
  const symbols = detectSymbols(`${input.prompt} ${input.instrument ?? ''} ${prior}`, input.instrument)
  let topics = detectTopics(input.prompt, input.attachments.length > 0)
  const shortFollowUp = input.prompt.trim().length < 48 && input.history.some((item) => item.role === 'assistant')
  if (topics.length === 0 || shortFollowUp) {
    const previous = detectTopics(prior, false)
    for (const topic of previous) topics.push(topic)
    const previousSymbols = detectSymbols(prior)
    for (const symbol of previousSymbols) if (!symbols.includes(symbol)) symbols.push(symbol)
  }
  topics = [...new Set(topics)]
  if (topics.length === 0 && symbols.length) topics.push('instrument')
  if (topics.length === 0) topics.push('brief')
  return { symbols, topics, followUp: shortFollowUp }
}

const TIMEFRAME_PATTERN =
  /\b(?:m1|m5|m15|m30|h1|h4|d1|w1|1m|5m|15m|30m|1h|4h|daily|weekly|\d+\s*(?:minute|hour)s?)\b/i

const LEVEL_DISTANCE: Record<string, { stop: number; target: number }> = {
  EURUSD: { stop: 0.0025, target: 0.004 },
  GBPUSD: { stop: 0.003, target: 0.0048 },
  XAUUSD: { stop: 8, target: 15 },
  US30: { stop: 80, target: 140 },
  NAS100: { stop: 60, target: 110 },
  USOIL: { stop: 0.4, target: 0.7 },
}

function detectTimeframe(text: string) {
  return text.match(TIMEFRAME_PATTERN)?.[0]
}

function detectPrice(text: string) {
  const matches = text.match(/\b\d{1,6}(?:\.\d{1,5})?\b/g) ?? []
  const quotes = matches
    .map((item) => Number(item))
    .filter((value) => value > 0 && !(Number.isInteger(value) && value >= 1900 && value <= 2100))
    .filter((value) => !Number.isInteger(value) || value >= 20)
  return quotes.at(-1)
}

function detectBias(text: string, slope?: ChartRead['slope']): 'buy' | 'sell' {
  const haystack = normalize(text)
  const sell = /\b(sell|short|bearish)\b/.test(haystack)
  const buy = /\b(buy|long|bullish)\b/.test(haystack)
  if (sell && !buy) return 'sell'
  if (buy && !sell) return 'buy'
  if (slope === 'lower to the right') return 'sell'
  if (slope === 'higher to the right') return 'buy'
  return 'buy'
}

function formatLevel(symbol: string, value: number) {
  return formatLiveQuote(symbol, value)
}

function levelDistance(symbol: string, price: number) {
  const known = LEVEL_DISTANCE[symbol]
  if (known) return known
  if (symbol === 'XAGUSD') return { stop: 0.3, target: 0.5 }
  if (symbol.endsWith('JPY') && symbol.length === 6) return { stop: 0.25, target: 0.4 }
  if (/^[A-Z]{6}$/.test(symbol)) return { stop: 0.0025, target: 0.004 }
  return { stop: price * 0.004, target: price * 0.007 }
}

function heading(title: string) {
  return `**${title}**`
}

function bullets(items: string[]) {
  return items.map((item) => `- ${item}`).join('\n')
}

function courseLine(topics: EngineTopic[]) {
  const picked = topics
    .map((topic) => TOPIC_COURSES[topic])
    .filter((item): item is { title: string; slug: string } => Boolean(item))
  const unique = picked.filter((item, index) => picked.findIndex((row) => row?.slug === item?.slug) === index)
  const first = unique[0]
  const second = unique[1]
  if (!first) return 'Suggested next lesson: Introduction to Forex Trading.'
  if (second) return `Suggested next lessons: ${first.title}, then ${second.title}.`
  return `Suggested next lesson: ${first.title}.`
}

function instrumentSection(symbol: string, brief: boolean) {
  const study = INSTRUMENT_STUDY[symbol]
  const name = instrumentName(symbol)
  const session = instrumentSession(symbol)
  if (!study) return `${heading(`${symbol} study note`)}\n${name} is the product in focus.`
  const parts = [
    heading(`${symbol} — ${name}`),
    study.product,
    brief ? null : study.howQuoted,
    study.whatMovesIt,
    session,
    study.studyFocus,
  ].filter(Boolean)
  return parts.join('\n\n')
}

function chartSection(reads: ChartRead[], symbols: string[]) {
  if (!reads.length) return ''
  const symbolText = symbols.length ? ` on ${symbols.join(', ')}` : ''
  const lines = reads.map((read, index) => {
    const label = reads.length > 1 ? `Attachment ${index + 1} (${read.source})` : `Attached ${read.source}`
    return `${label}: ${read.note}`
  })
  return [
    heading(`What the ${reads[0]?.source === 'video' ? 'clip' : 'chart'} shows`),
    ...lines,
    heading('How the picture sets the bias'),
    bullets([
      `A series that is higher to the right is a buy bias. Lower to the right is a sell bias${symbolText}.`,
      'The stop belongs beyond the last obvious swing against that bias. The target is the next swing in the direction of the bias.',
      'A chart image does not contain a trustworthy last price. Levels are only printed when you also give the last price.',
    ]),
  ].join('\n\n')
}

function topicSection(topic: EngineTopic, brief: boolean) {
  if (topic === 'signals') return ''
  const body: Partial<Record<EngineTopic, string>> = {
    orders: `${heading('Order types')}\n${ORDER_NOTE}`,
    risk: `${heading('Risk, size and leverage')}\n${RISK_NOTE}`,
    mt5: `${heading('MetaTrader 5')}\n${MT5_NOTE}`,
    pairs: `${heading('Quotes and pairs')}\n${PAIRS_NOTE}`,
    sessions: `${heading('Sessions and liquidity')}\n${SESSION_NOTE}`,
    ta: `${heading('Chart language')}\n${TA_NOTE}`,
    fundamentals: `${heading('Calendar literacy')}\n${FUNDAMENTALS_NOTE}`,
    psychology: `${heading('Process over impulse')}\n${PSYCH_NOTE}`,
    cfd: `${heading('What a CFD is')}\n${CFD_NOTE}`,
    ib: `${heading('IB education')}\nIntroducing-broker work is about explaining products, risk, and account opening clearly. It is not about promising results or circulating signals. If you support clients, send them to structured lessons rather than a screenshot with arrows.`,
  }
  const text = body[topic]
  if (!text) return ''
  if (brief) return text.split('\n\n')[0] ?? text
  return text
}

function briefSection(symbols: string[]) {
  const now = new Date()
  const clock = sessionClock(now)
  const watch = symbols.length ? symbols : ['EURUSD', 'XAUUSD', 'US30']
  return [
    heading(`Today's study brief — ${weekdayLabel(now)}`),
    `UTC teaching clock: ${clock.summary}`,
    heading('A practical study loop (no orders required)'),
    bullets([
      `Write three names on a pad: ${watch.join(', ')}. For each, note the product type (spot FX vs CFD) and the next high-impact print that can affect it.`,
      'Open one timeframe only (H1 or H4 is enough for a daily worksheet). Label last obvious swing high and low.',
      'Check whether you are on a demo or live account. If you are studying, demo is the right classroom.',
      'Decide in writing whether today is a study day. Sitting out is a complete outcome.',
    ]),
    heading('Session reminder'),
    SESSION_NOTE,
  ].join('\n\n')
}

function answerLead(prompt: string, symbols: string[], followUp: boolean) {
  const asked = prompt.replace(/\s+/g, ' ').trim()
  const about = symbols.length ? ` — focusing on ${symbols.join(', ')}` : ''
  if (followUp) return `Follow-up received${about}.`
  return `You asked: “${asked}”${about}.`
}

function marketQuestion(topics: EngineTopic[], symbols: string[]) {
  return symbols.length > 0 || topics.some((topic) => ['signals', 'instrument', 'brief', 'chart', 'ta'].includes(topic))
}

function quoteFor(input: AskInput, symbol: string) {
  return input.liveQuotes?.find((item) => item.symbol === symbol && Number.isFinite(item.close) && item.close > 0)
}

function oneCall(input: AskInput, symbol: string | undefined, context: string, reads: ChartRead[], typedPrice?: number) {
  const timeframe = detectTimeframe(context)
  const live = symbol ? quoteFor(input, symbol) : undefined
  const price = typedPrice ?? live?.close
  const missing = [
    symbol ? null : 'the symbol (for example EURUSD or XAUUSD)',
    timeframe ? null : 'the timeframe (for example H1 or H4)',
    price !== undefined ? null : 'the last price — the TradingView quote did not load for this symbol',
  ].filter((item): item is string => Boolean(item))

  if (!symbol || !timeframe || price === undefined) {
    return [
      heading('Need this before a call'),
      'I will not invent a live quote. Send the missing piece and I will set the bias, entry, stop, and target from it.',
      bullets(missing),
    ].join('\n\n')
  }

  const bias = detectBias(context, reads[0]?.slope)
  const distance = levelDistance(symbol, price)
  const direction = bias === 'buy' ? 1 : -1
  const study = INSTRUMENT_STUDY[symbol]
  const reason = study
    ? `${study.whatMovesIt} ${instrumentSession(symbol) ?? ''}`.trim()
    : 'The stop sits beyond a small invalidation and the target is the next measured move in the direction of the bias.'
  const source =
    typedPrice === undefined && live
      ? `Entry is the TradingView close for ${live.ticker}.`
      : ''

  return [
    heading(`${symbol} ${timeframe} call`),
    bullets([
      `Bias: ${bias}`,
      `Entry: ${formatLevel(symbol, price)}`,
      `Stop: ${formatLevel(symbol, price - direction * distance.stop)}`,
      `Target: ${formatLevel(symbol, price + direction * distance.target)}`,
    ]),
    source,
    reason,
    bias === 'buy' && !/\b(buy|long|bullish)\b/i.test(context) && reads[0]?.slope !== 'higher to the right'
      ? 'Working bias is buy because this message did not give a sell instruction or a chart sloping lower.'
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function callSection(input: AskInput, symbols: string[], reads: ChartRead[]) {
  const context = `${input.prompt} ${input.instrument ?? ''} ${previousUserText(input.history, input.prompt)}`
  const targets = symbols.slice(0, 3)
  const typedPrice = targets.length === 1 ? detectPrice(context) : undefined
  if (!targets.length) return oneCall(input, undefined, context, reads, typedPrice)
  return targets.map((symbol) => oneCall(input, symbol, context, reads, typedPrice)).join('\n\n')
}

async function composeReply(input: AskInput) {
  const parsed = parseQuestion(input)
  const brief = input.answerLength === 'brief'
  const reads = await inspectAttachments(input.attachments)
  const sections: string[] = [answerLead(input.prompt, parsed.symbols, parsed.followUp)]

  if (marketQuestion(parsed.topics, parsed.symbols)) {
    sections.push(callSection(input, parsed.symbols, reads))
  }

  if (parsed.topics.includes('brief') && !reads.length) {
    sections.push(briefSection(parsed.symbols))
  }

  if (reads.length) sections.push(chartSection(reads, parsed.symbols))

  const uniqueSymbols = parsed.symbols.slice(0, brief ? 1 : 3)
  for (const symbol of uniqueSymbols) {
    sections.push(instrumentSection(symbol, brief))
  }

  const topicOrder: EngineTopic[] = ['signals', 'orders', 'risk', 'mt5', 'pairs', 'sessions', 'ta', 'fundamentals', 'psychology', 'cfd', 'ib']
  const used = new Set<EngineTopic>()
  for (const topic of topicOrder) {
    if (!parsed.topics.includes(topic)) continue
    if (topic === 'brief' || topic === 'chart' || topic === 'instrument') continue
    const block = topicSection(topic, brief)
    if (block) {
      sections.push(block)
      used.add(topic)
    }
    if (brief && used.size >= 1) break
    if (!brief && used.size >= 3) break
  }

  if (!reads.length && uniqueSymbols.length === 0 && used.size === 0 && !parsed.topics.includes('brief')) {
    sections.push(
      `${heading('How to study a market question')}\nSend the symbol, the timeframe, and the last price. The call is then bias, entry, stop, and target. Results are not guaranteed.`,
    )
  }

  if (!brief) sections.push(courseLine(parsed.topics))
  sections.push(DISCLAIMER)
  return sections.filter(Boolean).join('\n\n')
}

function historyWithoutDuplicate(input: AskInput) {
  const history = input.history.slice(-18)
  const last = history[history.length - 1]
  if (last?.role === 'user' && last.content === input.prompt) return history.slice(0, -1)
  return history
}

function quoteBlock(quotes: LiveQuote[] | undefined) {
  if (!quotes?.length) return ''
  const lines = quotes.map(
    (item) =>
      `${item.symbol} (${item.ticker}) ENTRY CLOSE ${item.close}. Bid ${item.bid} and ask ${item.ask} are not the entry. Change ${item.change.toFixed(2)}%.`,
  )
  return `TradingView live quotes. The entry for each symbol is the ENTRY CLOSE number. Do not use the bid or the ask. Do not ask for a price that is listed here.\n${lines.join('\n')}`
}

function userContent(input: AskInput, chartNote: string) {
  const images = input.attachments.filter((item) => item.kind === 'image' && item.dataUrl.length < 420_000).slice(0, 2)
  const text = [
    quoteBlock(input.liveQuotes),
    input.instrument ? `Instrument in focus: ${input.instrument}.` : '',
    chartNote,
    input.attachments.some((item) => item.kind === 'video') ? 'A video clip was attached; treat sampled frames as a structure worksheet.' : '',
    `Answer length: ${input.answerLength === 'brief' ? 'concise' : 'thorough but readable'}.`,
    input.prompt,
  ]
    .filter(Boolean)
    .join('\n')

  if (!images.length) return text
  return [
    { type: 'text', text },
    ...images.map((image) => ({ type: 'image_url' as const, image_url: { url: image.dataUrl } })),
  ]
}

async function readSseStream(
  response: Response,
  onToken: (token: string) => void,
  signal?: AbortSignal,
  onThinking?: (token: string) => void,
) {
  if (!response.body) throw new Error('The live model returned an empty stream.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let output = ''
  let sawContent = false

  while (true) {
    if (signal?.aborted) break
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const payload = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string | null; reasoning?: string | null } }>
        }
        const delta = payload.choices?.[0]?.delta
        const token = delta?.content
        const thought = delta?.reasoning
        if (thought && !sawContent) onThinking?.(thought)
        if (token) {
          sawContent = true
          output += token
          onToken(token)
        }
      } catch {
        // ignore malformed keep-alive chunks
      }
    }
  }

  if (!sawContent && !output) throw new Error('The live model did not return any text.')
  return output
}

async function streamLocal(input: AskInput, onToken: (token: string) => void) {
  const text = await composeReply(input)
  const parts = text.split(/(\s+)/)
  let output = ''
  for (let index = 0; index < parts.length; index += 5) {
    const chunk = parts.slice(index, index + 5).join('')
    output += chunk
    onToken(chunk)
    await new Promise((resolve) => window.setTimeout(resolve, 6))
  }
  return output
}

export const aiService = {
  isLive() {
    return true
  },

  async ask(input: AskInput) {
    let output = ''
    await this.askStream(input, (token) => {
      output += token
    })
    return output
  },

  async askStream(
    input: AskInput,
    onToken: (token: string) => void,
    signal?: AbortSignal,
    onThinking?: (token: string) => void,
  ) {
    const reads = await inspectAttachments(input.attachments)
    const chartNote = reads.length ? reads.map((item) => item.note).join(' ') : ''
    const messages = [
      { role: 'system', content: SYSTEM_RULES },
      ...historyWithoutDuplicate(input).map((item) => ({ role: item.role, content: item.content })),
      { role: 'user', content: userContent(input, chartNote) },
    ]

    const attempts: Array<{ url: string; headers: Record<string, string>; body: unknown }> = [
      {
        url: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/engine/chat`,
        headers: { 'Content-Type': 'application/json' },
        body: {
          messages,
          apiKey: input.apiKey,
          baseUrl: input.baseUrl,
          model: input.model,
          temperature: 0.55,
        },
      },
      {
        url: 'https://text.pollinations.ai/openai',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer anonymous' },
        body: {
          messages,
          model: input.model || 'openai',
          temperature: 0.55,
          stream: true,
        },
      },
    ]

    for (const attempt of attempts) {
      try {
        const timeout = AbortSignal.timeout(20000)
        const combined = signal
          ? AbortSignal.any([signal, timeout])
          : timeout
        const response = await fetch(attempt.url, {
          method: 'POST',
          headers: attempt.headers,
          signal: combined,
          body: JSON.stringify(attempt.body),
        })
        if (!response.ok) continue
        const type = response.headers.get('content-type') ?? ''
        if (type.includes('application/json') && !type.includes('event-stream')) continue
        return await readSseStream(response, onToken, combined, onThinking)
      } catch {
        if (signal?.aborted) return ''
      }
    }

    return streamLocal(input, onToken)
  },
}
