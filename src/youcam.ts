/*
 * Browser client for the YouCam API. Every request goes through /api on our
 * own server, which adds the key and enforces the endpoint allowlist.
 * Reference: https://docs.perfectcorp.com (S2S v2.0).
 */

export type Json = Record<string, unknown>

export class YouCamError extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Error codes from https://docs.perfectcorp.com/develop/error_codes, in plain words.
const ERRORS: Record<string, string> = {
  exceed_max_filesize: 'That file is too large. Use a photo under 10 MB.',
  invalid_parameter: 'YouCam rejected one of the settings. Try different options.',
  error_download_image: 'YouCam could not read the photo. Try again or use another photo.',
  error_download_mask: 'YouCam could not read the mask. Paint it again.',
  error_decode_image: 'That image format could not be read. Use a JPEG or PNG.',
  error_decode_mask: 'The mask could not be read. Paint it again.',
  error_download_video: 'YouCam could not read the video. Try again.',
  error_decode_video: 'That video format could not be read. Use an MP4.',
  error_nsfw_content_detected: 'YouCam rejected this photo.',
  error_no_face: 'No face was found. Use a clear, front-facing photo.',
  error_pose: 'The body pose could not be read. Use a full-body photo, facing the camera.',
  error_face_parsing: 'The face could not be read. Use a sharper, well-lit photo.',
  error_inference: 'YouCam could not process this image. Try another photo.',
  exceed_nsfw_retry_limits: 'YouCam could not create a safe result for this image.',
  error_upload: 'YouCam could not save the result. Try again.',
  error_multiple_people: 'More than one person was found. Use a photo with only you in it.',
  error_multi_person: 'More than one person was found. Use a photo with only you in it.',
  error_no_shoulder: 'Shoulders must be visible in the photo.',
  error_large_face_angle: 'Face the camera directly and try again.',
  error_hair_too_short: 'Hair is too short for this effect.',
  error_unexpected_video_duration: 'The video length does not match the length you chose.',
  error_bald_image: 'This effect needs visible hair.',
  error_unsupport_ratio: 'That image shape is not supported. Crop it closer to a portrait ratio.',
  error_below_min_image_size: 'That photo is too small. Use a larger image.',
  error_invalid_src: 'The photo does not fit this feature. Check the photo tips.',
  error_invalid_ref: 'The reference image could not be used. Try another one.',
  error_apply_region_mismatch: 'The garment does not match the photo. Use a full-body photo or another item.',
  error_editing_failed: 'YouCam could not apply this effect. Try another photo.',
  CreditInsufficiency: 'The YouCam account is out of units.',
  InvalidParameters: 'YouCam rejected one of the settings. Try different options.',
  InvalidTaskId: 'This result has expired. Run it again.',
  RateLimited: 'Too many requests. Wait a few minutes and try again.',
  LimitExceeded: 'That request is above this app’s spending limit.',
  NotConfigured: 'The YouCam API key is not set on the server.',
  PathNotAllowed: 'This YouCam endpoint is not enabled in the app.',
  unknown_internal_error: 'YouCam had an internal error. Try again.',
}

function codeOf(body: Json): string | undefined {
  const data = (body.data ?? {}) as Json
  const code = data.error_code || data.error || body.error_code || body.error
  return code ? String(code) : undefined
}

function messageOf(body: Json, fallback = 'YouCam could not finish this request. Try again.'): string {
  const code = codeOf(body)
  if (code && ERRORS[code]) return ERRORS[code]
  const data = (body.data ?? {}) as Json
  const detail = data.error_message || body.error_message
  return typeof detail === 'string' && detail.trim() ? `${fallback} (YouCam: ${detail.trim()})` : fallback
}

