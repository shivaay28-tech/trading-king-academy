import { Seo } from '@/components/Seo'
import { APP_NAME } from '@/utils/constants'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <Seo title="Page not found" description={`The requested ${APP_NAME} page does not exist.`} />
      <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">404</p>
      <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">This page is not on the curriculum</h1>
      <p className="mt-3 text-sm text-muted">The link may be incorrect, or the course may have been unpublished.</p>
          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/">
          <Button className="w-full sm:w-auto">Go home</Button>
        </Link>
        <Link to="/courses">
          <Button className="w-full sm:w-auto" variant="secondary">Browse courses</Button>
        </Link>
      </div>
    </div>
  )
}
