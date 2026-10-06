import { handleSuperadminSettings } from '../../server/superadmin.js'

export const config = { runtime: 'nodejs' }

function header(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function handler(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    body?: unknown
  },
  res: {
    statusCode: number
    setHeader: (key: string, value: string) => void
    end: (body?: string) => void
  },
) {
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
  const request = new Request('http://local/api/superadmin/settings', {
    method: req.method ?? 'POST',
    headers: {
      'content-type': header(req.headers['content-type']) || 'application/json',
      authorization: header(req.headers.authorization),
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : raw || undefined,
  })
  const response = await handleSuperadminSettings(request)
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  res.end(await response.text())
}
