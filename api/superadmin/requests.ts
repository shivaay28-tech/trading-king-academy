import { handleSuperadminRequests } from '../../server/superadmin.js'

export const config = { runtime: 'nodejs' }

function header(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function handler(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
  },
  res: {
    statusCode: number
    setHeader: (key: string, value: string) => void
    end: (body?: string) => void
  },
) {
  const request = new Request('http://local/api/superadmin/requests', {
    method: req.method ?? 'GET',
    headers: { authorization: header(req.headers.authorization) },
  })
  const response = await handleSuperadminRequests(request)
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  res.end(await response.text())
}
