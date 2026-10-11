import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { handleApi, type ApiEnv } from './server/api.ts'

// Vite config — https://vitejs.dev/config/

/**
 * Mounts the shared /api handler (server/api.ts) on the dev and preview
 * servers, so provider keys stay on the server in every environment.
 */
function apiPlugin(env: ApiEnv): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    if (!req.url?.startsWith('/api/')) return next()
    const chunks: Buffer[] = []
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      for await (const chunk of req) chunks.push(Buffer.from(chunk))
    }
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(key, value)
      else if (Array.isArray(value)) headers.set(key, value.join(', '))
    }
    const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
      method: req.method,
      headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
    })
    const response = await handleApi(request, env, req.socket.remoteAddress ?? 'local')
    if (!response) return next()
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(Buffer.from(await response.arrayBuffer()))
  }
  const mount = (server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void) => unknown } }): void => {
    server.middlewares.use((req, res, next) => {
      handle(req, res, next).catch(next)
    })
  }
  return { name: 'highlight-api', configureServer: mount, configurePreviewServer: mount }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiEnv: ApiEnv = {
    YOUCAM_API_KEY: env.YOUCAM_API_KEY || process.env.YOUCAM_API_KEY || '',
    YOUTUBE_API_KEY: env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || '',
  }
  // Listen on localhost unless a host is set (use HOST=0.0.0.0 to test on a phone).
  const host = process.env.HOST || '127.0.0.1'
  const port = parseInt(process.env.PORT || '8443')

  return {
    plugins: [react(), tailwindcss(), apiPlugin(apiEnv)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: { host, port, strictPort: true },
    preview: { host, port },
  }
})
