import { useEffect, useMemo, useRef, useState } from 'react'
import { Screen, SetupBanner } from '../components/overlay'
import { MaskInput, ParamField, SlotInput, previewOf, type SlotValue } from '../components/inputs'
import { useApp } from '../components/app-context'
import { useStore } from '../store'
import { keepResult } from '../lib/images'
import { undertoneFromSkin } from '../trends/engine'
import {
  costsFor,
  extractMedia,
  getBalance,
  getFeatureCosts,
  getHealth,
  resizeImage,
  runTask,
  uploadFile,
  YouCamError,
  type Json,
  type Media,
  type Sku,
} from '../youcam'
import { defaultParams, getFeature, type AIFeature as Feature, type FileRef, type Params } from './features'
import { AnalysisResult, MediaResult, parseSkin } from './results'

type Phase = 'idle' | 'uploading' | 'running'

export type FeaturePreset = {
  params?: Params
  label?: string
  /** Replaces keys in the request body, e.g. a trend's exact makeup effects. */
  bodyOverride?: Json
  hideParams?: boolean
}

export function AIFeature({
  featureId,
  preset,
  onClose,
}: {
  featureId: string
  preset?: FeaturePreset
  onClose: () => void
}) {
  const feature = getFeature(featureId)
  if (!feature) {
    return (
      <Screen title="Feature" onClose={onClose}>
        <p className="text-sm text-muted-foreground">This feature is unavailable.</p>
      </Screen>
    )
  }
  return <Runner key={feature.id} feature={feature} preset={preset} onClose={onClose} />
}

