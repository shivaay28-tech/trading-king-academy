import { handleAdminUsers } from './adminUsers.js'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function adapt(req: IncomingMessage, res: ServerResponse) {
  const raw = await readBody(req)
  const request = new Request('http://local/api/admin/users', {
    method: req.method ?? 'POST',
    headers: {
      'content-type': req.headers['content-type'] ?? 'application/json',
      authorization: typeof req.headers.authorization === 'string' ? req.headers.authorization : '',
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : raw || undefined,
  })
  const response = await handleAdminUsers(request)
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  const text = await response.text()
  res.end(text)
}

function applyEnv(root: string, mode: string) {
  const loaded = loadEnv(mode, root, '')
  for (const [key, value] of Object.entries(loaded)) {
    if (!process.env[key]) process.env[key] = value
  }
}

export function adminApiPlugin(): Plugin {
  return {
    name: 'academy-admin-api',
    configureServer(server) {
      applyEnv(server.config.root, server.config.mode)
      server.middlewares.use('/api/admin/users', (req, res) => {
        void adapt(req, res)
      })
    },
    configurePreviewServer(server) {
      applyEnv(server.config.root, server.config.mode)
      server.middlewares.use('/api/admin/users', (req, res) => {
        void adapt(req, res)
      })
    },
  }
}
