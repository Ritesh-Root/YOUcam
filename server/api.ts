/*
 * Server-side API shared by the Vite dev/preview server and the Cloudflare
 * Worker. It is the only place that holds provider keys.
 *
 *   /api/health              which integrations are configured (no secrets)
 *   /api/youcam/<path>       allowlisted proxy to the YouCam API
 *   /api/upload?to=<url>     relays a PUT to the presigned YouCam upload URL
 *   /api/trends/live         live creator signals from the YouTube Data API
 *
 * Written against the standard Fetch API so it runs unchanged in Node and in
 * Workers.
 */

export type ApiEnv = {
  YOUCAM_API_KEY?: string
  YOUTUBE_API_KEY?: string
}

const YOUCAM_ORIGIN = 'https://yce-api-01.makeupar.com'

// Only the endpoints the app uses. Anything else is refused before the key is added.
const YOUCAM_PATHS = [
  /^\/s2s\/v1\.0\/client\/credit$/,
  /^\/s2s\/v2\.0\/credit\/feature-cost$/,
  /^\/s2s\/v2\.0\/file(\/2d-vto\/ring|\/obj-rem-vid)?$/,
  /^\/s2s\/v2\.[01]\/task\/template\/[a-z0-9-]+$/,
  /^\/s2s\/v2\.[01]\/task\/[a-z0-9-]+(\/[a-z0-9-]+)?(\/[A-Za-z0-9_=+%-]{8,200})?$/,
]

// Upload URLs returned by the File API point at YouCam's S3 buckets.
const UPLOAD_HOST = /^yce-[a-z0-9-]+\.s3(-accelerate)?(\.[a-z0-9-]+)?\.amazonaws\.com$/
const UPLOAD_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/quicktime'])
const MAX_JSON_BYTES = 64 * 1024
const MAX_UPLOAD_BYTES = 60 * 1024 * 1024

/* ---------------------------------------------------------------------------
 * Rate limiting. Per-process memory: good enough for one dev server, best
 * effort on Workers (each isolate keeps its own window).
 * ------------------------------------------------------------------------- */
type Bucket = { start: number; count: number }
const buckets = new Map<string, Bucket>()

function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now - b.start > windowMs) {
    buckets.set(key, { start: now, count: 1 })
    if (buckets.size > 5000) buckets.clear()
    return true
  }
  b.count += 1
  return b.count <= limit
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function refuse(status: number, code: string, message: string): Response {
  return json({ status, error_code: code, error: message }, status)
}

/* Browsers send Origin on cross-site requests. Refuse any that come from a different site. */
function sameOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

/* Reject request bodies that would spend an unusually large number of units. */
function tooExpensive(body: Record<string, unknown>): string | null {
  const duration = Number(body.dst_duration)
  if (body.dst_duration !== undefined && !(duration > 0 && duration <= 10)) {
    return 'Video length is limited to 10 seconds in this app.'
  }
  const count = Number(body.output_count)
  if (body.output_count !== undefined && !(count >= 1 && count <= 4)) {
    return 'At most 4 images per request in this app.'
  }
  return null
}

async function proxyYoucam(request: Request, env: ApiEnv, path: string, ip: string): Promise<Response> {
  if (!env.YOUCAM_API_KEY) return refuse(503, 'NotConfigured', 'YOUCAM_API_KEY is not set on the server.')
  if (request.method !== 'GET' && request.method !== 'POST') {
    return refuse(405, 'MethodNotAllowed', 'Only GET and POST are allowed.')
  }
  if (!YOUCAM_PATHS.some((re) => re.test(path))) {
    return refuse(403, 'PathNotAllowed', 'This YouCam endpoint is not enabled in the app.')
  }
  if (!allow(`req:${ip}`, 200, 300_000)) {
    return refuse(429, 'RateLimited', 'Too many requests. Wait a few minutes and try again.')
  }

  let body: string | undefined
  if (request.method === 'POST') {
    body = await request.text()
    if (body.length > MAX_JSON_BYTES) return refuse(413, 'TooLarge', 'Request body is too large.')
    let parsed: Record<string, unknown>
    try {
      parsed = body ? (JSON.parse(body) as Record<string, unknown>) : {}
    } catch {
      return refuse(400, 'BadJson', 'Request body must be JSON.')
    }
    const isTask = path.includes('/task/')
    if (isTask) {
      const reason = tooExpensive(parsed)
      if (reason) return refuse(400, 'LimitExceeded', reason)
      if (!allow(`task:${ip}`, 60, 3_600_000)) {
        return refuse(429, 'RateLimited', 'Hourly limit of 60 AI tasks reached for this device.')
      }
    }
  }

  const search = new URL(request.url).search
  const upstream = await fetch(`${YOUCAM_ORIGIN}${path}${search}`, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${env.YOUCAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' },
  })
}

