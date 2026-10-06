import { Logo } from '@/components/ui/Logo'
import { Disclaimer } from '@/components/ui/Disclaimer'
import { APP_NAME } from '@/utils/constants'
import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="atmosphere min-h-screen overflow-x-hidden">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden border-r border-bright/15 gradient-hero lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div className="grid-fade absolute inset-0" />
          <Link to="/" className="relative">
            <Logo light />
          </Link>
          <div className="relative max-w-md">
            <p className="text-sm font-semibold tracking-[0.2em] text-ink uppercase">Education only</p>
            <h1 className="mt-3 text-4xl font-extrabold text-ink">Build market knowledge before you act.</h1>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">
              Create a {APP_NAME} account to enrol in structured courses on forex, CFDs, analysis, risk, and MetaTrader 5.
            </p>
          </div>
          <Disclaimer className="relative text-ink/40" compact />
        </div>
        <div className="flex flex-col px-4 py-8 sm:px-8">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <div className="glass rounded-3xl p-6 sm:p-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
