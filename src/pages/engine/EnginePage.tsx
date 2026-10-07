import { Seo } from '@/components/Seo'
import { EngineComposer } from '@/components/engine/EngineComposer'
import { BasicCheckout } from '@/components/engine/BasicCheckout'
import { EngineMarkdown } from '@/components/engine/EngineMarkdown'
import { EngineRail } from '@/components/engine/EngineRail'
import { EngineSidebar } from '@/components/engine/EngineSidebar'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { instruments } from '@/data/instruments'
import { symbolsInText, tradingViewTicker } from '@/data/tradingView'
import { aiService } from '@/services/ai'
import { conversationService, newMessage } from '@/services/conversations'
import { formatLiveQuote, tradingViewService, type LiveQuote } from '@/services/tradingView'
import type { AiAttachment, AiConversation } from '@/types'
import { APP_NAME, DISCLAIMER, ENGINE_NAME } from '@/utils/constants'
import { analysisTitle, uid } from '@/utils/format'
import { Camera, Clapperboard, Copy, Menu, MonitorUp, NotebookPen, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'

export function EnginePage() {
  const { user } = useAuth()
  const { push } = useToast()
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
  const screenStreamRef = useRef<MediaStream | null>(null)
  const screenCaptureRef = useRef<HTMLVideoElement>(null)
  const screenPreviewRef = useRef<HTMLVideoElement>(null)
  const screenPopupRef = useRef<Window | null>(null)
  const [sharingScreen, setSharingScreen] = useState(false)
  const [analysisPopup, setAnalysisPopup] = useState(false)

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

  useEffect(() => {
    return () => {
      screenPopupRef.current?.close()
      screenPopupRef.current = null
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }
  }, [])

  useEffect(() => {
    const display = screenStreamRef.current
    if (!sharingScreen || !display) return
    for (const video of [screenCaptureRef.current, screenPreviewRef.current]) {
      if (!video) continue
      video.srcObject = display
      void video.play().catch(() => undefined)
    }
  }, [sharingScreen, analysisPopup])

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

      const namedInText = symbolsInText(userMessage.content)
      const hasChartImage = userMessage.attachments.some((item) => item.kind === 'image')
      const chartSetsSymbol = hasChartImage && namedInText.length === 0
      const mentioned = hasChartImage ? namedInText : symbolsInText(userMessage.content, symbol ?? instrument)
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
          instrument: chartSetsSymbol ? undefined : hasChartImage ? namedInText[0] : symbol ?? instrument,
          attachments: userMessage.attachments,
          answerLength: 'standard',
          history: (existing?.messages ?? []).map((item) => ({ role: item.role, content: item.content })),
          liveQuotes: chartSetsSymbol
            ? []
            : hasChartImage
              ? quotesRef.current.filter((item) => namedInText.includes(item.symbol))
              : quotesRef.current,
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
      await conversationService.consume(user?.id)
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
      void conversationService.consume(user?.id)
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

  function closeAnalysisPopup() {
    const popup = screenPopupRef.current
    screenPopupRef.current = null
    setAnalysisPopup(false)
    if (popup && !popup.closed) popup.close()
  }

  function stopScreenShare() {
    closeAnalysisPopup()
    const display = screenStreamRef.current
    screenStreamRef.current = null
    setSharingScreen(false)
    display?.getTracks().forEach((track) => track.stop())
  }

  function fillAnalysisPopup(popup: Window, display: MediaStream) {
    const doc = popup.document
    doc.title = 'Start analysis'
    doc.body.replaceChildren()
    doc.body.style.margin = '0'
    doc.body.style.background = '#f7f4ee'
    doc.body.style.color = '#1c1408'
    doc.body.style.fontFamily = 'Inter, system-ui, sans-serif'
    const wrap = doc.createElement('div')
    wrap.style.padding = '12px'
    const video = doc.createElement('video')
    video.srcObject = display
    video.muted = true
    video.autoplay = true
    video.playsInline = true
    video.style.display = 'block'
    video.style.width = '100%'
    video.style.height = '160px'
    video.style.objectFit = 'contain'
    video.style.borderRadius = '12px'
    video.style.background = '#1c1408'
    const note = doc.createElement('p')
    note.textContent = 'Switch to the one screen you want, then start the analysis. Only that shared screen is read.'
    note.style.margin = '10px 0'
    note.style.fontSize = '13px'
    note.style.lineHeight = '1.4'
    const row = doc.createElement('div')
    row.style.display = 'flex'
    row.style.gap = '8px'
    const start = doc.createElement('button')
    start.type = 'button'
    start.textContent = 'Start analysis'
    start.style.flex = '1'
    start.style.height = '40px'
    start.style.border = '0'
    start.style.borderRadius = '12px'
    start.style.background = '#c4a35a'
    start.style.color = '#1c1408'
    start.style.fontWeight = '700'
    start.onclick = () => {
      void startScreenAnalysis()
    }
    const cancel = doc.createElement('button')
    cancel.type = 'button'
    cancel.textContent = 'Cancel'
    cancel.style.height = '40px'
    cancel.style.padding = '0 14px'
    cancel.style.borderRadius = '12px'
    cancel.style.border = '1px solid #e6d7b8'
    cancel.style.background = '#fff'
    cancel.style.fontWeight = '700'
    cancel.onclick = () => stopScreenShare()
    row.append(start, cancel)
    wrap.append(video, note, row)
    doc.body.append(wrap)
    void video.play().catch(() => undefined)
    popup.addEventListener('pagehide', () => {
      if (screenPopupRef.current !== popup) return
      screenPopupRef.current = null
      setAnalysisPopup(false)
      const current = screenStreamRef.current
      screenStreamRef.current = null
      setSharingScreen(false)
      current?.getTracks().forEach((track) => track.stop())
    })
  }

  async function openAnalysisPopup(display: MediaStream) {
    const picture = (window as Window & {
      documentPictureInPicture?: { requestWindow: (options?: { width?: number; height?: number }) => Promise<Window> }
    }).documentPictureInPicture
    try {
      const popup = picture
        ? await picture.requestWindow({ width: 380, height: 320 })
        : window.open('', 'screen-analysis', 'popup=yes,width=380,height=340')
      if (!popup) return false
      screenPopupRef.current = popup
      fillAnalysisPopup(popup, display)
      popup.focus()
      setAnalysisPopup(true)
      return true
    } catch {
      return false
    }
  }

  async function shareScreen() {
    try {
      stopScreenShare()
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'include',
        monitorTypeSurfaces: 'include',
      } as DisplayMediaStreamOptions)
      display.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (screenStreamRef.current !== display) return
          closeAnalysisPopup()
          screenStreamRef.current = null
          setSharingScreen(false)
        })
      })
      screenStreamRef.current = display
      setSharingScreen(true)
      const opened = await openAnalysisPopup(display)
      if (!opened) push('info', 'Analysis popup was blocked', 'Use Start analysis on this page after you open the chart.')
    } catch {
      push('info', 'Screen share cancelled')
    }
  }

  async function startScreenAnalysis() {
    const display = screenStreamRef.current
    const video = screenCaptureRef.current
    if (!display || !video) return
    if (remaining <= 0) {
      window.focus()
      setCreditsOpen(true)
      return
    }
    if (video.srcObject !== display) {
      video.srcObject = display
      await video.play().catch(() => undefined)
    }
    if (video.videoWidth === 0) {
      await new Promise((resolve) => {
        video.onloadeddata = () => resolve(undefined)
        window.setTimeout(resolve, 800)
      })
    }
    closeAnalysisPopup()
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    const frame = captureFrame(video, video.videoWidth, video.videoHeight)
    stopScreenShare()
    if (!frame) {
      push('info', 'Could not read the shared screen')
      return
    }
    const attachment: AiAttachment = {
      id: uid('att'),
      name: 'screen-frame.jpg',
      mime: 'image/jpeg',
      dataUrl: frame,
      kind: 'image',
    }
    const prompt =
      draft.trim() ||
      'Read this shared chart.'
    await sendPrompt(prompt, [attachment])
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
    <div className="atmosphere flex h-dvh max-w-full overflow-hidden bg-canvas text-ink">
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
        <header className="flex min-w-0 items-center justify-between gap-2 border-b border-line px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink/80 hover:bg-baazex/8 md:hidden" onClick={() => setMobileNav(true)} aria-label="Open conversations">
              <Menu className="h-5 w-5" />
            </button>
            <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
            <span className="truncate font-semibold text-ink">{active?.title ?? 'New analysis'}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="rounded-full border border-line px-2 py-1 text-[10px] text-muted sm:px-3 sm:text-[11px]">
              {plan === 'basic' ? `${remaining}/${limit}` : `${remaining} free`}
            </span>
            <span className="rounded-full border border-bright/30 bg-bright/10 px-2 py-1 text-[10px] font-semibold text-accent sm:px-3 sm:text-[11px]">
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
            style={{ background: 'radial-gradient(900px 320px at 50% -10%, rgb(var(--glow) / 0.2), transparent 58%)' }}
          />
          {empty ? (
            <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-6 text-center sm:py-14">
              <div className="engine-orb mb-5 h-14 w-14 rounded-full sm:mb-8 sm:h-20 sm:w-20" />
              <h1 className="text-[1.65rem] leading-tight font-extrabold tracking-tight sm:text-5xl">
                What are we <span className="text-accent">studying</span> today?
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:mt-4">
                Pick a symbol. The engine uses the live TradingView price for the entry, stop, and target.
              </p>
              <div className="mt-6 grid w-full grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3">
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
              <p className="mt-6 hidden max-w-2xl text-[11px] leading-relaxed text-muted sm:block">{DISCLAIMER}</p>
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
                      <img key={attachment.id} src={attachment.dataUrl} alt={attachment.name} className="mb-3 max-h-56 w-full max-w-full rounded-2xl border border-line object-contain" />
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

        <div className="border-t border-line px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3">
          <LiveMarket symbol={instrument ?? 'EURUSD'} quotes={quotes} onSelect={setInstrument} />
          <div className="mx-auto mb-3 hidden max-w-3xl gap-1.5 overflow-x-auto pb-1 sm:flex">
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
          <video ref={screenCaptureRef} muted playsInline autoPlay className="pointer-events-none fixed h-px w-px opacity-0" />
          {sharingScreen && !analysisPopup ? (
            <div className="mx-auto mb-3 flex max-w-3xl flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3">
              <video
                ref={screenPreviewRef}
                muted
                playsInline
                autoPlay
                className="h-16 w-28 shrink-0 rounded-lg bg-ink/5 object-contain"
              />
              <div className="min-w-[10rem] flex-1">
                <p className="text-sm font-semibold text-ink">Sharing your screen</p>
                <p className="text-xs text-muted">Open the chart you want to share, then start the analysis.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void startScreenAnalysis()}
                  disabled={sending}
                  className="h-10 shrink-0 rounded-xl bg-baazex px-3 text-sm font-semibold text-on-button disabled:opacity-60"
                >
                  Start analysis
                </button>
                <button
                  type="button"
                  onClick={stopScreenShare}
                  className="h-10 shrink-0 rounded-xl border border-line px-3 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
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
          <p className="mx-auto mt-2 hidden max-w-3xl text-center text-[11px] text-muted sm:block">
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
        title={plan === 'basic' ? 'Your Basic questions are used up' : 'Basic plan'}
        onClose={() => setCreditsOpen(false)}
      >
        {plan === 'basic' ? (
          <p className="text-sm text-muted">You have used the 200 questions included with Basic.</p>
        ) : (
          <BasicCheckout open={creditsOpen} />
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
    <button type="button" onClick={onClick} className="rounded-2xl border border-line bg-baazex/5 p-3 text-left hover:border-bright/30 hover:bg-baazex/8 sm:p-4">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-bright/15 text-accent sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <p className="mt-2 text-sm font-bold sm:mt-3 sm:text-base">{title}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{text}</p>
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
