import { useRef, useState } from 'react'
import { EMPTY_PROFILE, useStore, type Coverage, type Profile, type StyleFor, type Undertone } from '../store'
import { Chip, Screen } from '../components/overlay'
import { imageToDataUrl } from '../lib/images'
import { CITIES } from '../trends/data'
import { nearestCity } from '../trends/engine'

const COLORS = [
  ['Rose', '#f472a0'],
  ['Coral', '#ff8a6b'],
  ['Marigold', '#ffd166'],
  ['Emerald', '#0f6b4f'],
  ['Teal', '#2f8f8a'],
  ['Cobalt', '#1f4fbf'],
  ['Plum', '#6b2d5c'],
  ['Burgundy', '#6e1f2d'],
  ['Ivory', '#f3ead8'],
  ['Black', '#1c1c1c'],
] as const

const EXCLUSION_IDEAS = ['Saree', 'Lehenga', 'Dress', 'Mini', 'Sequin', 'Leather', 'Strapless', 'Red lip']

export function ProfileSetup({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const existing = store.profile
  const [step, setStep] = useState<0 | 1 | 2>(existing ? 2 : 0)
  const [consented, setConsented] = useState(store.consent?.granted ?? false)
  const [p, setP] = useState<Profile>(existing ?? EMPTY_PROFILE)
  const [locating, setLocating] = useState<string>()
  const [photoError, setPhotoError] = useState<string>()
  const [exclusion, setExclusion] = useState('')
  const faceRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLInputElement>(null)

  const pickPhoto = async (key: 'facePhoto' | 'bodyPhoto', file?: File) => {
    setPhotoError(undefined)
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setPhotoError('Use a JPEG or PNG photo.')
    try {
      const url = await imageToDataUrl(file, 1600)
      setP((prev) => ({ ...prev, [key]: url }))
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not read that photo.')
    }
  }

  const locate = () => {
    if (!navigator.geolocation) return setLocating('Location is not available in this browser. Choose your city instead.')
    setLocating('Finding the nearest city…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { city, km } = nearestCity(pos.coords.latitude, pos.coords.longitude)
        setP((prev) => ({ ...prev, cityId: city.id }))
        setLocating(
          km <= 150
            ? `Set to ${city.name}. Your coordinates were used on this device only and not saved.`
            : `The nearest city with trend data is ${city.name}, ${Math.round(km)} km away. Pick another if it doesn’t fit.`,
        )
      },
      () => setLocating('Location permission was denied. Choose your city instead.'),
      { maximumAge: 600_000, timeout: 10_000 },
    )
  }

  const toggle = (key: 'favoriteColors' | 'exclusions', val: string) =>
    setP((prev) => ({ ...prev, [key]: prev[key].includes(val) ? prev[key].filter((v) => v !== val) : [...prev[key], val] }))

  const finish = () => {
    store.setConsent(true)
    store.saveProfile({ ...p, name: p.name.trim() })
    onClose()
  }

  if (step === 0) {
    return (
      <Screen title="Welcome to HIGHLIGHT" subtitle="Dress for where you’re going" onClose={onClose}>
        <div className="space-y-4">
          <div className="rounded-[2rem] bg-secondary p-5 text-sm leading-relaxed text-secondary-foreground">
            <p>
              HIGHLIGHT keeps your profile, photos and results <strong>on this device</strong>. A photo leaves the device only when you run an AI feature, and then it goes to YouCam (Perfect Corp.), which keeps uploads for 30 days.
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>• We store your city, never your exact location.</li>
              <li>• Nothing changes your appearance unless you run an edit tool.</li>
              <li>• Delete your photos or all data at any time in Profile.</li>
            </ul>
          </div>
          <label className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
            <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[color:var(--primary)]" />
            <span className="text-sm font-semibold">I agree to HIGHLIGHT storing my profile and photos on this device.</span>
          </label>
          <button disabled={!consented} onClick={() => setStep(1)} className="w-full rounded-full bg-primary py-4 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40">
            Continue
          </button>
        </div>
      </Screen>
    )
  }

  if (step === 1) {
    return (
      <Screen title="Your photos" subtitle="Optional, and you can add them later" onClose={() => setStep(0)}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {([['facePhoto', 'Selfie', 'Face the camera, even light', faceRef], ['bodyPhoto', 'Full body', 'Head to toe, plain background', bodyRef]] as const).map(([key, label, hint, ref]) => (
              <button key={key} onClick={() => ref.current?.click()} className="overflow-hidden rounded-[1.5rem] bg-secondary text-left ring-1 ring-border">
                {p[key] ? (
                  <img src={p[key]} alt={label} className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <span className="grid aspect-[3/4] w-full place-items-center text-4xl" aria-hidden>📸</span>
                )}
                <span className="block px-3 pt-2 text-sm font-bold">{label}</span>
                <span className="block px-3 pb-3 text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
          <input ref={faceRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={(e) => pickPhoto('facePhoto', e.target.files?.[0])} />
          <input ref={bodyRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickPhoto('bodyPhoto', e.target.files?.[0])} />
          {photoError && <p role="alert" className="text-sm font-semibold text-[#b3261e]">{photoError}</p>}
          <p className="text-center text-xs text-muted-foreground">The selfie is used for skin, makeup and hair features; the full-body photo for outfit try-on.</p>
          <button onClick={() => setStep(2)} className="w-full rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30">
            {p.facePhoto || p.bodyPhoto ? 'Continue' : 'Skip for now'}
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen title="Your style" subtitle="Tune your recommendations" onClose={() => (existing ? onClose() : setStep(1))}>
      <div className="space-y-6 pb-4">
        <Field label="Your name">
          <input
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value })}
            placeholder="What should we call you?"
            maxLength={40}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 font-semibold"
          />
        </Field>

        <Field label="Home city">
          <select value={p.cityId} onChange={(e) => setP({ ...p, cityId: e.target.value })} className="w-full rounded-2xl border border-border bg-card px-4 py-3 font-semibold">
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
          </select>
          <button onClick={locate} className="mt-2 text-sm font-semibold text-primary">📍 Use my location</button>
          {locating && <p className="mt-1 text-xs text-muted-foreground">{locating}</p>}
        </Field>

        <Field label="Show me">
          <div className="flex flex-wrap gap-2">
            {([['all', 'Everything'], ['women', 'Womenswear'], ['men', 'Menswear']] as [StyleFor, string][]).map(([v, l]) => (
              <Chip key={v} label={l} selected={p.styleFor === v} onClick={() => setP({ ...p, styleFor: v })} />
            ))}
          </div>
        </Field>

        <Field label="Minimum coverage">
          <div className="flex flex-wrap gap-2">
            {(['minimal', 'moderate', 'modest'] as Coverage[]).map((c) => (
              <Chip key={c} label={c[0].toUpperCase() + c.slice(1)} selected={p.coverage === c} onClick={() => setP({ ...p, coverage: c })} />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Looks with less coverage are hidden, never just ranked lower.</p>
        </Field>

        <Field label="Undertone">
          <div className="flex flex-wrap gap-2">
            {(['warm', 'cool', 'neutral'] as Undertone[]).map((u) => (
              <Chip key={u} label={u[0].toUpperCase() + u.slice(1)} selected={p.undertone === u} onClick={() => setP({ ...p, undertone: u, undertoneSource: 'self' })} />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Not sure? Measure it later in My Palette.</p>
        </Field>

        <Field label="Favourite colours">
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map(([name, hex]) => {
              const on = p.favoriteColors.includes(hex)
              return (
                <button
                  key={name}
                  onClick={() => toggle('favoriteColors', hex)}
                  aria-pressed={on}
                  aria-label={name}
                  title={name}
                  className={`h-10 w-10 rounded-full ring-2 transition ${on ? 'ring-primary ring-offset-2 ring-offset-background' : 'ring-border'}`}
                  style={{ backgroundColor: hex }}
                />
              )
            })}
          </div>
        </Field>

        <Field label="Never suggest">
          <div className="flex flex-wrap gap-2">
            {[...new Set([...EXCLUSION_IDEAS, ...p.exclusions])].map((x) => (
              <Chip key={x} label={x} selected={p.exclusions.includes(x)} onClick={() => toggle('exclusions', x)} />
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const v = exclusion.trim()
              if (v && !p.exclusions.includes(v)) setP({ ...p, exclusions: [...p.exclusions, v] })
              setExclusion('')
            }}
          >
            <input value={exclusion} onChange={(e) => setExclusion(e.target.value)} placeholder="Add your own word" maxLength={30} className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm" />
            <button type="submit" className="rounded-full border border-border px-3 text-sm font-bold">Add</button>
          </form>
        </Field>

        {existing && (
          <button onClick={() => setStep(1)} className="w-full rounded-full border border-border py-3 text-sm font-bold">
            Change photos
          </button>
        )}

        <button onClick={finish} disabled={!p.name.trim()} className="w-full rounded-full bg-primary py-4 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40">
          {existing ? 'Save changes' : 'Finish setup'}
        </button>
        {!p.name.trim() && <p className="-mt-4 text-center text-xs text-muted-foreground">Add your name to finish.</p>}
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
