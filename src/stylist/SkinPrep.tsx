import { useMemo, useState } from 'react'
import { Chip, Screen } from '../components/overlay'
import { useApp } from '../components/app-context'
import { daysUntil, formatDate, todayIso, useStore } from '../store'

type Step = { day: string; focus: string; note: string }

/** Conservative, event-relative plan. No new actives close to the event; no medical claims. */
export function buildPlan(days: number, gentle: boolean): Step[] {
  if (gentle) {
    return [
      { day: 'Every day', focus: 'Gentle cleanse', note: 'A mild cleanser morning and night, as tolerated.' },
      { day: 'Every day', focus: 'Moisturise', note: 'Keep your skin barrier calm and hydrated.' },
      { day: 'Every morning', focus: 'Sun protection', note: 'Broad-spectrum SPF 30 or higher.' },
      { day: days >= 7 ? 'Event week' : 'Until the event', focus: 'Nothing new', note: 'Stick to products your skin already knows.' },
      { day: 'Event day', focus: 'Prep', note: 'Cleanse, moisturise, SPF, then makeup.' },
    ]
  }
  const plan: Step[] = []
  if (days > 14) {
    plan.push({ day: `Day 1–${days - 14}`, focus: 'Build the basics', note: 'Gentle cleanser, moisturiser and daily SPF, every day.' })
    plan.push({ day: `${14} to 6 days before`, focus: 'Hydration', note: 'Add a hydrating serum only if you already use one without irritation. No brand-new actives.' })
  } else if (days > 5) {
    plan.push({ day: `Now to 6 days before`, focus: 'Keep it simple', note: 'Gentle cleanser, moisturiser and daily SPF. It is too close to start new actives.' })
  }
  if (days > 1) {
    plan.push({ day: days > 5 ? 'Final 5 days' : `Next ${days - 1} day${days - 1 === 1 ? '' : 's'}`, focus: 'Stabilise', note: 'Pause exfoliating acids and retinoids if they ever irritate you. Prioritise moisturiser and sleep.' })
  }
  if (days >= 1) {
    plan.push({ day: days === 1 ? 'Today' : 'Day before', focus: 'Calm and prep', note: 'Only a familiar mask, if any. Drink water and sleep well.' })
  }
  plan.push({ day: days === 0 ? 'Today' : 'Event day', focus: 'Prep', note: 'Cleanse, moisturise, SPF, then a hydrating base for makeup.' })
  return plan
}

export function SkinPrep({ onClose, onOpenFeature }: { onClose: () => void; onOpenFeature: (id: string) => void }) {
  const store = useStore()
  const { notify } = useApp()
  const upcoming = store.events.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))
  const [eventId, setEventId] = useState(upcoming[0]?.id ?? 'new')
  const chosen = store.events.find((e) => e.id === eventId)
  const [title, setTitle] = useState(chosen?.title ?? '')
  const [date, setDate] = useState(chosen?.date ?? '')
  const [sensitive, setSensitive] = useState<string[]>([])
  const [generated, setGenerated] = useState(false)

  const eventTitle = chosen?.title ?? title
  const eventDate = chosen?.date ?? date
  const days = eventDate ? daysUntil(eventDate) : NaN
  const gentle = sensitive.some((s) => ['Active irritation', 'Pregnancy or breastfeeding', 'On prescription skin medication', 'Prefer not to say'].includes(s))
  const plan = useMemo(() => (Number.isFinite(days) && days >= 0 ? buildPlan(days, gentle) : []), [days, gentle])

  const toggle = (v: string) => setSensitive((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))

  const generate = () => {
    if (!eventDate) return notify('Choose a date for the event.')
    if (days < 0) return notify('That date has passed. Pick a future date.')
    if (!chosen) store.upsertEvent({ title: title.trim() || 'Event', type: 'event', date })
    setGenerated(true)
  }

  const lastScan = store.scans.at(-1)

  return (
    <Screen title="Skin Prep" subtitle="Get event-ready, gently" onClose={onClose}>
      <div className="space-y-4">
        <label className="block text-sm font-bold">
          Event
          <select value={eventId} onChange={(e) => { setEventId(e.target.value); setGenerated(false) }} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold">
            {upcoming.map((e) => <option key={e.id} value={e.id}>{e.title} · {formatDate(e.date)}</option>)}
            <option value="new">A new event…</option>
          </select>
        </label>

        {eventId === 'new' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">
              Name
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cousin’s wedding" className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold" />
            </label>
            <label className="text-sm font-bold">
              Date
              <input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold" />
            </label>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-bold">
            Anything to be careful about? <span className="font-normal text-muted-foreground">(optional, stays on this device)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {['Sensitive skin', 'Allergies', 'Active irritation', 'Pregnancy or breastfeeding', 'On prescription skin medication', 'Prefer not to say'].map((s) => (
              <Chip key={s} label={s} selected={sensitive.includes(s)} onClick={() => toggle(s)} />
            ))}
          </div>
        </div>

        <button onClick={generate} className="w-full rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30">
          Build my plan
        </button>
      </div>

      {generated && plan.length > 0 && (
        <div className="mt-6 space-y-3 pb-4">
          <h2 className="font-display text-lg font-bold">
            {eventTitle || 'Your event'} · {days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} to go`}
          </h2>
          {gentle && (
            <div className="rounded-2xl border border-accent/50 bg-[#fff6e0] p-3 text-sm text-accent-foreground">
              Based on what you shared, this is a conservative plan with no new actives. For medical concerns, ask a dermatologist or pharmacist.
            </div>
          )}
          <ol className="space-y-2.5">
            {plan.map((step, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-card p-3.5 shadow-sm ring-1 ring-border/50">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-display text-sm font-bold">{step.day} · {step.focus}</p>
                  <p className="text-sm text-muted-foreground">{step.note}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
            {lastScan
              ? `Your last YouCam skin scan was on ${formatDate(lastScan.date.slice(0, 10))}. Scan again under the same light to compare.`
              : 'Track progress with a YouCam skin scan now and another a few days before the event, in the same light.'}
            <button onClick={() => onOpenFeature('skin-analysis')} className="mt-2 block font-bold text-primary">Run a skin scan</button>
          </div>
          <p className="text-xs text-muted-foreground">Educational guidance, not a diagnosis or a promise of results.</p>
        </div>
      )}
    </Screen>
  )
}
