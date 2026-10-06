import { BRAND } from '@/assets/brand'

const tokenNames = {
  navy: '--color-navy',
  navy800: '--color-navy-800',
  navy700: '--color-navy-700',
  navy600: '--color-navy-600',
  baazex: '--color-baazex',
  baazex600: '--color-baazex-600',
  bright: '--color-bright',
  accent: '--color-accent',
  ink: '--color-ink',
  muted: '--color-muted',
  canvas: '--color-canvas',
  line: '--color-line',
  onButton: '--color-on-button',
  glow: '--glow',
} as const

export function applyBrandTheme() {
  const root = document.documentElement
  for (const [key, cssName] of Object.entries(tokenNames)) {
    root.style.setProperty(cssName, BRAND.colors[key as keyof typeof tokenNames])
  }
}
