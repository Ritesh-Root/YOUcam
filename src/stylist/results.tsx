import type { ReactNode } from 'react'
import type { Json, Media } from '../youcam'
import type { AnalysisKind } from './features'

const titleCase = (s: string) =>
  s.replace(/^hd_/, '').replace(/_v2$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

/* ------------------------------------------------------------------ *
 * Media results
 * ------------------------------------------------------------------ */
export function MediaResult({ media, before, labels }: { media: Media[]; before?: string; labels?: string[] }) {
  if (!media.length) return <p className="text-sm text-muted-foreground">YouCam returned no image.</p>
  const [first, ...rest] = media
  return (
    <div className="space-y-3">
      {first.kind === 'video' ? (
        <video src={first.url} controls playsInline className="w-full rounded-2xl bg-black" />
      ) : before && media.length === 1 ? (
        <div className="grid grid-cols-2 gap-2">
          {/* No CORS mode: some sample hosts (S3) omit CORS headers on the cached thumbnail, and nothing reads this image's pixels. */}
          <Figure src={before} caption="Before" cors={false} />
          <Figure src={first.url} caption="After" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {media.map((m, i) => (
            <Figure key={m.url} src={m.url} caption={labels?.[i] ?? `Result ${i + 1}`} />
          ))}
        </div>
      )}
      {first.kind === 'video' && rest.length > 0 && (
        <p className="text-xs text-muted-foreground">{rest.length} more file{rest.length > 1 ? 's' : ''} returned.</p>
      )}
      <p className="text-xs text-muted-foreground">
        Result links from YouCam expire after 2 hours. Save a look to keep a copy on this device.
      </p>
    </div>
  )
}

function Figure({ src, caption, cors = true }: { src: string; caption: string; cors?: boolean }) {
  return (
    <figure>
      <a href={src} target="_blank" rel="noopener noreferrer">
        <img src={src} crossOrigin={cors ? 'anonymous' : undefined} alt={caption} className="aspect-[3/4] w-full rounded-2xl bg-secondary object-cover" />
      </a>
      <figcaption className="mt-1 text-center text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  )
}

/* ------------------------------------------------------------------ *
 * Analysis results
 * ------------------------------------------------------------------ */
export type SkinRow = { type: string; score: number }

export function parseSkin(results: Json): { rows: SkinRow[]; overall?: number; skinAge?: number } {
  const output = (Array.isArray(results.output) ? results.output : []) as Json[]
  const rows: SkinRow[] = []
  let overall: number | undefined
  let skinAge: number | undefined
  for (const o of output) {
    const type = String(o.type ?? '')
    if (type === 'all' || type === 'hd_all') overall = Number(o.score ?? o.ui_score)
    else if (type.includes('skin_age')) skinAge = Number(o.score ?? o.ui_score)
    else if (type && typeof o.ui_score === 'number') rows.push({ type, score: o.ui_score as number })
  }
  return { rows, overall, skinAge }
}

export function AnalysisResult({ kind, results, actions }: { kind: AnalysisKind; results: Json; actions?: ReactNode }) {
  if (kind === 'skin') {
    const { rows, overall, skinAge } = parseSkin(results)
    return (
      <div className="space-y-3">
        {(overall !== undefined || skinAge !== undefined) && (
          <div className="flex gap-3">
            {overall !== undefined && <Stat value={Math.round(overall)} label="Overall score" />}
            {skinAge !== undefined && <Stat value={Math.round(skinAge)} label="Skin age estimate" />}
          </div>
        )}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.type}>
              <div className="mb-1 flex justify-between text-sm font-semibold">
                <span>{titleCase(r.type)}</span>
                <span className="tabular-nums">{r.score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, Math.min(100, r.score))}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Scores run 1–100; higher means the concern is less visible in this photo. Lighting and angle change scores, so compare photos taken the same way. This is not a medical diagnosis.
        </p>
        {actions}
      </div>
    )
  }

  if (kind === 'tone') {
    const color = (results.color ?? {}) as Json
    const swatches = [
      ['Skin', color.skin_color],
      ['Eyes', color.eye_color, color.eye_color_name],
      ['Brows', color.eyebrow_color],
      ['Lips', color.lip_color],
      ['Hair', color.hair_color, color.hair_color_name],
    ].filter(([, hex]) => typeof hex === 'string') as [string, string, string?][]
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-2">
          {swatches.map(([label, hex, name]) => (
            <div key={label} className="text-center">
              <span className="mx-auto block h-12 w-12 rounded-2xl ring-1 ring-black/10" style={{ backgroundColor: hex }} />
              <p className="mt-1 text-xs font-bold">{label}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{name ?? hex}</p>
            </div>
          ))}
        </div>
        <FaceQuality results={results} />
        {actions}
      </div>
    )
  }

  if (kind === 'fitzpatrick') {
    const type = String(results.fitzpatrick_scale ?? '?')
    const burn = ['I', 'II'].includes(type) ? 'burns easily' : ['III', 'IV'].includes(type) ? 'sometimes burns' : 'rarely burns'
    return (
      <div className="space-y-2">
        <Stat value={type} label="Fitzpatrick type (estimate)" />
        <p className="text-sm text-secondary-foreground">
          Type {type} skin typically {burn}. Every type needs daily broad-spectrum sunscreen. This is a photo-based estimate, not a dermatologist’s assessment.
        </p>
      </div>
    )
  }

  if (kind === 'hair') {
    const entries = Object.entries(results).filter(([, v]) => v && typeof v === 'object') as [string, Json][]
    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <Stat key={k} value={String(v.term ?? v.mapping ?? '—')} label={titleCase(k)} />
        ))}
      </div>
    )
  }

  // Face attributes: flatten the readable values.
  const rows: [string, string][] = []
  const walk = (node: unknown, path: string) => {
    if (node === null || node === undefined) return
    if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
      if (!/url/i.test(path)) rows.push([path, String(typeof node === 'number' ? Math.round(node * 100) / 100 : node)])
      return
    }
    if (Array.isArray(node)) {
      if (node.every((n) => typeof n === 'number')) rows.push([path, node.map((n) => Math.round(Number(n) * 100) / 100).join(' : ')])
      else node.forEach((n, i) => walk(n, `${path} ${i + 1}`))
      return
    }
    for (const [k, v] of Object.entries(node as Json)) {
      if (k === 'face_quality') continue
      walk(v, path ? `${path} · ${titleCase(k)}` : titleCase(k))
    }
  }
  walk(results, '')
  return (
    <div className="space-y-2">
      <FaceQuality results={results} />
      <dl className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border/60">
        {rows.slice(0, 40).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 px-3 py-2 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function FaceQuality({ results }: { results: Json }) {
  const q = (results.face_quality ?? null) as Json | null
  if (!q) return null
  const poor = Object.entries(q).filter(([k, v]) => k !== 'has_face' && typeof v === 'string' && v !== 'good')
  if (!poor.length) return null
  return (
    <p className="rounded-2xl bg-[#fff6e0] p-3 text-xs text-accent-foreground">
      Photo quality: {poor.map(([k, v]) => `${titleCase(k)} ${v}`).join(', ')}. Results are less reliable; retake in even light facing the camera.
    </p>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-secondary p-3 text-center">
      <p className="font-display text-3xl font-bold text-primary tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
