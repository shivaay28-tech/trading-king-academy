import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const outRoot = path.join(root, '.academy-copies')

const ice = {
  navy: '#a9dfff',
  navy800: '#8ed4ff',
  navy700: '#6ec6ff',
  navy600: '#d4f0ff',
  baazex: '#5eb8f5',
  baazex600: '#3aa6ef',
  bright: '#7ed0ff',
  accent: '#1468b8',
  ink: '#0a1f44',
  muted: '#5a7194',
  canvas: '#f5f9ff',
  line: '#c9daf2',
  onButton: '#0a1f44',
  glow: '94 184 245',
}

const academies = [
  {
    repo: 'trading-king-academy',
    name: 'Trading King Academy',
    shortName: 'Trading King',
    engineName: 'Trading King Engine',
    company: 'Trading King Academy',
    url: 'https://www.tradingkingacademy.com',
    host: 'tradingkingacademy.com',
    storagePrefix: 'tradingking.academy',
    colors: {
      navy: '#f3e6c4',
      navy800: '#e8d4a0',
      navy700: '#d4bc78',
      navy600: '#f8f0dc',
      baazex: '#c4a35a',
      baazex600: '#a8863a',
      bright: '#e8c872',
      accent: '#8a6a1f',
      ink: '#1c1408',
      muted: '#7a6848',
      canvas: '#fbf7ef',
      line: '#e6d7b8',
      onButton: '#1c1408',
      glow: '196 163 90',
    },
  },
  {
    repo: 'nextgen-fx-academy',
    name: 'NextGen FX Academy',
    shortName: 'NextGen FX',
    engineName: 'NextGen FX Engine',
    company: 'NextGen FX Academy',
    url: 'https://www.nextgenfxacadmey.com',
    host: 'nextgenfxacadmey.com',
    storagePrefix: 'nextgenfx.academy',
    colors: ice,
  },
  {
    repo: 'trade-rise-academy',
    name: 'Trade Rise Academy',
    shortName: 'Trade Rise',
    engineName: 'Trade Rise Engine',
    company: 'Trade Rise Academy',
    url: 'https://www.traderiseacademy.com',
    host: 'traderiseacademy.com',
    storagePrefix: 'traderise.academy',
    colors: {
      navy: '#c8f0dc',
      navy800: '#a3e4c6',
      navy700: '#74d4a8',
      navy600: '#e5f8ef',
      baazex: '#1f9d62',
      baazex600: '#167a4c',
      bright: '#5dcc96',
      accent: '#0d6b42',
      ink: '#06281a',
      muted: '#4d6b5c',
      canvas: '#f3fbf7',
      line: '#c5e6d4',
      onButton: '#ffffff',
      glow: '31 157 98',
    },
  },
  {
    repo: 'tradesx-academy',
    name: 'TradesX Academy',
    shortName: 'TradesX',
    engineName: 'TradesX Engine',
    company: 'TradesX Academy',
    url: 'https://www.tradesxacademy.com',
    host: 'tradesxacademy.com',
    storagePrefix: 'tradesx.academy',
    colors: {
      navy: '#ddd4ff',
      navy800: '#c8b8ff',
      navy700: '#b09bff',
      navy600: '#efeaff',
      baazex: '#6d4aff',
      baazex600: '#5534e0',
      bright: '#a78bfa',
      accent: '#4c1d95',
      ink: '#1a1033',
      muted: '#6b6284',
      canvas: '#f7f5ff',
      line: '#ddd6f5',
      onButton: '#ffffff',
      glow: '109 74 255',
    },
  },
  {
    repo: 'fx-nova-academy',
    name: 'FX Nova Academy',
    shortName: 'FX Nova',
    engineName: 'FX Nova Engine',
    company: 'FX Nova Academy',
    url: 'https://www.fxnovaacademy.com',
    host: 'fxnovaacademy.com',
    storagePrefix: 'fxnova.academy',
    colors: {
      navy: '#ffd8c2',
      navy800: '#ffc4a3',
      navy700: '#ffab80',
      navy600: '#fff0e8',
      baazex: '#e85d2a',
      baazex600: '#c4471a',
      bright: '#ff8a4c',
      accent: '#9a3412',
      ink: '#2a1208',
      muted: '#8a6558',
      canvas: '#fff7f3',
      line: '#f3d5c6',
      onButton: '#ffffff',
      glow: '232 93 42',
    },
  },
]

function brandFile(academy) {
  const emailHost = academy.host
  return `export const BRAND = {
  id: '${academy.repo}',
  name: '${academy.name}',
  shortName: '${academy.shortName}',
  engineName: '${academy.engineName}',
  company: '${academy.company}',
  url: '${academy.url}',
  host: '${academy.host}',
  storagePrefix: '${academy.storagePrefix}',
  demoStudentEmail: 'student@${emailHost}',
  demoAdminEmail: 'admin@${emailHost}',
  colors: ${JSON.stringify(academy.colors, null, 4).replace(/\n/g, '\n  ')},
} as const

export type Brand = typeof BRAND
`
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`)
  }
}

await mkdir(outRoot, { recursive: true })

for (const academy of academies) {
  const dest = path.join(outRoot, academy.repo)
  console.log(`\n=== Copy ${academy.name} ===`)
  run('rsync', [
    '-a',
    '--delete',
    '--exclude', 'node_modules',
    '--exclude', 'dist',
    '--exclude', '.git',
    '--exclude', '.vercel',
    '--exclude', '.academy-copies',
    '--exclude', '.cursor',
    `${root}/`,
    `${dest}/`,
  ])
  await writeFile(path.join(dest, 'server/brand.ts'), brandFile(academy))
  const pkgPath = path.join(dest, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
  pkg.name = academy.repo
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  const readmePath = path.join(dest, 'README.md')
  if (existsSync(readmePath)) {
    const readme = await readFile(readmePath, 'utf8')
    await writeFile(
      readmePath,
      readme
        .replaceAll('Baazex Academy', academy.name)
        .replaceAll('Baazex Financial Services L.L.C', academy.company)
        .replaceAll('https://baazex-academy.vercel.app/', academy.url)
        .replaceAll('student@baazex.com', `student@${academy.host}`)
        .replaceAll('admin@baazex.com', `admin@${academy.host}`),
    )
  }
  const envPath = path.join(dest, '.env.example')
  if (existsSync(envPath)) {
    const env = await readFile(envPath, 'utf8')
    await writeFile(
      envPath,
      env
        .replaceAll('Baazex Academy', academy.name)
        .replaceAll('Baazex Financial Services L.L.C', academy.company)
        .replaceAll('https://www.baazex.com', academy.url)
        .replaceAll('https://api.baazex.com/academy/v1', `${academy.url}/academy/v1`),
    )
  }
}
