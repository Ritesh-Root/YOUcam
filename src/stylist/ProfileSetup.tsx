import { useRef, useState } from 'react'
import {
  CLOTHING_TYPES,
  CULTURAL_STYLES,
  REGIONS,
  fileToDataUrl,
  useStore,
  type Coverage,
  type Fit,
  type Profile,
  type Undertone,
} from '../store'
import { Chip, Screen } from '../components/overlay'

const COLORS = [
  ['Rose', '#f472a0'],
  ['Coral', '#ff8a6b'],
  ['Marigold', '#ffd166'],
  ['Mint', '#8fd9b6'],
  ['Teal', '#3aa6a0'],
  ['Lilac', '#c3a8ff'],
  ['Berry', '#b5468b'],
  ['Ivory', '#f5efe0'],
]

export function ProfileSetup({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const existing = store.profile
  const [step, setStep] = useState<0 | 1 | 2>(existing ? 2 : 0)
  const [consented, setConsented] = useState(store.consent?.granted ?? false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [p, setP] = useState<Profile>(
    existing ?? {
      name: 'Millie',
      region: 'India',
      culturalStyles: [],
      usualClothing: [],
      fit: 'regular',
      coverage: 'moderate',
      favoriteColors: [],
      exclusions: [],
    },
  )

  const toggle = (key: keyof Profile, val: string) =>
    setP((prev) => {
      const arr = (prev[key] as string[]) ?? []
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
      }
    })

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const url = await fileToDataUrl(file)
    setP((prev) => ({ ...prev, facePhoto: url }))
  }

  const requestLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      () => setP((prev) => ({ ...prev, region: prev.region || 'India' })),
      () => {},
    )
  }

  const finish = () => {
    store.setConsent(true)
    store.saveProfile(p)
    onClose()
  }

  /* ---- Step 0: consent ---- */
  if (step === 0) {
    return (
      <Screen title="Welcome to HIGHLIGHT" subtitle="Your styling & skin companion" onClose={onClose}>
        <div className="space-y-4">
          <div className="rounded-[2rem] bg-secondary p-5">
            <p className="text-sm leading-relaxed text-secondary-foreground">
              To suggest colors, outfits, and a skin-prep plan, HIGHLIGHT stores
              your photo and preferences <strong>privately in this browser</strong>.
              Photos are never uploaded to a server in this build.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-secondary-foreground/90">
              <li>• We never lighten your skin or apply filters.</li>
              <li>• Skin-tone analysis and virtual try-on need provider setup.</li>
              <li>• You can delete your photo and data at any time.</li>
            </ul>
          </div>
          <label className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-[color:var(--primary)]"
            />
            <span className="text-sm font-semibold">
              I consent to storing my photo and preferences for styling and
              skin-care features.
            </span>
          </label>
          <button
            disabled={!consented}
            onClick={() => setStep(1)}
            className="w-full rounded-full bg-primary py-4 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30 transition disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </Screen>
    )
  }

  /* ---- Step 1: photo ---- */
  if (step === 1) {
    return (
      <Screen title="Add your photo" subtitle="One clear, well-lit face photo" onClose={() => setStep(0)}>
        <div className="space-y-5">
          <button
            onClick={() => fileRef.current?.click()}
            className="mx-auto grid h-48 w-40 place-items-center overflow-hidden rounded-[2rem] bg-secondary ring-1 ring-border"
          >
            {p.facePhoto ? (
              <img src={p.facePhoto} alt="Your selfie" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-secondary-foreground/70">
                <span className="text-4xl">📸</span>
                <span className="text-sm font-semibold">Upload or take photo</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={pickPhoto}
            className="hidden"
          />
          <p className="text-center text-xs text-muted-foreground">
            A face photo powers palette & skin features. A separate body photo
            is only requested later if you try on clothing.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-full border border-border bg-card py-3.5 font-display font-bold text-secondary-foreground"
            >
              Skip for now
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30"
            >
              Continue
            </button>
          </div>
        </div>
      </Screen>
    )
  }

  /* ---- Step 2: preferences ---- */
  return (
    <Screen title="Your style" subtitle="Tune your recommendations" onClose={() => (existing ? onClose() : setStep(1))}>
      <div className="space-y-6 pb-4">
        <Field label="Region">
          <select
            value={p.region}
            onChange={(e) => setP({ ...p, region: e.target.value })}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 font-semibold"
          >
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={requestLocation}
            className="mt-2 text-sm font-semibold text-primary"
          >
            📍 Use my location instead
          </button>
        </Field>

        <Field label="Undertone (self-select)">
          <div className="flex flex-wrap gap-2">
            {(['warm', 'cool', 'neutral'] as Undertone[]).map((u) => (
              <Chip
                key={u}
                label={u[0].toUpperCase() + u.slice(1)}
                selected={p.undertone === u}
                onClick={() => setP({ ...p, undertone: u })}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Automatic skin-tone analysis requires provider setup.
          </p>
        </Field>

        <Field label="Cultural styles">
          <div className="flex flex-wrap gap-2">
            {CULTURAL_STYLES.map((c) => (
              <Chip key={c} label={c} selected={p.culturalStyles.includes(c)} onClick={() => toggle('culturalStyles', c)} />
            ))}
          </div>
        </Field>

        <Field label="Usual clothing">
          <div className="flex flex-wrap gap-2">
            {CLOTHING_TYPES.map((c) => (
              <Chip key={c} label={c} selected={p.usualClothing.includes(c)} onClick={() => toggle('usualClothing', c)} />
            ))}
          </div>
        </Field>

        <Field label="Preferred fit">
          <div className="flex flex-wrap gap-2">
            {(['fitted', 'regular', 'relaxed'] as Fit[]).map((f) => (
              <Chip key={f} label={f} selected={p.fit === f} onClick={() => setP({ ...p, fit: f })} />
            ))}
          </div>
        </Field>

        <Field label="Coverage">
          <div className="flex flex-wrap gap-2">
            {(['minimal', 'moderate', 'modest'] as Coverage[]).map((c) => (
              <Chip key={c} label={c} selected={p.coverage === c} onClick={() => setP({ ...p, coverage: c })} />
            ))}
          </div>
        </Field>

        <Field label="Favorite colors">
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map(([name, hex]) => {
              const on = p.favoriteColors.includes(name)
              return (
                <button
                  key={name}
                  onClick={() => toggle('favoriteColors', name)}
                  aria-pressed={on}
                  aria-label={name}
                  className={`h-10 w-10 rounded-full ring-2 transition ${on ? 'ring-primary ring-offset-2 ring-offset-background' : 'ring-border'}`}
                  style={{ backgroundColor: hex }}
                />
              )
            })}
          </div>
        </Field>

        <Field label="Exclude (never suggest)">
          <div className="flex flex-wrap gap-2">
            {['Saree', 'Lehenga', 'Dress', 'Suit'].map((x) => (
              <Chip key={x} label={x} selected={p.exclusions.includes(x)} onClick={() => toggle('exclusions', x)} />
            ))}
          </div>
        </Field>

        {existing && (
          <button
            onClick={() => {
              store.clearPhotos()
              setP({ ...p, facePhoto: undefined, bodyPhoto: undefined })
            }}
            className="w-full rounded-full border border-primary/40 py-3 text-sm font-bold text-primary"
          >
            Delete my saved photos
          </button>
        )}

        <button
          onClick={finish}
          className="w-full rounded-full bg-primary py-4 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30"
        >
          {existing ? 'Save changes' : 'Finish setup'}
        </button>
      </div>
    </Screen>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-display text-sm font-bold text-foreground">{label}</p>
      {children}
    </div>
  )
}
