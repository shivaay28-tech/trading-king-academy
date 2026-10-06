import { useEffect, useRef } from 'react'

export function TradingViewChart({ ticker }: { ticker: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.replaceChildren()
    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    widget.style.height = '100%'
    widget.style.width = '100%'
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.type = 'text/javascript'
    script.text = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      support_host: 'https://www.tradingview.com',
    })
    host.append(widget, script)
    return () => {
      host.replaceChildren()
    }
  }, [ticker])

  return <div ref={hostRef} className="tradingview-widget-container h-full w-full" />
}
