export interface ChartRead {
  source: 'image' | 'video'
  width: number
  height: number
  frames: number
  slope: 'higher to the right' | 'lower to the right' | 'overlapping / mixed'
  colourBias: 'more green than red' | 'more red than green' | 'mixed colours'
  greenShare: number
  redShare: number
  note: string
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read the image.'))
    image.src = src
  })
}

function loadVideo(src: string) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = src
    video.onloadeddata = () => resolve(video)
    video.onerror = () => reject(new Error('Could not read the video.'))
  })
}

function sampleCanvas(source: CanvasImageSource, sourceWidth: number, sourceHeight: number): Omit<ChartRead, 'source' | 'frames' | 'note'> | null {
  const width = 160
  const height = Math.max(36, Math.round((sourceHeight / Math.max(sourceWidth, 1)) * width))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(source, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data

  let green = 0
  let red = 0
  const path: number[] = []
  const top = Math.floor(height * 0.12)
  const bottom = Math.floor(height * 0.82)

  for (let x = 6; x < width - 6; x += 1) {
    let bestY = -1
    let bestScore = 18
    for (let y = top; y < bottom; y += 1) {
      const index = (y * width + x) * 4
      const r = pixels[index] ?? 0
      const g = pixels[index + 1] ?? 0
      const b = pixels[index + 2] ?? 0
      const a = pixels[index + 3] ?? 0
      if (a < 80) continue
      const isGreen = g > r + 28 && g > 70 && g > b
      const isRed = r > g + 28 && r > 70 && r > b
      if (isGreen) green += 1
      if (isRed) red += 1
      const score = isGreen || isRed ? Math.max(r, g) - Math.min(r, g, b) : 0
      if (score > bestScore) {
        bestScore = score
        bestY = y
      }
    }
    if (bestY >= 0) path.push(bestY)
  }

  const left = path.slice(0, Math.max(1, Math.floor(path.length / 3)))
  const right = path.slice(Math.floor((path.length * 2) / 3))
  const avg = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0)
  const leftY = avg(left)
  const rightY = avg(right)
  const delta = leftY - rightY
  const slope =
    delta > 6 ? 'higher to the right' : delta < -6 ? 'lower to the right' : 'overlapping / mixed'
  const total = Math.max(1, green + red)
  const colourBias =
    green / total > 0.58 ? 'more green than red' : red / total > 0.58 ? 'more red than green' : 'mixed colours'

  return {
    width: sourceWidth,
    height: sourceHeight,
    slope,
    colourBias,
    greenShare: green / total,
    redShare: red / total,
  }
}

export async function readChartImage(dataUrl: string): Promise<ChartRead | null> {
  try {
    const image = await loadImage(dataUrl)
    const sample = sampleCanvas(image, image.naturalWidth || image.width, image.naturalHeight || image.height)
    if (!sample) return null
    return {
      ...sample,
      source: 'image',
      frames: 1,
      note: describeRead(sample.slope, sample.colourBias, 1),
    }
  } catch {
    return null
  }
}

export async function readVideoFrames(dataUrl: string): Promise<ChartRead | null> {
  try {
    const video = await loadVideo(dataUrl)
    await video.play().catch(() => undefined)
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1
    const marks = [0.18, 0.5, 0.82]
    const slopes: Array<ChartRead['slope']> = []
    let lastSample: ReturnType<typeof sampleCanvas> = null
    for (const mark of marks) {
      await seek(video, mark * duration)
      const sample = sampleCanvas(video, video.videoWidth || 1280, video.videoHeight || 720)
      if (sample) {
        lastSample = sample
        slopes.push(sample.slope)
      }
    }
    video.pause()
    if (!lastSample) return null
    const slope = majoritySlope(slopes) ?? lastSample.slope
    return {
      ...lastSample,
      slope,
      source: 'video',
      frames: slopes.length || 1,
      note: describeRead(slope, lastSample.colourBias, slopes.length || 1),
    }
  } catch {
    return null
  }
}

function seek(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      video.removeEventListener('seeked', done)
      resolve()
    }
    video.addEventListener('seeked', done)
    video.currentTime = Math.min(Math.max(0.01, time), Math.max(0.05, (video.duration || 1) - 0.05))
  })
}

function majoritySlope(values: Array<ChartRead['slope']>) {
  if (!values.length) return undefined
  const counts = new Map<ChartRead['slope'], number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

function describeRead(slope: ChartRead['slope'], colour: ChartRead['colourBias'], frames: number) {
  const frameText = frames > 1 ? `I sampled ${frames} frames across the clip. ` : ''
  return `${frameText}In this picture, the visible series looks ${slope}, with ${colour}. That is a description of the pixels on screen, not a forecast of the next candle.`
}

export async function inspectAttachments(
  attachments: Array<{ kind: 'image' | 'video'; dataUrl: string }>,
): Promise<ChartRead[]> {
  const reads: ChartRead[] = []
  for (const item of attachments) {
    const read = item.kind === 'video' ? await readVideoFrames(item.dataUrl) : await readChartImage(item.dataUrl)
    if (read) reads.push(read)
  }
  return reads
}
