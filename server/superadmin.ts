import { parseSettings, requireSuperadmin, saveSettingsEverywhere } from './billing.js'

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export async function handleSuperadminSettings(request: Request) {
  if (request.method !== 'POST') return json(405, { error: 'Use POST.' })
  try {
    await requireSuperadmin(request)
    const settings = parseSettings(await request.json())
    const saved = await saveSettingsEverywhere(settings)
    return json(200, { ok: true, academies: saved })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save payment details.'
    const status = message.includes('superadmin') || message.includes('Sign in') ? 403 : 400
    return json(status, { error: message })
  }
}

export async function handleSuperadminRequests(request: Request) {
  if (request.method !== 'GET') return json(405, { error: 'Use GET.' })
  try {
    await requireSuperadmin(request)
    const { listPending } = await import('./billing.js')
    return json(200, { requests: await listPending() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load payment requests.'
    const status = message.includes('superadmin') || message.includes('Sign in') ? 403 : 400
    return json(status, { error: message })
  }
}

export async function handleSuperadminApprove(request: Request) {
  if (request.method !== 'POST') return json(405, { error: 'Use POST.' })
  try {
    await requireSuperadmin(request)
    const body = (await request.json()) as { academyId?: string; requestId?: string }
    if (!body.academyId || !body.requestId) return json(400, { error: 'Missing academy or request.' })
    const { approveRequest } = await import('./billing.js')
    await approveRequest(body.academyId, body.requestId)
    return json(200, { ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not approve this payment.'
    const status = message.includes('superadmin') || message.includes('Sign in') ? 403 : 400
    return json(status, { error: message })
  }
}
