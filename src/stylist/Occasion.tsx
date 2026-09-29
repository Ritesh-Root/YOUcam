import { useMemo, useState } from 'react'
import { Chip, Screen } from '../components/overlay'
import { OCCASIONS, catalog, rankGarments, useStore } from '../store'
import { GarmentCard } from './GarmentCard'
import type { StylistView } from './routes'

const CEREMONIES = ['Mehndi', 'Sangeet', 'Wedding day', 'Reception']

export function Occasion({
  onClose,
  onNavigate,
  preset,
}: {
  onClose: () => void
  onNavigate: (v: StylistView) => void
  preset?: string
}) {
  const store = useStore()
  const [occasion, setOccasion] = useState<string | null>(preset ?? null)
  const [date, setDate] = useState('')
  const [role, setRole] = useState('Guest')
  const [dressCode, setDressCode] = useState('')
  const [venue, setVenue] = useState('')
  const [ceremony, setCeremony] = useState('')
  const [submitted, setSubmitted] = useState(!!preset)

  const ranked = useMemo(() => {
    if (!occasion) return []
    return rankGarments(catalog, store.profile, occasion).filter(
      (r) => !store.dislikes.includes(r.garment.id),
    )
  }, [occasion, store.profile, store.dislikes])

  const save = () => {
    if (!occasion) return
    const label = OCCASIONS.find((o) => o.id === occasion)?.label ?? occasion
    store.addEvent({
      title: ceremony || label,
      type: occasion,
      date: date || new Date().toISOString().slice(0, 10),
      role,
      dressCode,
      venue,
      ceremony: ceremony || undefined,
    })
  }

  return (
    <Screen title="Where are you going?" subtitle="Get an occasion-ready look" onClose={onClose}>
      <div className="mb-5 grid grid-cols-3 gap-2.5">
        {OCCASIONS.map((o) => {
          const on = occasion === o.id
          return (
            <button
              key={o.id}
              onClick={() => {
                setOccasion(o.id)
                setSubmitted(false)
              }}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs font-bold transition ${
                on ? 'bg-primary text-white' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <span className="text-xl">{o.emoji}</span>
              {o.label}
            </button>
          )
        })}
      </div>

      {occasion && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
              />
            </label>
            <label className="text-sm font-bold">
              Your role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
              >
                {['Guest', 'Close family', 'Bride/Groom', 'Host'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>

          {occasion === 'wedding' && (
            <div>
              <p className="mb-2 text-sm font-bold">Ceremony</p>
              <div className="flex flex-wrap gap-2">
                {CEREMONIES.map((c) => (
                  <Chip key={c} label={c} selected={ceremony === c} onClick={() => setCeremony(c)} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">
              Dress code
              <input
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                placeholder="e.g. festive"
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
              />
            </label>
            <label className="text-sm font-bold">
              Venue (optional)
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. outdoor"
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
              />
            </label>
          </div>

          <button
            onClick={() => {
              save()
              setSubmitted(true)
            }}
            className="w-full rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30"
          >
            Show my looks
          </button>
        </div>
      )}

      {submitted && (
        <div className="mt-6 space-y-4">
          <h2 className="font-display text-lg font-bold">Recommended looks</h2>
          {ranked.length === 0 ? (
            <p className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
              Your exclusions rule out everything here. Relax an exclusion in your
              profile to see options.
            </p>
          ) : (
            ranked.map((r) => (
              <GarmentCard
                key={r.garment.id}
                ranked={r}
                occasion={occasion ?? undefined}
                onTryOn={() => onNavigate('tryon')}
                onPlanPrep={() => onNavigate('skinprep')}
              />
            ))
          )}
        </div>
      )}
    </Screen>
  )
}
