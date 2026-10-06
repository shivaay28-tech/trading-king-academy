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
    navy: '#06152B',
    baazex: '#0066FF',
    bright: '#00A3FF',
    canvas: '#F4F8FC',
    ink: '#172033',
  },
} as const

export type Brand = typeof BRAND
