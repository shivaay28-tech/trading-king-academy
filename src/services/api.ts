import { APP_NAME } from '@/utils/constants'

const env = import.meta.env

export const apiConfig = {
  baseUrl: (env.VITE_API_BASE_URL as string | undefined) ?? '',
  timeoutMs: Number(env.VITE_API_TIMEOUT_MS ?? 15000),
  appName: (env.VITE_APP_NAME as string | undefined) ?? APP_NAME,
}

/**
 * Thin fetch wrapper for a future REST API.
 * The mock services call localStorage today and can be swapped to `apiRequest`.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!apiConfig.baseUrl) {
    throw new Error('API base URL is not configured. Using the local mock instead.')
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), apiConfig.timeoutMs)

  try {
    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`)
    }

    return (await response.json()) as T
  } finally {
    window.clearTimeout(timer)
  }
}
