import { useRef, useState } from 'react'
import { DemoTag, Screen, SetupBanner } from '../components/overlay'
import { catalog, fileToDataUrl, useStore } from '../store'

type Phase = 'idle' | 'running' | 'done'

export function TryOn({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [garmentId, setGarmentId] = useState(catalog[0].id)
  const [bodyPhoto, setBodyPhoto] = useState<string | undefined>(
    store.profile?.bodyPhoto,
  )
  const [phase, setPhase] = useState<Phase>('idle')
  const fileRef = useRef<HTMLInputElement>(null)
  const garment = catalog.find((g) => g.id === garmentId)!

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f?.type.startsWith('image/')) {
      const url = await fileToDataUrl(f)
      setBodyPhoto(url)
    }
  }

  const run = () => {
    setPhase('running')
    // Local demo animation only — no fabricated provider result.
    setTimeout(() => setPhase('done'), 1600)
  }

  return (
    <Screen title="Virtual Try-On" subtitle="Preview a look" onClose={onClose}>
      <SetupBanner>
        Live try-on uses YouCam / MakeupAR virtual try-on and requires backend
        credentials and image-requirement checks. Until that is configured, this
        screen shows a clearly-labeled demo — never a real generated result.
      </SetupBanner>

      <p className="mb-2 font-display text-sm font-bold">
        Body photo <span className="font-normal text-muted-foreground">(a face photo alone may not work)</span>
      </p>
      <button
        onClick={() => fileRef.current?.click()}
        className="mb-2 grid h-40 w-32 place-items-center overflow-hidden rounded-2xl bg-secondary ring-1 ring-border"
      >
        {bodyPhoto ? (
          <img src={bodyPhoto} alt="Your photo" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">📷 Upload</span>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
      {bodyPhoto && !store.profile?.bodyPhoto && (
        <button
          onClick={() => store.updateProfile({ bodyPhoto })}
          className="mb-4 block text-sm font-semibold text-primary"
        >
          Save this body photo to my profile
        </button>
      )}

      <p className="mb-2 mt-4 font-display text-sm font-bold">Choose a garment</p>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 scroll-area">
        {catalog.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setGarmentId(g.id)
              setPhase('idle')
            }}
            className={`h-16 w-16 flex-shrink-0 rounded-2xl ring-2 transition ${
              garmentId === g.id ? 'ring-primary' : 'ring-transparent'
            }`}
            style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1] ?? g.colors[0]})` }}
            aria-label={g.name}
          />
        ))}
      </div>

      <button
        onClick={run}
        disabled={!bodyPhoto || phase === 'running'}
        className="mb-5 w-full rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40"
      >
        {phase === 'running' ? 'Generating preview…' : 'Preview look'}
      </button>

      {phase !== 'idle' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-sm font-bold">Original vs preview</p>
            <DemoTag />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <figure>
              <div className="h-44 overflow-hidden rounded-2xl bg-secondary">
                {bodyPhoto && <img src={bodyPhoto} alt="Original" className="h-full w-full object-cover" />}
              </div>
              <figcaption className="mt-1 text-center text-xs text-muted-foreground">Original</figcaption>
            </figure>
            <figure>
              <div className="relative h-44 overflow-hidden rounded-2xl bg-secondary">
                {bodyPhoto && (
                  <img src={bodyPhoto} alt="Preview base" className="h-full w-full object-cover" />
                )}
                {phase === 'running' ? (
                  <div className="absolute inset-0 grid place-items-center bg-card/60">
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/2 opacity-70"
                    style={{ background: `linear-gradient(180deg, transparent, ${garment.colors[0]})` }}
                  />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-white">
                  Simulated
                </span>
              </div>
              <figcaption className="mt-1 text-center text-xs text-muted-foreground">{garment.name}</figcaption>
            </figure>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            A visualization does not guarantee real sizing or fit.
          </p>
        </div>
      )}
    </Screen>
  )
}