async function api(path: string, init?: RequestInit): Promise<{ status: number; body: Json }> {
  let res: Response
  try {
    res = await fetch(`/api/youcam${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new YouCamError('Network error. Check your connection and try again.')
  }
  const body = ((await res.json().catch(() => ({}))) ?? {}) as Json
  if (res.status === 401 || (res.status === 403 && codeOf(body) === 'InvalidAccessToken')) {
    throw new YouCamError('The YouCam API key was rejected.', res.status, 'InvalidAccessToken')
  }
  if (res.status === 429) throw new YouCamError(ERRORS.RateLimited, 429, 'RateLimited')
  if (res.status >= 400) throw new YouCamError(messageOf(body), res.status, codeOf(body))
  return { status: res.status, body }
}

/* ------------------------------------------------------------------ *
 * Server status
 * ------------------------------------------------------------------ */
export type Health = { youcam: boolean; youtube: boolean }
let healthPromise: Promise<Health> | null = null

export function getHealth(): Promise<Health> {
  healthPromise ??= fetch('/api/health')
    .then((r) => (r.ok ? (r.json() as Promise<Health>) : { youcam: false, youtube: false }))
    .catch(() => ({ youcam: false, youtube: false }))
  return healthPromise
}

/* ------------------------------------------------------------------ *
 * Units: balance and per-feature cost (both free calls)
 * ------------------------------------------------------------------ */
export async function getBalance(): Promise<number> {
  const { body } = await api('/s2s/v1.0/client/credit')
  const results = (body.results ?? []) as { amount_dec?: number; amount?: number }[]
  return results.reduce((sum, r) => sum + Number(r.amount_dec ?? r.amount ?? 0), 0)
}

export type Sku = { description: string; amount: number; unit: string; proc_unit: number; run_task_url: string }
let costsPromise: Promise<Sku[]> | null = null

export function getFeatureCosts(): Promise<Sku[]> {
  costsPromise ??= (async () => {
    const all: Sku[] = []
    let token: string | null = null
    for (let page = 0; page < 15; page++) {
      const query: string = token ? `?page_size=20&starting_token=${encodeURIComponent(token)}` : '?page_size=20'
      const { body } = await api(`/s2s/v2.0/credit/feature-cost${query}`)
      const result = (body.result ?? {}) as { skus?: Sku[]; next_token?: string | null }
      all.push(...(result.skus ?? []))
      token = result.next_token ?? null
      if (!token) break
    }
    return all
  })().catch((err) => {
    costsPromise = null
    throw err
  })
  return costsPromise
}

/** Price lines for one task path, e.g. "v2.0/task/makeup-vto". */
export function costsFor(skus: Sku[], taskPath: string): Sku[] {
  return skus.filter((s) => s.run_task_url.endsWith(`/s2s/${taskPath}`))
}

/* ------------------------------------------------------------------ *
 * Files
 * ------------------------------------------------------------------ */
export function resizeImage(file: Blob, maxSide = 2048, type = 'image/jpeg'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new YouCamError('Could not read that photo.'))
        return
      }
      if (type === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new YouCamError('Could not read that photo.'))),
        type,
        0.9,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new YouCamError('Could not read that photo. Use a JPEG or PNG.'))
    }
    img.src = url
  })
}

/** Reserves an upload with the File API, PUTs the bytes through our relay, returns the file_id. */
export async function uploadFile(blob: Blob, fileName: string, endpoint = '/s2s/v2.0/file'): Promise<string> {
  const contentType = blob.type === 'image/jpg' ? 'image/jpeg' : blob.type || 'image/jpeg'
  const { body } = await api(endpoint, {
    method: 'POST',
    body: JSON.stringify({ files: [{ content_type: contentType, file_name: fileName, file_size: blob.size }] }),
  })
  const data = (body.data ?? body) as Json
  const file = (Array.isArray(data.files) ? data.files[0] : undefined) as Json | undefined
  const request = (Array.isArray(file?.requests) ? file.requests[0] : undefined) as Json | undefined
  const fileId = file?.file_id
  const url = request?.url
  if (typeof fileId !== 'string' || typeof url !== 'string') {
    throw new YouCamError(messageOf(body, 'Could not start the upload. Try again.'), 200, codeOf(body))
  }
  let put: Response
  try {
    put = await fetch(`/api/upload?to=${encodeURIComponent(url)}`, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    })
  } catch {
    throw new YouCamError('Network error while uploading. Try again.')
  }
  if (!put.ok) {
    const err = ((await put.json().catch(() => ({}))) ?? {}) as Json
    throw new YouCamError(String(err.error || 'Could not upload the file. Try again.'), put.status)
  }
  return fileId
}

/* ------------------------------------------------------------------ *
 * Tasks
 * ------------------------------------------------------------------ */
export type TaskResult = { taskId: string; results: Json; raw: Json }

export async function startTask(taskPath: string, payload: Json): Promise<string> {
  const { body } = await api(`/s2s/${taskPath}`, { method: 'POST', body: JSON.stringify(payload) })
  const data = (body.data ?? body) as Json
  const taskId = data.task_id
  if (typeof taskId !== 'string') throw new YouCamError(messageOf(body), 200, codeOf(body))
  return taskId
}

export async function pollTask(
  taskPath: string,
  taskId: string,
  opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<TaskResult> {
  const timeoutMs = opts.timeoutMs ?? 120_000
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (opts.signal?.aborted) throw new YouCamError('Stopped waiting for the result.', 0, 'Aborted')
    const { body } = await api(`/s2s/${taskPath}/${encodeURIComponent(taskId)}`)
    const data = (body.data ?? {}) as Json
    if (data.task_status === 'success') {
      return { taskId, results: (data.results ?? {}) as Json, raw: data }
    }
    if (data.task_status === 'error') {
      throw new YouCamError(messageOf(body, 'YouCam could not finish this task. Try another photo.'), 200, codeOf(body))
    }
    const interval = Number(data.polling_interval)
    const wait = Number.isFinite(interval) && interval > 0
      ? Math.min(8000, Math.max(1000, interval > 100 ? interval : interval * 1000))
      : 2000
    await new Promise((resolve) => setTimeout(resolve, wait))
  }
  throw new YouCamError('YouCam is still working. The result will expire if we stop polling, so try again.', 0, 'Timeout')
}

export async function runTask(
  taskPath: string,
  payload: Json,
  opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<TaskResult> {
  const taskId = await startTask(taskPath, payload)
  return pollTask(taskPath, taskId, opts)
}

/* ------------------------------------------------------------------ *
 * Templates (free listing)
 * ------------------------------------------------------------------ */
export type Template = { id: string; thumb?: string; title?: string; category_name?: string }

const templateCache = new Map<string, Promise<Template[]>>()

/** Lists every template for a feature, e.g. listTemplates('look-vto'). */
export function listTemplates(name: string, version = 'v2.0'): Promise<Template[]> {
  const key = `${version}/${name}`
  let cached = templateCache.get(key)
  if (!cached) {
    cached = (async () => {
      const all: Template[] = []
      let token: string | null = null
      for (let page = 0; page < 40; page++) {
        const query: string = token ? `?page_size=20&starting_token=${encodeURIComponent(token)}` : '?page_size=20'
        const { body } = await api(`/s2s/${version}/task/template/${name}${query}`)
        const data = (body.data ?? {}) as { templates?: Template[]; next_token?: string | null }
        all.push(...(data.templates ?? []))
        token = data.next_token ?? null
        if (!token) break
      }
      return all
    })().catch((err) => {
      templateCache.delete(key)
      throw err
    })
    templateCache.set(key, cached)
  }
  return cached
}

/* ------------------------------------------------------------------ *
 * Result helpers
 * ------------------------------------------------------------------ */
export type Media = { url: string; kind: 'image' | 'video' }

/** Finds every result URL (results.url, results.output[].url, results.urls…) in a task result. */
export function extractMedia(results: unknown, prefer: 'image' | 'video' = 'image'): Media[] {
  const found: string[] = []
  const walk = (node: unknown, key = '') => {
    if (typeof node === 'string') {
      if (/^https?:\/\//.test(node) && !/mask/i.test(key)) found.push(node)
      return
    }
    if (Array.isArray(node)) node.forEach((n) => walk(n, key))
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, k)
    }
  }
  walk(results)
  return [...new Set(found)].map((url) => ({
    url,
    kind: /\.(mp4|mov|webm)(\?|$)/i.test(url) ? 'video' : /\.(jpe?g|png|webp)(\?|$)/i.test(url) ? 'image' : prefer,
  }))
}
