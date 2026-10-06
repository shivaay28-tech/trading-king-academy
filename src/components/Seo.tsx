import { useEffect } from 'react'
import { APP_NAME } from '@/utils/constants'

export function Seo({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} | ${APP_NAME}`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
  }, [title, description])

  return null
}
