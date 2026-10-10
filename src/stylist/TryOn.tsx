import { useEffect, useRef, useState } from 'react'
import { Chip, Screen, SetupBanner } from '../components/overlay'
import { SlotInput, TemplatePicker, previewOf, type SlotValue } from '../components/inputs'
import { useApp } from '../components/app-context'
import { useStore } from '../store'
import { keepResult } from '../lib/images'
import { SAMPLES } from './features'
import { getHealth, resizeImage, runTask, uploadFile, YouCamError, extractMedia } from '../youcam'
import { shopUrl, TRENDS } from '../trends/data'

export type TryOnPreset = {
  templateId?: string
  title?: string
  garmentPhoto?: string
  trendId?: string
  cityId?: string
  occasion?: string
  /** Start on "My garment photo" instead of YouCam outfits. */
  own?: boolean
}

type Source = 'template' | 'own'
type Category = 'auto' | 'upper_body' | 'lower_body' | 'full_body' | 'outer' | 'shoes'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'auto', label: 'Detect' },
  { value: 'full_body', label: 'Dress / full outfit' },
  { value: 'upper_body', label: 'Top' },
  { value: 'lower_body', label: 'Bottom' },
  { value: 'outer', label: 'Jacket' },
  { value: 'shoes', label: 'Shoes' },
]

