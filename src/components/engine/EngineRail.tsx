import { APP_SHORT_NAME, COMPANY_HOST, COMPANY_URL, DISCLAIMER } from '@/utils/constants'
import { MonitorSmartphone, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export function EngineRail() {
  return (
    <aside className="hidden h-full w-[260px] shrink-0 flex-col overflow-y-auto border-l border-baazex/15 bg-white p-4 lg:flex">
      <p className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">Academy</p>
      <div className="panel mt-3 rounded-2xl p-4">
        <p className="text-lg font-extrabold text-ink">
          A directional call from the live TradingView price.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Bias, entry, stop, and target use the live TradingView close. Results are not guaranteed. Basic is $30 after 5 free questions and includes a free {APP_SHORT_NAME} trading account.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold text-accent">11</p>
            <p className="text-[10px] text-muted">Courses</p>
          </div>
          <div>
            <p className="text-sm font-bold text-accent">70%</p>
            <p className="text-[10px] text-muted">Pass mark</p>
          </div>
          <div>
            <p className="text-sm font-bold text-accent">MT5</p>
            <p className="text-[10px] text-muted">Platform</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-ink">
          <li className="flex gap-2"><Shield className="mt-0.5 h-4 w-4 text-accent" /> Results are not guaranteed</li>
          <li className="flex gap-2"><MonitorSmartphone className="mt-0.5 h-4 w-4 text-accent" /> Chart and video study tools</li>
        </ul>
        <Link to="/courses" className="mt-5 flex h-11 items-center justify-center rounded-xl bg-baazex text-sm font-bold text-on-button hover:bg-baazex-600">
          Open courses
        </Link>
        <a href={COMPANY_URL} className="mt-2 flex h-10 items-center justify-center text-xs font-semibold text-muted hover:text-accent">
          Visit {COMPANY_HOST}
        </a>
        <p className="mt-4 text-[11px] leading-relaxed text-muted">{DISCLAIMER}</p>
      </div>
    </aside>
  )
}
