import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { listTemplates, type Template } from '../youcam'
import type { Param, Params, Slot } from '../stylist/features'
import { Chip } from './overlay'

/* ------------------------------------------------------------------ *
 * Values held by a photo/video slot before upload
 * ------------------------------------------------------------------ */
export type SlotValue =
  | { kind: 'file'; blob: Blob; preview: string; name: string; seconds?: number; width?: number; height?: number }
  | { kind: 'sample'; url: string; label: string }

export function previewOf(v?: SlotValue): string | undefined {
  return v ? (v.kind === 'file' ? v.preview : v.url) : undefined
}

function readVideoMeta(url: string): Promise<{ seconds: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => resolve({ seconds: video.duration, width: video.videoWidth, height: video.videoHeight })
    video.onerror = () => reject(new Error('That video could not be read. Use an MP4.'))
    video.src = url
  })
}

/* Draws a contact-lens design (iris ring with radial texture) for the lens try-on. */
function drawLens(color: string): Promise<Blob> {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  const grad = ctx.createRadialGradient(c, c, size * 0.12, c, c, size * 0.48)
  grad.addColorStop(0, `${color}00`)
  grad.addColorStop(0.25, color)
  grad.addColorStop(0.85, color)
  grad.addColorStop(1, '#1a1a1a')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(c, c, size * 0.48, 0, Math.PI * 2)
  ctx.arc(c, c, size * 0.13, 0, Math.PI * 2, true)
  ctx.fill('evenodd')
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 2
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(c + Math.cos(a) * size * 0.15, c + Math.sin(a) * size * 0.15)
    ctx.lineTo(c + Math.cos(a) * size * 0.44, c + Math.sin(a) * size * 0.44)
    ctx.stroke()
  }
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
}

/* ------------------------------------------------------------------ *
 * Photo / video slot
 * ------------------------------------------------------------------ */