function Runner({ feature, preset, onClose }: { feature: Feature; preset?: FeaturePreset; onClose: () => void }) {
  const store = useStore()
  const { notify } = useApp()
  const [values, setValues] = useState<Record<string, SlotValue | undefined>>({})
  const [params, setParams] = useState<Params>(() => ({ ...defaultParams(feature), ...preset?.params }))
  const [consent, setConsent] = useState(store.uploadConsent)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string>()
  const [media, setMedia] = useState<Media[]>()
  const [analysis, setAnalysis] = useState<Json>()
  const [configured, setConfigured] = useState<boolean>()
  const [costs, setCosts] = useState<Sku[]>()
  const [balance, setBalance] = useState<number>()
  const [saved, setSaved] = useState(false)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => {
    getHealth().then((h) => setConfigured(h.youcam))
    getFeatureCosts().then((all) => setCosts(costsFor(all, feature.task))).catch(() => setCosts([]))
    getBalance().then(setBalance).catch(() => undefined)
    return () => abort.current?.abort()
  }, [feature.task])

  const needsPhoto = feature.slots.length > 0
  const videoSeconds = useMemo(() => {
    const v = Object.values(values).find((x) => x?.kind === 'file' && x.seconds !== undefined)
    return v?.kind === 'file' ? v.seconds : undefined
  }, [values])

  const missing = feature.slots.filter((s) => !s.optional && !values[s.key]).map((s) => s.label)
  const missingTemplate = preset?.hideParams ? [] : feature.params.filter((p) => p.type === 'template' && (!p.showIf || p.showIf(params)) && !params[p.key]).map((p) => p.label)
  const invalid = feature.validate?.(params) ?? null
  const blocked = missing.length > 0 || missingTemplate.length > 0 || Boolean(invalid) || (needsPhoto && !consent)

  const run = async () => {
    if (blocked || !configured) return
    setError(undefined)
    setMedia(undefined)
    setAnalysis(undefined)
    setSaved(false)
    abort.current = new AbortController()
    try {
      setPhase('uploading')
      const files: Record<string, FileRef> = {}
      for (const slot of feature.slots) {
        const v = values[slot.key]
        if (!v) continue
        if (v.kind === 'sample') {
          files[slot.key] = { url: v.url }
          continue
        }
        let blob = v.blob
        if (slot.kind === 'image') blob = await resizeImage(v.blob, slot.maxSide ?? 2048, slot.png ? 'image/png' : 'image/jpeg')
        // Masks must match the uploaded photo's size: resize only when the photo itself was a resized upload.
        const base = slot.maskOf ? values[slot.maskOf] : undefined
        if (slot.kind === 'mask' && base?.kind === 'file' && base.seconds === undefined) {
          blob = await resizeImage(v.blob, 2048, 'image/png')
        }
        const ext = blob.type.includes('png') ? 'png' : blob.type.includes('video') ? 'mp4' : 'jpg'
        files[slot.key] = { id: await uploadFile(blob, `${slot.key}.${ext}`, slot.fileEndpoint) }
      }
      if (needsPhoto) store.setUploadConsent(true)
      setPhase('running')
      const body = { ...feature.build({ files, params, videoSeconds }), ...(preset?.bodyOverride ?? {}) }
      const result = await runTask(feature.task, body, { timeoutMs: feature.timeoutMs, signal: abort.current.signal })

      if (feature.output === 'analysis') {
        setAnalysis(result.results)
        if (feature.analysis === 'skin') {
          const parsed = parseSkin(result.results)
          store.addScan({ date: new Date().toISOString(), concerns: parsed.rows, overall: parsed.overall, skinAge: parsed.skinAge })
        }
        if (feature.analysis === 'tone') {
          const c = (result.results.color ?? {}) as Record<string, string | undefined>
          store.setTone({ skin: c.skin_color, eye: c.eye_color, lip: c.lip_color, hair: c.hair_color, brow: c.eyebrow_color, measuredAt: new Date().toISOString() })
        }
      } else {
        setMedia(extractMedia(result.results, feature.output === 'video' ? 'video' : 'image'))
      }
      getBalance().then(setBalance).catch(() => undefined)
    } catch (err) {
      setError(err instanceof YouCamError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setPhase('idle')
    }
  }

  const saveLook = async () => {
    const first = media?.find((m) => m.kind === 'image')
    if (!first) return
    const image = await keepResult(first.url)
    store.saveLook({ title: preset?.label ?? feature.name, image, featureId: feature.id })
    setSaved(true)
    notify(image ? 'Saved to your looks' : 'Saved without a copy: the image could not be downloaded')
  }

  const toneActions =
    feature.analysis === 'tone' && analysis ? (
      store.profile ? (
        <ToneActions skin={String(((analysis.color ?? {}) as Json).skin_color ?? '')} />
      ) : (
        <p className="rounded-2xl bg-secondary p-3 text-sm">Set up your profile to save these colours to your palette. They are saved on this device either way.</p>
      )
    ) : null

  // One live price is shown as-is; tiered prices (by concern count, resolution…) use the written summary.
  const sku =
    costs?.length === 1
      ? `${costs[0].amount} unit${costs[0].amount === 1 ? '' : 's'} per ${costs[0].proc_unit > 1 ? `${costs[0].proc_unit} ` : ''}${costs[0].unit === 'second' ? 'second' : 'image'}${costs[0].proc_unit > 1 ? 's' : ''} (YouCam price list)`
      : feature.costNote

  return (
    <Screen title={feature.name} subtitle={feature.category} onClose={onClose}>
      <div className="space-y-5 pb-4">
        {configured === false && (
          <SetupBanner>The YouCam API key is not set on the server. Add YOUCAM_API_KEY to .env.local and restart.</SetupBanner>
        )}

        <div className="flex items-start gap-3 rounded-3xl bg-secondary p-4">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-card text-2xl shadow-sm" aria-hidden>
            {feature.emoji}
          </span>
          <div>
            <p className="text-sm text-secondary-foreground">{feature.blurb}</p>
            {preset?.label && <p className="mt-1 text-xs font-bold text-primary">{preset.label}</p>}
          </div>
        </div>

        {feature.slots.map((slot) =>
          slot.kind === 'mask' ? (
            <MaskInput
              key={slot.key}
              slot={slot}
              base={values[slot.maskOf ?? 'src']}
              value={values[slot.key]}
              onChange={(v) => setValues((s) => ({ ...s, [slot.key]: v }))}
            />
          ) : (
            <SlotInput
              key={slot.key}
              slot={slot}
              value={values[slot.key]}
              profilePhoto={slot.profile === 'face' ? store.profile?.facePhoto : slot.profile === 'body' ? store.profile?.bodyPhoto ?? store.profile?.facePhoto : undefined}
              onChange={(v) => setValues((s) => ({ ...s, [slot.key]: v }))}
            />
          ),
        )}

        {feature.params.length > 0 && !preset?.hideParams && (
          <div className="space-y-4 rounded-3xl bg-card p-4 ring-1 ring-border/60">
            {feature.params.map((p) => (
              <ParamField key={p.key} param={p} params={params} onChange={(k, v) => setParams((s) => ({ ...s, [k]: v }))} />
            ))}
          </div>
        )}

        <div className="rounded-3xl border border-border p-4 text-sm">
          <p className="font-bold">Cost</p>
          <p className="text-muted-foreground">
            {sku}
            {feature.output === 'video' && videoSeconds ? ` · this video is ${Math.ceil(videoSeconds)} seconds` : ''}
          </p>
          {balance !== undefined && <p className="mt-1 text-xs text-muted-foreground">Account balance: {balance.toFixed(0)} units</p>}
          {needsPhoto && (
            <label className="mt-3 flex items-start gap-3">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[color:var(--primary)]" />
              <span>
                I agree that the photos or video above are sent to YouCam (Perfect Corp.) to create this result. YouCam keeps uploads for 30 days.
              </span>
            </label>
          )}
        </div>

        {(missing.length > 0 || missingTemplate.length > 0 || invalid) && (
          <p className="text-xs font-semibold text-muted-foreground">
            {invalid ?? `Still needed: ${[...missing, ...missingTemplate].join(', ')}`}
          </p>
        )}

        <button
          onClick={run}
          disabled={blocked || phase !== 'idle' || configured === false}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40"
        >
          {phase !== 'idle' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {phase === 'uploading' ? 'Uploading…' : phase === 'running' ? (feature.output === 'video' ? 'Rendering video (can take minutes)…' : 'Waiting for YouCam…') : `Run ${feature.name.replace(/^AI /, '')}`}
        </button>

        <div aria-live="polite">
          {error && (
            <div role="alert" className="rounded-2xl bg-[#fde7e5] p-3 text-sm text-[#8c1d18]">
              {error}
            </div>
          )}
          {media && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">Result from YouCam</h2>
              <MediaResult
                media={media}
                before={feature.output === 'image' ? previewOf(values.src) : undefined}
                labels={media.length > 1 ? media.map((_, i) => `Result ${i + 1}`) : undefined}
              />
              {media.some((m) => m.kind === 'image') && (
                <button onClick={saveLook} disabled={saved} className="w-full rounded-full border border-border py-3 text-sm font-bold disabled:opacity-60">
                  {saved ? 'Saved to your looks' : 'Save to my looks'}
                </button>
              )}
            </div>
          )}
          {analysis && feature.analysis && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">Result from YouCam</h2>
              <AnalysisResult kind={feature.analysis} results={analysis} actions={toneActions} />
            </div>
          )}
        </div>
      </div>
    </Screen>
  )
}

function ToneActions({ skin }: { skin: string }) {
  const store = useStore()
  const { notify } = useApp()
  if (!/^#[0-9a-f]{6}$/i.test(skin)) return null
  const estimate = undertoneFromSkin(skin)
  return (
    <div className="rounded-2xl bg-secondary p-3 text-sm">
      <p>
        From the measured skin colour, a <strong>{estimate}</strong> palette is a reasonable starting point. This is an estimate; change it any time in My Palette.
      </p>
      <button
        onClick={() => {
          store.updateProfile({ undertone: estimate, undertoneSource: 'measured' })
          notify(`Palette set to ${estimate}`)
        }}
        className="mt-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
      >
        Use {estimate} palette
      </button>
    </div>
  )
}