export function TryOn({ preset, onClose, onOpenMakeup }: { preset?: TryOnPreset; onClose: () => void; onOpenMakeup?: (trendId: string) => void }) {
  const store = useStore()
  const { notify } = useApp()
  const [person, setPerson] = useState<SlotValue>()
  const [consent, setConsent] = useState(store.uploadConsent)
  const [source, setSource] = useState<Source>(preset?.garmentPhoto || preset?.own ? 'own' : 'template')
  const [templateId, setTemplateId] = useState(preset?.templateId)
  const [templateTitle, setTemplateTitle] = useState(preset?.title)
  const [garment, setGarment] = useState<SlotValue>()
  const [category, setCategory] = useState<Category>('auto')
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'running'>('idle')
  const [result, setResult] = useState<string>()
  const [error, setError] = useState<string>()
  const [configured, setConfigured] = useState<boolean>()
  const [saved, setSaved] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const trend = TRENDS.find((t) => t.id === preset?.trendId)

  useEffect(() => {
    getHealth().then((h) => setConfigured(h.youcam))
  }, [])

  useEffect(() => {
    if (!preset?.garmentPhoto) return
    fetch(preset.garmentPhoto)
      .then((r) => r.blob())
      .then((blob) => setGarment({ kind: 'file', blob, preview: preset.garmentPhoto!, name: 'garment.jpg' }))
      .catch(() => undefined)
  }, [preset?.garmentPhoto])

  const ready = Boolean(person) && consent && (source === 'template' ? Boolean(templateId) : Boolean(garment))

  const run = async () => {
    if (!ready || !person) return
    setError(undefined)
    setResult(undefined)
    setSaved(false)
    try {
      setPhase('uploading')
      const src = person.kind === 'sample'
        ? { src_file_url: person.url }
        : { src_file_id: await uploadFile(await resizeImage(person.blob), 'person.jpg') }
      let task: string
      let body: Record<string, unknown>
      if (source === 'template') {
        task = 'v2.0/task/cloth'
        body = { ...src, template_id: templateId }
      } else {
        const ref = garment!.kind === 'sample'
          ? { ref_file_url: garment!.url }
          : { ref_file_id: await uploadFile(await resizeImage(garment!.blob), 'garment.jpg') }
        task = 'v2.0/task/cloth-v4'
        body = { ...src, ...ref, garment_category: category }
      }
      store.setUploadConsent(true)
      setPhase('running')
      const out = await runTask(task, body, { timeoutMs: 180_000 })
      const url = extractMedia(out.results)[0]?.url
      if (!url) throw new YouCamError('YouCam returned no image.')
      setResult(url)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (err) {
      setError(err instanceof YouCamError ? err.message : 'YouCam could not finish this try-on. Try again.')
    } finally {
      setPhase('idle')
    }
  }

  const save = async () => {
    if (!result) return
    const image = await keepResult(result)
    store.saveLook({
      title: trend?.title ?? templateTitle ?? 'Outfit try-on',
      image,
      featureId: 'clothes-tryon',
      trendId: trend?.id,
      cityId: preset?.cityId,
      occasion: preset?.occasion,
    })
    setSaved(true)
    notify(image ? 'Saved to your looks' : 'Saved without a copy: the image could not be downloaded')
  }

  return (
    <Screen title="Outfit Try-On" subtitle={trend ? trend.title : 'See it on your own photo'} onClose={onClose}>
      <div className="space-y-5 pb-4">
        {configured === false && (
          <SetupBanner>The YouCam API key is not set on the server. Add YOUCAM_API_KEY to .env.local and restart.</SetupBanner>
        )}

        <SlotInput
          slot={{ key: 'src', label: 'Full-body photo', kind: 'image', hint: 'Full body, facing the camera, only you in frame, plain background.', samples: [SAMPLES.fullBody] }}
          value={person}
          onChange={setPerson}
          profilePhoto={store.profile?.bodyPhoto}
        />

        <div>
          <p className="mb-2 font-display text-sm font-bold">Outfit</p>
          <div className="mb-3 flex gap-2">
            <Chip label="YouCam outfits" selected={source === 'template'} onClick={() => setSource('template')} />
            <Chip label="My garment photo" selected={source === 'own'} onClick={() => setSource('own')} />
          </div>
          {source === 'template' ? (
            <>
              {templateTitle && (
                <p className="mb-2 text-xs font-semibold text-primary">Selected: {templateTitle}</p>
              )}
              <TemplatePicker
                name="cloth"
                value={templateId}
                onChange={(id, t) => {
                  setTemplateId(id)
                  setTemplateTitle(t.title)
                }}
              />
            </>
          ) : (
            <div className="space-y-3">
              <SlotInput
                slot={{ key: 'ref', label: 'Garment photo', kind: 'image', hint: 'A product photo or a photo of someone wearing it, on a plain background.', samples: [SAMPLES.outfit] }}
                value={garment}
                onChange={setGarment}
              />
              {store.wardrobe.some((w) => w.photo) && (
                <div>
                  <p className="mb-1 text-xs font-bold text-muted-foreground">From my wardrobe</p>
                  <div className="scroll-area flex gap-2 overflow-x-auto pb-1">
                    {store.wardrobe.filter((w) => w.photo).map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={async () => setGarment({ kind: 'file', blob: await (await fetch(w.photo!)).blob(), preview: w.photo!, name: `${w.name}.jpg` })}
                        className="w-16 flex-shrink-0 text-left"
                      >
                        <img src={w.photo} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        <span className="block truncate text-[10px] font-semibold">{w.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Chip key={c.value} label={c.label} selected={category === c.value} onClick={() => setCategory(c.value)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[color:var(--primary)]" />
          <span>This is a photo of me. I agree it is sent to YouCam (Perfect Corp.) to create the try-on. Cost: 2 units.</span>
        </label>

        <button
          onClick={run}
          disabled={!ready || phase !== 'idle' || configured === false}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40"
        >
          {phase !== 'idle' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {phase === 'uploading' ? 'Uploading…' : phase === 'running' ? 'Waiting for YouCam…' : 'Try it on'}
        </button>

        <div aria-live="polite" ref={resultRef}>
          {error && <div role="alert" className="rounded-2xl bg-[#fde7e5] p-3 text-sm text-[#8c1d18]">{error}</div>}
          {result && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">Your try-on</h2>
              <div className="grid grid-cols-2 gap-2">
                <figure>
                  <img src={previewOf(person)} alt="Your photo" className="aspect-[3/4] w-full rounded-2xl object-cover" />
                  <figcaption className="mt-1 text-center text-xs text-muted-foreground">Before</figcaption>
                </figure>
                <figure>
                  <a href={result} target="_blank" rel="noopener noreferrer">
                    <img src={result} crossOrigin="anonymous" alt="Try-on result" className="aspect-[3/4] w-full rounded-2xl object-cover" />
                  </a>
                  <figcaption className="mt-1 text-center text-xs text-muted-foreground">After (YouCam)</figcaption>
                </figure>
              </div>
              <p className="text-xs text-muted-foreground">A visual preview, not a fit or size guarantee.</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={save} disabled={saved} className="rounded-full border border-border py-3 text-sm font-bold disabled:opacity-60">
                  {saved ? 'Saved' : 'Save look'}
                </button>
                {trend ? (
                  <a href={shopUrl(trend)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary py-3 text-center text-sm font-bold text-white">
                    Shop similar
                  </a>
                ) : (
                  <a href={result} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border py-3 text-center text-sm font-bold">
                    Open full image
                  </a>
                )}
              </div>
              {trend && onOpenMakeup && TRENDS.some((t) => t.region === trend.region && t.kind === 'makeup') && (
                <button
                  onClick={() => onOpenMakeup(TRENDS.find((t) => t.region === trend.region && t.kind === 'makeup')!.id)}
                  className="w-full rounded-full border border-primary/40 py-3 text-sm font-bold text-primary"
                >
                  Add the trending makeup look
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Screen>
  )
}