async function relayUpload(request: Request, ip: string): Promise<Response> {
  if (request.method !== 'PUT') return refuse(405, 'MethodNotAllowed', 'Use PUT.')
  const target = new URL(request.url).searchParams.get('to') || ''
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return refuse(400, 'BadTarget', 'Missing upload URL.')
  }
  if (url.protocol !== 'https:' || !UPLOAD_HOST.test(url.hostname)) {
    return refuse(400, 'HostNotAllowed', 'Upload host not allowed.')
  }
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  if (!UPLOAD_TYPES.has(type)) return refuse(415, 'TypeNotAllowed', 'Only JPEG, PNG, MP4 and MOV files can be uploaded.')
  const declared = Number(request.headers.get('content-length') || '0')
  if (declared > MAX_UPLOAD_BYTES) return refuse(413, 'TooLarge', 'File is larger than 60 MB.')
  if (!allow(`upload:${ip}`, 120, 3_600_000)) return refuse(429, 'RateLimited', 'Too many uploads. Try again later.')

  const data = await request.arrayBuffer()
  if (data.byteLength > MAX_UPLOAD_BYTES) return refuse(413, 'TooLarge', 'File is larger than 60 MB.')
  const upstream = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': type, 'Content-Length': String(data.byteLength) },
    body: data,
  })
  if (upstream.ok) return json({ ok: true })
  return refuse(502, 'UploadFailed', `Storage rejected the upload (HTTP ${upstream.status}).`)
}

/* Live signals: the most-viewed recent YouTube videos for a query in one country. */
async function liveTrends(request: Request, env: ApiEnv, ip: string): Promise<Response> {
  if (!env.YOUTUBE_API_KEY) return json({ available: false, reason: 'YOUTUBE_API_KEY is not set on the server.' })
  const params = new URL(request.url).searchParams
  const country = (params.get('country') || '').toUpperCase()
  const query = (params.get('q') || '').slice(0, 80)
  if (!/^[A-Z]{2}$/.test(country) || !query) return refuse(400, 'BadQuery', 'Pass country=XX and q=...')
  if (!allow(`yt:${ip}`, 30, 3_600_000)) return refuse(429, 'RateLimited', 'Too many trend lookups. Try again later.')

  const after = new Date(Date.now() - 30 * 86400000).toISOString()
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.search = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    order: 'viewCount',
    maxResults: '8',
    regionCode: country,
    publishedAfter: after,
    q: query,
    key: env.YOUTUBE_API_KEY,
  }).toString()
  const upstream = await fetch(url.toString())
  if (!upstream.ok) return json({ available: false, reason: `YouTube returned HTTP ${upstream.status}.` })
  const data = (await upstream.json()) as {
    items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; publishedAt?: string } }[]
  }
  return json({
    available: true,
    source: 'YouTube Data API v3 search (regionCode, last 30 days, by views)',
    fetched_at: new Date().toISOString(),
    items: (data.items ?? [])
      .filter((i) => i.id?.videoId)
      .map((i) => ({
        title: i.snippet?.title ?? '',
        channel: i.snippet?.channelTitle ?? '',
        published_at: i.snippet?.publishedAt ?? '',
        url: `https://www.youtube.com/watch?v=${i.id!.videoId}`,
      })),
  })
}

/** Returns a Response for /api/* requests, or null so the caller can serve the app. */
export async function handleApi(request: Request, env: ApiEnv, ip = 'local'): Promise<Response | null> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/api/')) return null
  if (!sameOrigin(request)) return refuse(403, 'CrossOrigin', 'Cross-site requests are not allowed.')

  try {
    if (url.pathname === '/api/health') {
      return json({ youcam: Boolean(env.YOUCAM_API_KEY), youtube: Boolean(env.YOUTUBE_API_KEY) })
    }
    if (url.pathname.startsWith('/api/youcam/')) {
      return await proxyYoucam(request, env, url.pathname.slice('/api/youcam'.length), ip)
    }
    if (url.pathname === '/api/upload') return await relayUpload(request, ip)
    if (url.pathname === '/api/trends/live') return await liveTrends(request, env, ip)
    return refuse(404, 'NotFound', 'Unknown API route.')
  } catch (err) {
    return refuse(502, 'UpstreamError', err instanceof Error ? err.message : 'Upstream request failed.')
  }
}
