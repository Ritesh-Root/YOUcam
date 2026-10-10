import { useState } from 'react'
import { BackIcon, CheckIcon, MoonIcon, PlusIcon, SunIcon } from '../components/icons'
import { ProductThumb } from '../components/ProductThumb'
import { useApp } from '../components/app-context'
import { Chip } from '../components/overlay'
import { ROUTINE_STEPS, routineWarnings, todayIso, useStore } from '../store'

const TINTS = ['#cfe3ff', '#ffe3b3', '#e6dcff', '#d4f5e4', '#ffd9e6']

export function Routine() {
  const { navigate } = useApp()
  const store = useStore()
  const [mode, setMode] = useState<'am' | 'pm'>(new Date().getHours() < 15 ? 'am' : 'pm')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [step, setStep] = useState(ROUTINE_STEPS[0])
  const steps = store.routine
    .filter((p) => p.time === mode)
    .sort((a, b) => ROUTINE_STEPS.indexOf(a.step) - ROUTINE_STEPS.indexOf(b.step))
  const done = Boolean(store.checkins[todayIso()]?.[mode])
  const warnings = routineWarnings(store.routine)

  const add = () => {
    if (!name.trim()) return
    store.addRoutineProduct({ name: name.trim(), step, time: mode })
    setName('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col px-5 pb-6 pt-4">
      <div className="flex items-center py-1">
        <button onClick={() => navigate('home')} className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-secondary" aria-label="Back to home">
          <BackIcon />
        </button>
      </div>

      <h1 className="mb-4 text-2xl font-bold">My Routine</h1>

      <div role="tablist" aria-label="Routine time" className="mb-5 flex gap-1 rounded-full bg-secondary p-1">
        {(['am', 'pm'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 font-display text-sm font-bold transition-colors ${mode === m ? 'bg-white text-primary shadow-sm' : 'text-secondary-foreground/70'}`}
          >
            {m === 'am' ? <SunIcon width={18} /> : <MoonIcon width={18} />}
            {m === 'am' ? 'Morning' : 'Night'}
          </button>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 space-y-1.5 rounded-2xl border border-accent/50 bg-[#fff6e0] p-3 text-sm text-accent-foreground">
          {warnings.map((w) => <p key={w}>{w}</p>)}
        </div>
      )}

      {steps.length === 0 ? (
        <div className="rounded-3xl bg-secondary p-6 text-center">
          <p className="font-display font-bold text-secondary-foreground">No {mode === 'am' ? 'morning' : 'night'} products yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add what you actually use. A simple {mode === 'am' ? 'morning' : 'night'} routine is a gentle cleanser and a moisturiser{mode === 'am' ? ', then sunscreen' : ''}.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-sm ring-1 ring-border/50">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>
              <ProductThumb tint={TINTS[i % TINTS.length]} />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold leading-tight">{s.step}</p>
                <p className="truncate text-sm text-muted-foreground">{s.name}</p>
              </div>
              <button onClick={() => store.removeRoutineProduct(s.id)} className="text-xs font-bold text-muted-foreground" aria-label={`Remove ${s.name}`}>
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}

      {steps.length > 0 && (
        <button
          onClick={() => store.checkIn(mode, !done)}
          aria-pressed={done}
          className={`mt-4 flex items-center justify-center gap-2 rounded-full py-3.5 font-display font-bold transition ${done ? 'bg-[#e6f7ee] text-success' : 'border border-border bg-card text-secondary-foreground'}`}
        >
          {done && <CheckIcon width={18} className="animate-pop" />}
          {done ? `${mode === 'am' ? 'Morning' : 'Night'} routine done today` : `Mark ${mode === 'am' ? 'morning' : 'night'} routine done`}
        </button>
      )}

      {adding ? (
        <div className="mt-5 space-y-3 rounded-3xl bg-secondary p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name, e.g. gentle foaming cleanser"
            maxLength={60}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
          />
          <div className="flex flex-wrap gap-2">
            {ROUTINE_STEPS.map((s) => <Chip key={s} label={s} selected={step === s} onClick={() => setStep(s)} />)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setAdding(false)} className="rounded-full border border-border py-3 text-sm font-bold">Cancel</button>
            <button onClick={add} disabled={!name.trim()} className="rounded-full bg-primary py-3 text-sm font-bold text-white disabled:opacity-40">
              Add to {mode === 'am' ? 'morning' : 'night'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-5 flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30">
          <PlusIcon width={20} />
          Add product
        </button>
      )}
    </div>
  )
}
