import { Seo } from '@/components/Seo'
import { EngineComposer } from '@/components/engine/EngineComposer'
import { EngineMarkdown } from '@/components/engine/EngineMarkdown'
import { EngineRail } from '@/components/engine/EngineRail'
import { EngineSidebar } from '@/components/engine/EngineSidebar'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { instruments } from '@/data/instruments'
import { symbolsInText, tradingViewTicker } from '@/data/tradingView'
import { aiService } from '@/services/ai'
import { authService } from '@/services/auth'
import { conversationService, newMessage } from '@/services/conversations'
import { formatLiveQuote, tradingViewService, type LiveQuote } from '@/services/tradingView'
import type { AiAttachment, AiConversation } from '@/types'
import { APP_NAME, APP_SHORT_NAME, BASIC_PRICE, COMPANY_URL, DISCLAIMER, ENGINE_NAME } from '@/utils/constants'
import { analysisTitle, uid } from '@/utils/format'
import { Camera, Clapperboard, Copy, Menu, MonitorUp, NotebookPen, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function EnginePage() {
  const { user, refresh } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [conversations, setConversations] = useState<AiConversation[]>(() => conversationService.list())
  const [activeId, setActiveId] = useState<string | undefined>(conversations[0]?.id)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [instrument, setInstrument] = useState('EURUSD')
  const [quotes, setQuotes] = useState<LiveQuote[]>([])
  const quotesRef = useRef<LiveQuote[]>([])
  quotesRef.current = quotes
  const [pendingFiles, setPendingFiles] = useState<AiAttachment[]>([])
  const [sending, setSending] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [stream, setStream] = useState('')
  const [thinking, setThinking] = useState('')
  const sendingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const streamRef = useRef('')
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  const plan = user?.plan === 'basic' ? 'basic' : 'free'
  const remaining = conversationService.remaining(plan, user?.id)
  const limit = conversationService.creditLimit(plan)
  const active = conversations.find((item) => item.id === activeId)
  const empty = (!active || active.messages.length === 0) && !sending
  const threadCount = (active?.messages.length ?? 0) + (stream ? 1 : 0)

  const refreshList = useCallback(() => {
    setConversations(conversationService.list())
  }, [])

  const startNew = useCallback(() => {
    abortRef.current?.abort()
    sendingRef.current = false
    setSending(false)
    setStream('')
    const conversation = conversationService.create()
    setConversations(conversationService.list())
    setActiveId(conversation.id)
    setDraft('')
    setPendingFiles([])
    setInstrument('EURUSD')
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        startNew()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startNew])

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const next = await tradingViewService.quotes()
        if (!stop && next.length) {
          setQuotes((current) => {
            const extras = current.filter((item) => !next.some((quote) => quote.symbol === item.symbol))
            return [...next, ...extras]
          })
        }
      } catch {
        // Keep the last tape. A failed fetch must not invent a price.
      }
    }
    void load()
    const id = window.setInterval(() => void load(), 20_000)
    return () => {
      stop = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [threadCount, sending])

  async function generateReply(
    conversationId: string,
    userMessage: { id?: string; content: string; attachments: AiAttachment[] },
    symbol?: string,
  ) {
    const key = userMessage.id ?? `${conversationId}:${userMessage.content}`
    if (answering.has(key) || sendingRef.current) return
    answering.add(key)
    sendingRef.current = true
    setSending(true)
    setStream('')
    setThinking('')
    streamRef.current = ''
    const abort = new AbortController()
    abortRef.current = abort
    try {
      const existing = conversationService.get(conversationId)
      const last = existing?.messages[existing.messages.length - 1]
      if (last?.role === 'assistant') return

      const mentioned = symbolsInText(userMessage.content, symbol ?? instrument)
      const have = new Set(quotesRef.current.map((item) => item.symbol))
      const missing = mentioned.filter((item) => !have.has(item))
      if (missing.length) {
        try {
          const extra = await Promise.race([
            tradingViewService.quotes(missing),
            new Promise<LiveQuote[]>((resolve) => window.setTimeout(() => resolve([]), 2500)),
          ])
          if (extra.length) {
            const merged = [...quotesRef.current]
            for (const quote of extra) {
              const index = merged.findIndex((item) => item.symbol === quote.symbol)
              if (index >= 0) merged[index] = quote
              else merged.push(quote)
            }
            quotesRef.current = merged
            setQuotes(merged)
          }
        } catch {
          // A failed lookup must not invent a price.
        }
      }

      let output = ''
      await aiService.askStream(
        {
          prompt: userMessage.content,
          instrument: symbol ?? instrument,
          attachments: userMessage.attachments,
          answerLength: 'standard',
          history: (existing?.messages ?? []).map((item) => ({ role: item.role, content: item.content })),
          liveQuotes: quotesRef.current,
        },
        (token) => {
          output += token
          streamRef.current = output
          setStream(output)
          if (output) setThinking('')
        },
        abort.signal,
        (thought) => {
          setThinking((current) => (current + thought).slice(-280))
        },
      )
      const latest = conversationService.get(conversationId)
      if (latest?.messages[latest.messages.length - 1]?.role === 'assistant') return
      if (!output.trim()) return
      conversationService.consume(user?.id)
      conversationService.appendMessage(conversationId, newMessage('assistant', output.trim()))
      refreshList()
    } catch (error) {
      answering.delete(key)
      if (!abort.signal.aborted) {
        push('error', 'Analysis failed', error instanceof Error ? error.message : 'Please try again.')
      }
    } finally {
      abortRef.current = null
      sendingRef.current = false
      setStream('')
      setThinking('')
      setSending(false)
    }
  }

  function stopGenerating() {
    abortRef.current?.abort()
    const partial = streamRef.current.trim()
    if (partial && activeId) {
      conversationService.appendMessage(activeId, newMessage('assistant', partial))
      conversationService.consume(user?.id)
      refreshList()
    }
    streamRef.current = ''
    sendingRef.current = false
    setSending(false)
    setStream('')
  }

  async function regenerate() {
    if (!activeId || sendingRef.current) return
    conversationService.popLast(activeId, 'assistant')
    const next = conversationService.get(activeId)
    const lastUser = [...(next?.messages ?? [])].reverse().find((item) => item.role === 'user')
    refreshList()
    if (lastUser) {
      answering.delete(lastUser.id)
      await generateReply(activeId, lastUser, next?.instrument)
    }
  }

  useEffect(() => {
    const last = active?.messages[active.messages.length - 1]
    if (!active || !last || last.role !== 'user' || sendingRef.current) return
    void generateReply(active.id, last, active.instrument)
    // Resume an unanswered user turn after a refresh or a dropped reply.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, active?.messages.length])

  async function fileToAttachment(file: File, kind?: AiAttachment['kind']): Promise<AiAttachment> {
    const dataUrl = await readFile(file)
    const resolved = kind ?? (file.type.startsWith('video/') ? 'video' : 'image')
    return { id: uid('att'), name: file.name, mime: file.type, dataUrl, kind: resolved }
  }

  async function addFiles(files: File[]) {
    const next: AiAttachment[] = []
    for (const file of files) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        next.push(await fileToAttachment(file))
      }
    }
    if (next.length) setPendingFiles((current) => [...current, ...next])
  }

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    await addFiles(Array.from(event.dataTransfer.files))
  }

  function captureFrame(source: CanvasImageSource, width: number, height: number) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(1280, width || 1280)
    canvas.height = Math.min(720, height || 720)
    const context = canvas.getContext('2d')
    if (!context) return null
    context.drawImage(source, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.72)
  }

  async function shareScreen() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      await new Promise((resolve) => window.setTimeout(resolve, 400))
      const frame = captureFrame(video, video.videoWidth, video.videoHeight)
      stream.getTracks().forEach((track) => track.stop())
      if (!frame) return
      setPendingFiles((current) => [
        ...current,
        { id: uid('att'), name: 'screen-frame.jpg', mime: 'image/jpeg', dataUrl: frame, kind: 'image' },
      ])
      push('success', 'Screen frame captured', 'Send the symbol, timeframe, and last price with this chart.')
    } catch {
      push('info', 'Screen share cancelled')
    }
  }

  async function sendPrompt(prompt: string, attachments = pendingFiles) {
    if (sendingRef.current) return
    if (remaining <= 0) {
      setCreditsOpen(true)
      return
    }
    const text = prompt.trim()
    if (!text && attachments.length === 0) return

    let conversation = active ?? conversationService.create()
    if (!active) setActiveId(conversation.id)

    const userMessage = newMessage(
      'user',
      text || 'Please review the attached media as an educational worksheet.',
      attachments,
    )
    const titled =
      conversation.messages.length === 0
        ? analysisTitle(text || 'Chart study', instrument)
        : conversation.title
    conversation = conversationService.appendMessage(conversation.id, userMessage, titled)
    conversationService.save({ ...conversation, instrument })
    setDraft('')
    setPendingFiles([])
    refreshList()
    await generateReply(conversation.id, userMessage, instrument)
  }

  function confirmBasic() {
    if (!user) {
      navigate('/register', { state: { from: '/engine' } })
      return
    }
    authService.updateProfile(user.id, { plan: 'basic' })
    refresh()
    setCreditsOpen(false)
    push('success', 'Basic plan is active', `Basic includes 200 questions and a free ${APP_SHORT_NAME} trading account.`)
  }

  function submit(event?: FormEvent, value?: string) {
    event?.preventDefault()
    void sendPrompt((value ?? draft).trim() ? (value ?? draft) : draft)
  }

  function listenVoice() {
    const Speech = (window as Window & { webkitSpeechRecognition?: new () => BrowserSpeechRecognition }).webkitSpeechRecognition
    if (!Speech) {
      push('info', 'Voice dictation is not available in this browser')
      return
    }
    const recognition = new Speech()
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript
      if (spoken) setDraft((current) => `${current} ${spoken}`.trim())
    }
    recognition.start()
  }

  return (
    <div className="atmosphere flex h-screen overflow-hidden bg-canvas text-ink">
      <Seo
        title="AI Engine"
        description={`${APP_NAME} AI Engine — educational chart and market-literacy assistant. Not investment advice.`}
      />
      <div className="hidden md:block">
        <EngineSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          conversations={conversations}
          activeId={activeId}
          query={query}
          onQuery={setQuery}
          onNew={startNew}
          onSelect={setActiveId}
          onDelete={(id) => {
            conversationService.remove(id)
            const next = conversationService.list()
            setConversations(next)
            if (activeId === id) setActiveId(next[0]?.id)
          }}
          remaining={remaining}
          limit={limit}
          plan={plan}
        />
      </div>

      {mobileNav ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close conversations" onClick={() => setMobileNav(false)} />
          <div className="relative h-full w-[272px]">
            <EngineSidebar
              collapsed={false}
              onToggle={() => setMobileNav(false)}
              conversations={conversations}
              activeId={activeId}
              query={query}
              onQuery={setQuery}
              onNew={() => {
                startNew()
                setMobileNav(false)
              }}
              onSelect={(id) => {
                setActiveId(id)
                setMobileNav(false)
              }}
              onDelete={(id) => {
                conversationService.remove(id)
                const next = conversationService.list()
                setConversations(next)
                if (activeId === id) setActiveId(next[0]?.id)
              }}
              remaining={remaining}
              limit={limit}
              plan={plan}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <button type="button" className="rounded-lg p-1.5 text-ink/80 hover:bg-baazex/8 md:hidden" onClick={() => setMobileNav(true)} aria-label="Open conversations">
              <Menu className="h-5 w-5" />
            </button>
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="truncate font-semibold text-ink">{active?.title ?? 'New analysis'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line px-3 py-1 text-[11px] text-muted">
              {plan === 'basic' ? `${remaining} of ${limit} on Basic` : `${remaining} of ${limit} free`}
            </span>
            <span className="rounded-full border border-bright/30 bg-bright/10 px-3 py-1 text-[11px] font-semibold text-accent">
              Live
            </span>
          </div>
        </header>

        <div
          ref={threadRef}
          className="relative min-h-0 flex-1 overflow-y-auto"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(900px 320px at 50% -10%, rgb(0 102 255 / 0.2), transparent 58%)' }}
          />
          {empty ? (
            <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-10 text-center sm:py-14">
              <div className="engine-orb mb-8 h-20 w-20 rounded-full" />
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                What are we <span className="text-accent">studying</span> today?
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
                Pick a symbol. The engine uses the live TradingView price for the entry, stop, and target.
              </p>
              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                <ActionCard icon={MonitorUp} title="Share my screen" text="Live read of your MT5 or TradingView chart" onClick={shareScreen} />
                <ActionCard icon={Camera} title="Upload a chart" text="Screenshot from any platform" onClick={() => fileRef.current?.click()} />
                <ActionCard icon={Clapperboard} title="Send a video" text="I sample frames across the clip" onClick={() => videoRef.current?.click()} />
                <ActionCard
                  icon={NotebookPen}
                  title="Today's brief"
                  text="Sessions, calendar risk and study focus"
                  onClick={() => void sendPrompt('Give me a directional call on EURUSD, XAUUSD, and US30 for H1 using the live TradingView prices in this message.')}
                />
              </div>
              <p className="mt-6 max-w-2xl text-[11px] leading-relaxed text-muted">{DISCLAIMER}</p>
            </div>
          ) : (
            <div className="relative mx-auto max-w-3xl space-y-6 px-4 py-8">
              {active?.messages.map((message, index) => (
                <article key={message.id} className={message.role === 'user' ? 'ml-4 sm:ml-10' : 'mr-2 sm:mr-6'}>
                  <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
                    {message.role === 'user' ? 'You' : ENGINE_NAME}
                  </p>
                  {message.attachments.map((attachment) =>
                    attachment.kind === 'image' ? (
                      <img key={attachment.id} src={attachment.dataUrl} alt={attachment.name} className="mb-3 max-h-56 rounded-2xl border border-line" />
                    ) : (
                      <p key={attachment.id} className="mb-3 text-xs text-muted">
                        Video attached: {attachment.name}
                      </p>
                    ),
                  )}
                  <div className="rounded-2xl border border-line bg-baazex/5 p-4">
                    {message.role === 'assistant' ? (
                      <EngineMarkdown text={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'assistant' && !sending ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted hover:bg-baazex/8 hover:text-accent"
                        onClick={() => {
                          void navigator.clipboard.writeText(message.content)
                          push('success', 'Copied')
                        }}
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                      {index === (active.messages.length - 1) ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted hover:bg-baazex/8 hover:text-accent"
                          onClick={() => void regenerate()}
                        >
                          <RefreshCw className="h-3 w-3" /> Regenerate
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
              {sending ? (
                <article className="mr-2 sm:mr-6">
                  <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-muted uppercase">{ENGINE_NAME}</p>
                  <div className="rounded-2xl border border-bright/20 bg-baazex/5 p-4">
                    {thinking && !stream ? (
                      <p className="mb-3 text-xs leading-5 text-muted italic">Thinking… {thinking.slice(-160)}</p>
                    ) : null}
                    <EngineMarkdown text={stream} caret />
                  </div>
                </article>
              ) : null}
              {!sending && active && active.messages.some((item) => item.role === 'assistant') ? (
                <div className="flex flex-wrap gap-2">
                  {['Explain that more simply', 'Give me an MT5 example', 'What should I study next?'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => void sendPrompt(item)}
                      className="rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:border-bright/40 hover:text-accent"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-line px-3 py-3 sm:px-4">
          <LiveMarket symbol={instrument ?? 'EURUSD'} quotes={quotes} onSelect={setInstrument} />
          <div className="mx-auto mb-3 flex max-w-3xl gap-1.5 overflow-x-auto pb-1">
            {instruments.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => {
                  setInstrument(item.symbol)
                  void sendPrompt(
                    `Give a directional call on ${item.symbol} (${item.name}) for H1 using the live TradingView price in this message.`,
                  )
                }}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${instrument === item.symbol ? 'border-bright bg-bright/15 text-accent' : 'border-line text-muted hover:text-accent'}`}
              >
                {item.symbol}
              </button>
            ))}
          </div>
          {pendingFiles.length ? (
            <div className="mx-auto mb-2 flex max-w-3xl gap-2 overflow-x-auto">
              {pendingFiles.map((file) => (
                <span key={file.id} className="rounded-lg bg-baazex/8 px-2 py-1 text-[11px] text-ink/80">
                  {file.name}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mx-auto max-w-3xl">
            <EngineComposer
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              onAttach={() => fileRef.current?.click()}
              onPasteFiles={(files) => void addFiles(files)}
              onScreen={shareScreen}
              onVoice={listenVoice}
              onStop={stopGenerating}
              disabled={false}
              sending={sending}
              hasAttachments={pendingFiles.length > 0}
            />
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted">
            Analysis only, not financial advice · {APP_NAME} · Learn · Understand · Practise
          </p>
        </div>
      </div>

      <EngineRail />

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={async (event) => {
          await addFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (file) {
            const attachment = await fileToAttachment(file, 'video')
            setPendingFiles((current) => [...current, attachment])
          }
          event.target.value = ''
        }}
      />

      <Modal
        open={creditsOpen}
        title={plan === 'basic' ? 'Your Basic questions are used up' : 'Basic plan — $30'}
        onClose={() => setCreditsOpen(false)}
      >
        {plan === 'basic' ? (
          <p className="text-sm text-muted">You have used the 200 questions included with Basic.</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              Five free questions are included. Basic is ${BASIC_PRICE} and adds 200 questions, plus a free {APP_SHORT_NAME} trading account.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="h-11 rounded-xl bg-baazex font-semibold text-ink" onClick={confirmBasic}>
                {user ? `Confirm Basic — $${BASIC_PRICE}` : 'Create an account to get Basic'}
              </button>
              {user ? null : (
                <button
                  type="button"
                  className="h-11 rounded-xl border border-line font-semibold"
                  onClick={() => navigate('/login', { state: { from: '/engine' } })}
                >
                  Sign in
                </button>
              )}
              <a
                href={COMPANY_URL}
                className="flex h-11 items-center justify-center rounded-xl border border-line text-sm font-semibold text-accent"
                target="_blank"
                rel="noreferrer"
              >
                Open a free {APP_SHORT_NAME} trading account
              </a>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

function LiveMarket({
  symbol,
  quotes,
  onSelect,
}: {
  symbol: string
  quotes: LiveQuote[]
  onSelect: (symbol: string) => void
}) {
  const active = quotes.find((item) => item.symbol === symbol)
  return (
    <div className="mx-auto mb-3 max-w-3xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">Live from TradingView</p>
        {active ? (
          <p className="text-sm font-bold text-ink">
            {symbol} {formatLiveQuote(symbol, active.close)}
            <span className={active.change >= 0 ? ' ml-1 text-success' : ' ml-1 text-danger'}>
              {active.change >= 0 ? '+' : ''}
              {active.change.toFixed(2)}%
            </span>
          </p>
        ) : (
          <p className="text-[11px] text-muted">Waiting for the live quote</p>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {instruments.map((item) => {
          const quote = quotes.find((row) => row.symbol === item.symbol)
          const selected = item.symbol === symbol
          return (
            <button
              key={item.symbol}
              type="button"
              title={tradingViewTicker(item.symbol)}
              onClick={() => onSelect(item.symbol)}
              className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-left ${selected ? 'border-bright bg-bright/15' : 'border-line hover:border-bright/40'}`}
            >
              <p className="text-[10px] font-bold text-muted">{item.symbol}</p>
              <p className="text-xs font-bold text-ink">{quote ? formatLiveQuote(item.symbol, quote.close) : '—'}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: typeof MonitorUp
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-line bg-baazex/5 p-4 text-left hover:border-bright/30 hover:bg-baazex/8">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-bright/15 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </button>
  )
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

interface BrowserSpeechRecognition {
  lang: string
  start: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
}

const answering = new Set<string>()
