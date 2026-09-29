import { useMemo, useState } from 'react'
import { Chip, Screen } from '../components/overlay'
import { daysUntil, useStore } from '../store'

type Plan = { day: string; focus: string; note: string }[]

function buildPlan(days: number, gentle: boolean): Plan {
  const clamp = Math.max(1, Math.min(days, 30))
  if (gentle) {
    // Safety-gated: no new actives, conservative baseline only.
    return [
      { day: 'Daily', focus: 'Gentle cleanse', note: 'Mild cleanser morning & night as tolerated.' },
      { day: 'Daily', focus: 'Moisturize', note: 'Keep your barrier calm and hydrated.' },
      { day: 'Daily', focus: 'Sun protection', note: 'Broad-spectrum SPF every morning.' },
      { day: 'Event week', focus: 'Rest & hydrate', note: 'No new products — keep to what your skin knows.' },
    ]
  }
  const plan: Plan = [
    { day: `Days ${clamp}–${Math.max(clamp - 6, clamp - 6)}`, focus: 'Establish basics', note: 'Consistent gentle cleanse, moisturizer, daily SPF.' },
  ]
  if (clamp > 10) {
    plan.push({ day: `Days ${clamp - 7}–10`, focus: 'Hydration boost', note: 'Add a hydrating serum if already tolerated. No brand-new actives.' })
  }
  plan.push({ day: 'Final 5 days', focus: 'Stabilize', note: 'Pause any actives that could irritate. Prioritize barrier care.' })
  plan.push({ day: 'Day before', focus: 'Calm & prep', note: 'Hydrating mask if familiar, gentle routine, good sleep.' })
  plan.push({ day: 'Event day', focus: 'Glow', note: 'Cleanse, moisturize, SPF, and a dewy base.' })
  return plan
}

export function SkinPrep({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [title, setTitle] = useState(store.events[0]?.title ?? 'Wedding')
  const [date, setDate] = useState(store.events[0]?.date ?? '')
  const [sensitive, setSensitive] = useState<string[]>([])
  const [generated, setGenerated] = useState(false)

  const days = date ? daysUntil(date) : 30
  const gentle =
    sensitive.includes('Active irritation') ||
    sensitive.includes('Pregnancy / breastfeeding') ||
    sensitive.includes('Prefer to skip')

  const plan = useMemo(() => buildPlan(days, gentle), [days, gentle])

  const toggle = (v: string) =>
    setSensitive((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))

  const generate = () => {
    if (date) {
      store.addEvent({ title, type: 'event', date })
    }
    setGenerated(true)
  }

  return (
    <Screen title="Skin Prep" subtitle="Get event-ready, gently" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-3xl bg-secondary p-4">
          <p className="text-sm font-semibold text-secondary-foreground">
            Tell us about your event — e.g. “I have a wedding to attend in 30 days.”
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-bold">
            Event
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
            />
          </label>
          <label className="text-sm font-bold">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold">
            Anything to be gentle about? <span className="font-normal text-muted-foreground">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {['Sensitive skin', 'Allergies', 'Active irritation', 'Pregnancy / breastfeeding', 'Prefer to skip'].map((s) => (
              <Chip key={s} label={s} selected={sensitive.includes(s)} onClick={() => toggle(s)} />
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          className="w-full rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30"
        >
          Build my plan
        </button>
      </div>

      {generated && (
        <div className="mt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold">
              {title} · {days >= 0 ? `${days} days to go` : 'past date'}
            </h2>
          </div>

          {gentle && (
            <div className="mb-3 rounded-2xl border border-accent/50 bg-[#fff6e0] p-3 text-sm text-accent-foreground">
              Based on what you shared, this is a conservative baseline — no new
              actives. For medical concerns, please consult a professional.
            </div>
          )}

          <ol className="space-y-2.5">
            {plan.map((step, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-card p-3.5 shadow-sm ring-1 ring-border/50">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-sm font-bold">
                    {step.day} · {step.focus}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.note}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
            This plan links to your <strong>Morning / Night routine</strong>,
            daily check-ins, and the <strong>Progress</strong> screen. Extra
            progress photos are always optional. We never diagnose conditions or
            promise results.
          </div>
        </div>
      )}
    </Screen>
  )
}
