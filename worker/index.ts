/*
 * Cloudflare Worker for the public deploy. Static files come from ./dist
 * (Workers static assets); /api/* runs the same handler as the dev server.
 *
 *   npm run build
 *   npx wrangler secret put YOUCAM_API_KEY
 *   npx wrangler deploy
 */
import { handleApi, type ApiEnv } from '../server/api'

type Env = ApiEnv & { ASSETS: { fetch: (request: Request) => Promise<Response> } }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
    const response = await handleApi(request, env, ip)
    return response ?? env.ASSETS.fetch(request)
  },
}
