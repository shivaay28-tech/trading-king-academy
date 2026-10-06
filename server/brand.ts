export const BRAND = {
  id: 'trading-king-academy',
  name: 'Trading King Academy',
  shortName: 'Trading King',
  engineName: 'Trading King Engine',
  company: 'Trading King Academy',
  url: 'https://www.tradingkingacademy.com',
  host: 'tradingkingacademy.com',
  storagePrefix: 'tradingking.academy',
  demoStudentEmail: 'student@tradingkingacademy.com',
  demoAdminEmail: 'admin@tradingkingacademy.com',
  colors: {
      "navy": "#f3e6c4",
      "navy800": "#e8d4a0",
      "navy700": "#d4bc78",
      "navy600": "#f8f0dc",
      "baazex": "#c4a35a",
      "baazex600": "#a8863a",
      "bright": "#e8c872",
      "accent": "#8a6a1f",
      "ink": "#1c1408",
      "muted": "#7a6848",
      "canvas": "#fbf7ef",
      "line": "#e6d7b8",
      "onButton": "#1c1408",
      "glow": "196 163 90"
  },
} as const

export type Brand = typeof BRAND
