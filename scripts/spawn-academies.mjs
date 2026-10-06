import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const outRoot = path.join(root, '.academy-copies')

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
  colors: {
    navy: '#06152B',
    baazex: '#0066FF',
    bright: '#00A3FF',
    canvas: '#F4F8FC',
    ink: '#172033',
  },
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
