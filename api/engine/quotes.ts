import { fetchTradingViewQuotes } from '../../server/tradingViewQuotes.js'

export const config = { runtime: 'edge', maxDuration: 15 }

export default async function handler(request: Request) {
  try {
    const symbols = new URL(request.url).searchParams.get('symbols')
    const requested = symbols?.split(',').map((item) => item.trim()).filter(Boolean)
    const quotes = await fetchTradingViewQuotes(requested?.length ? requested : undefined)
    return new Response(JSON.stringify({ quotes }), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    })
  } catch {
    return new Response(JSON.stringify({ quotes: [] }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }
}
