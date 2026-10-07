import { readChartBuffer } from '../../server/chartLabel.js'

export const config = { runtime: 'nodejs', maxDuration: 60 }

export default async function handler(request: Request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  try {
    const body = (await request.json()) as { image?: string }
    const image = body.image ?? ''
    const base64 = image.includes(',') ? image.slice(image.indexOf(',') + 1) : image
    if (!base64) return Response.json({ symbol: null, timeframe: null, printedPrice: null })
    const label = await readChartBuffer(Buffer.from(base64, 'base64'))
    return Response.json({
      symbol: label.symbol ?? null,
      timeframe: label.timeframe ?? null,
      printedPrice: label.printedPrice ?? null,
    })
  } catch {
    return Response.json({ symbol: null, timeframe: null, printedPrice: null }, { status: 500 })
  }
}
