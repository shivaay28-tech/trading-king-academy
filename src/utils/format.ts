export function formatMinutes(total: number) {
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDateLong(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function analysisTitle(prompt: string, instrument?: string) {
  const text = prompt.replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()
  if ((lower.includes('today') && (lower.includes('brief') || lower.includes('session'))) || lower.includes('watchlist')) {
    return "Today's brief"
  }
  if (lower.includes('chart') || lower.includes('screenshot') || lower.includes('screen')) {
    return instrument ? `${instrument} chart study` : 'Chart study'
  }
  if (instrument && text.length < 12) return `${instrument} study`
  const first = (text.split(/[.?!]/)[0] ?? text).trim()
  if (first.length <= 42) return first || instrument || 'New analysis'
  return `${first.slice(0, 40).replace(/\s+\S*$/, '')}…`
}
