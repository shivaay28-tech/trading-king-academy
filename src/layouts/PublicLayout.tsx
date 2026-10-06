import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="atmosphere flex min-h-dvh flex-col overflow-x-clip">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