export function SlotInput({
  slot,
  value,
  onChange,
  profilePhoto,
}: {
  slot: Slot
  value?: SlotValue
  onChange: (v: SlotValue | undefined) => void
  profilePhoto?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const [lensColor, setLensColor] = useState('#3b7bbf')
  const isVideo = slot.kind === 'video'

  const pick = async (file?: File) => {
    setError(undefined)
    if (!file) return
    if (isVideo) {
      if (!/^video\/(mp4|quicktime)$/.test(file.type)) return setError('Use an MP4 or MOV video.')
      const preview = URL.createObjectURL(file)
      try {
        const meta = await readVideoMeta(preview)
        if (meta.seconds > 10.5) {
          URL.revokeObjectURL(preview)
          return setError(`That video is ${Math.round(meta.seconds)} seconds. Trim it to 10 seconds or less.`)
        }
        onChange({ kind: 'file', blob: file, preview, name: file.name, seconds: meta.seconds, width: meta.width, height: meta.height })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'That video could not be read.')
      }
      return
    }
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return setError('Use a JPEG or PNG photo.')
    if (file.size > 25 * 1024 * 1024) return setError('That photo is over 25 MB.')
    onChange({ kind: 'file', blob: file, preview: URL.createObjectURL(file), name: file.name })
  }

  const useProfile = async () => {
    if (!profilePhoto) return
    const blob = await (await fetch(profilePhoto)).blob()
    onChange({ kind: 'file', blob, preview: profilePhoto, name: 'profile.jpg' })
  }

  const preview = previewOf(value)
  return (
    <div className="rounded-3xl border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="grid h-24 w-20 flex-shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary ring-1 ring-border"
          aria-label={`Choose ${slot.label}`}
        >
          {preview ? (
            isVideo ? (
              <video src={preview} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="text-2xl" aria-hidden>{isVideo ? '🎞️' : '📷'}</span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold">
            {slot.label}
            {slot.optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
          </p>
          <p className="text-xs text-muted-foreground">{slot.hint}</p>
          {value?.kind === 'sample' && <p className="mt-1 text-xs font-semibold text-primary">Using {value.label}</p>}
          {value?.kind === 'file' && value.seconds !== undefined && (
            <p className="mt-1 text-xs font-semibold text-primary">{value.seconds.toFixed(1)} seconds</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <SmallButton onClick={() => inputRef.current?.click()}>{value ? 'Replace' : isVideo ? 'Upload video' : 'Upload photo'}</SmallButton>
            {profilePhoto && <SmallButton onClick={useProfile}>Use profile photo</SmallButton>}
            {slot.samples?.map((s) => (
              <SmallButton key={s.url} onClick={() => onChange({ kind: 'sample', url: s.url, label: s.label })}>
                {s.label.replace('YouCam sample ', 'Sample ')}
              </SmallButton>
            ))}
            {value && <SmallButton onClick={() => onChange(undefined)}>Clear</SmallButton>}
          </div>
          {slot.lensGenerator && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={lensColor}
                onChange={(e) => setLensColor(e.target.value)}
                aria-label="Lens colour"
                className="h-8 w-10 rounded border-0 bg-transparent"
              />
              <SmallButton
                onClick={async () => {
                  const blob = await drawLens(lensColor)
                  onChange({ kind: 'file', blob, preview: URL.createObjectURL(blob), name: 'lens.png' })
                }}
              >
                Generate lens from colour
              </SmallButton>
            </div>
          )}
          {error && <p role="alert" className="mt-2 text-xs font-semibold text-[#b3261e]">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={isVideo ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png,image/webp'}
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

function SmallButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-bold text-secondary-foreground"
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Mask painter: white strokes on black, at the base image's full size
 * ------------------------------------------------------------------ */
export function MaskInput({
  slot,
  base,
  value,
  onChange,
}: {
  slot: Slot
  base?: SlotValue
  value?: SlotValue
  onChange: (v: SlotValue | undefined) => void
}) {
  const overlay = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<{ x: number; y: number; r: number }[][]>([])
  const drawing = useRef(false)
  const [natural, setNatural] = useState<{ w: number; h: number }>()
  const [brush, setBrush] = useState(28)
  const [frame, setFrame] = useState<string>()
  const baseUrl = previewOf(base)
  const isVideo = base?.kind === 'file' && base.seconds !== undefined

  // For videos, grab the first frame to paint on.
  useEffect(() => {
    setFrame(undefined)
    strokes.current = []
    onChange(undefined)
    if (!baseUrl) return
    if (!isVideo) {
      const img = new Image()
      img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight })
      img.src = baseUrl
      return
    }
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.src = baseUrl
    video.onloadeddata = () => {
      video.currentTime = 0
    }
    video.onseeked = () => {
      const c = document.createElement('canvas')
      c.width = video.videoWidth
      c.height = video.videoHeight
      c.getContext('2d')!.drawImage(video, 0, 0)
      setNatural({ w: c.width, h: c.height })
      setFrame(c.toDataURL('image/jpeg', 0.8))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl])

  const redraw = () => {
    const c = overlay.current
    if (!c || !natural) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = 'rgba(244, 114, 160, 0.55)'
    for (const s of strokes.current) for (const p of s) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = overlay.current!
    const rect = c.getBoundingClientRect()
    const scale = c.width / rect.width
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale, r: brush * scale }
  }

  const exportMask = () => {
    if (!natural || !strokes.current.length) return onChange(undefined)
    const c = document.createElement('canvas')
    c.width = natural.w
    c.height = natural.h
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#ffffff'
    for (const s of strokes.current) for (const p of s) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
    c.toBlob((blob) => {
      if (blob) onChange({ kind: 'file', blob, preview: URL.createObjectURL(blob), name: 'mask.png' })
    }, 'image/png')
  }

  if (!baseUrl) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        {slot.label}: choose the {isVideo ? 'video' : 'photo'} above first, then paint here.
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-3">
      <p className="font-display text-sm font-bold">{slot.label}</p>
      <p className="mb-2 text-xs text-muted-foreground">{slot.hint}</p>
      <div className="relative overflow-hidden rounded-2xl bg-secondary">
        <img src={frame ?? baseUrl} alt="" className="block w-full select-none" draggable={false} />
        {natural && (
          <canvas
            ref={overlay}
            width={natural.w}
            height={natural.h}
            className="absolute inset-0 h-full w-full touch-none"
            aria-label="Paint the area"
            onPointerDown={(e) => {
              drawing.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              strokes.current.push([point(e)])
              redraw()
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return
              strokes.current.at(-1)!.push(point(e))
              redraw()
            }}
            onPointerUp={() => {
              drawing.current = false
              exportMask()
            }}
          />
        )}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <label className="flex flex-1 items-center gap-2 text-xs font-semibold">
          Brush
          <input type="range" min={8} max={80} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="flex-1 accent-[color:var(--primary)]" />
        </label>
        <SmallButton
          onClick={() => {
            strokes.current.pop()
            redraw()
            exportMask()
          }}
        >
          Undo
        </SmallButton>
        <SmallButton
          onClick={() => {
            strokes.current = []
            redraw()
            onChange(undefined)
          }}
        >
          Clear
        </SmallButton>
      </div>
      {!value && <p className="mt-1 text-xs text-muted-foreground">Nothing painted yet.</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Template picker (YouCam template catalogs)
 * ------------------------------------------------------------------ */
export function TemplatePicker({
  name,
  version,
  value,
  onChange,
  filter,
}: {
  name: string
  version?: string
  value?: string
  onChange: (id: string, t: Template) => void
  filter?: (t: Template) => boolean
}) {
  const [templates, setTemplates] = useState<Template[]>()
  const [error, setError] = useState<string>()
  const [category, setCategory] = useState('All')
  const [limit, setLimit] = useState(24)

  useEffect(() => {
    let cancelled = false
    setTemplates(undefined)
    setError(undefined)
    listTemplates(name, version)
      .then((t) => !cancelled && setTemplates(filter ? t.filter(filter) : t))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load styles.'))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, version])

  const categories = useMemo(() => ['All', ...new Set((templates ?? []).map((t) => t.category_name || 'Other'))], [templates])
  const shown = (templates ?? [])
    .filter((t) => category === 'All' || (t.category_name || 'Other') === category)
    // Keep the current choice visible at the front.
    .sort((a, b) => Number(b.id === value) - Number(a.id === value))

  if (error) return <p className="text-sm text-[#b3261e]">{error}</p>
  if (!templates) return <p className="text-sm text-muted-foreground">Loading styles from YouCam…</p>
  if (!templates.length) return <p className="text-sm text-muted-foreground">YouCam returned no styles.</p>

  return (
    <div>
      {categories.length > 2 && (
        <div className="scroll-area mb-2 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <div key={c} className="flex-shrink-0">
              <Chip label={c} selected={category === c} onClick={() => { setCategory(c); setLimit(24) }} />
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {shown.slice(0, limit).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id, t)}
            aria-pressed={value === t.id}
            className={`overflow-hidden rounded-2xl bg-card text-left ring-2 ${value === t.id ? 'ring-primary' : 'ring-transparent'}`}
          >
            {t.thumb ? (
              <img src={t.thumb} alt="" loading="lazy" className="aspect-[3/4] w-full bg-secondary object-cover" />
            ) : (
              <span className="grid aspect-[3/4] w-full place-items-center bg-secondary text-xl">✨</span>
            )}
            <span className="block truncate px-1.5 py-1 text-[11px] font-bold">{t.title || t.id}</span>
          </button>
        ))}
      </div>
      {shown.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + 24)} className="mt-2 w-full rounded-full border border-border py-2 text-sm font-bold">
          Show more ({shown.length - limit} left)
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Parameter fields
 * ------------------------------------------------------------------ */
export function ParamField({
  param,
  params,
  onChange,
}: {
  param: Param
  params: Params
  onChange: (key: string, value: Params[string]) => void
}) {
  if (param.showIf && !param.showIf(params)) return null
  const value = params[param.key]
  const id = `param-${param.key}`

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-display text-sm font-bold">
        {param.label}
        {param.type === 'slider' && <span className="ml-2 font-sans text-xs font-semibold text-muted-foreground">{String(value)}</span>}
      </label>
      {param.type === 'select' && (param.options.length <= 6 ? (
        <div className="flex flex-wrap gap-2" id={id}>
          {param.options.map((o) => (
            <Chip key={o.value} label={o.label} selected={value === o.value} onClick={() => onChange(param.key, o.value)} />
          ))}
        </div>
      ) : (
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(param.key, e.target.value)}
          className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
        >
          {param.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {param.type === 'multi' && (
        <div className="flex flex-wrap gap-2" id={id}>
          {param.options.map((o) => {
            const list = (value as string[]) ?? []
            const on = list.includes(o.value)
            return (
              <Chip
                key={o.value}
                label={o.label}
                selected={on}
                onClick={() => {
                  const next = on ? list.filter((v) => v !== o.value) : [...list, o.value]
                  if (param.max && next.length > param.max) return
                  onChange(param.key, next)
                }}
              />
            )
          })}
        </div>
      )}
      {param.type === 'slider' && (
        <input
          id={id}
          type="range"
          min={param.min}
          max={param.max}
          step={param.step ?? 1}
          value={Number(value)}
          onChange={(e) => onChange(param.key, Number(e.target.value))}
          className="w-full accent-[color:var(--primary)]"
        />
      )}
      {param.type === 'color' && (
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="color"
            value={String(value)}
            onChange={(e) => onChange(param.key, e.target.value)}
            className="h-10 w-14 rounded-xl border border-border bg-card"
          />
          <span className="font-mono text-xs text-muted-foreground">{String(value)}</span>
        </div>
      )}
      {param.type === 'text' && (
        <textarea
          id={id}
          value={String(value ?? '')}
          maxLength={param.maxLength}
          placeholder={param.placeholder}
          onChange={(e) => onChange(param.key, e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm"
        />
      )}
      {param.type === 'toggle' && (
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={Boolean(value)}
          onClick={() => onChange(param.key, !value)}
          className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-border'}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? 'left-6' : 'left-1'}`} />
        </button>
      )}
      {param.type === 'template' && (
        <TemplatePicker
          name={param.template}
          version={param.version}
          value={value as string | undefined}
          filter={param.filter}
          onChange={(tid) => onChange(param.key, tid)}
        />
      )}
    </div>
  )
}
