import { useState } from 'react'
import {
  BackIcon,
  BagIcon,
  CheckIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
} from '../components/icons'
import { ProductThumb } from '../components/ProductThumb'
import { useApp } from '../components/app-context'

type Step = {
  n: number
  name: string
  product: string
  tint: string
  badge: string
}

const morning: Step[] = [
  { n: 1, name: 'Cleanser', product: 'Cetaphil Gentle Skin Cleanser', tint: '#cfe3ff', badge: '#f9a8c8' },
  { n: 2, name: 'Toner', product: 'Hadalabo Gokujyun Lotion', tint: '#ffe3b3', badge: '#ffd166' },
  { n: 3, name: 'Serum', product: 'The Ordinary Niacinamide 10%', tint: '#e6dcff', badge: '#c3a8ff' },
  { n: 4, name: 'Moisturizer', product: 'Illiyoon Ceramide Ato Cream', tint: '#d4f5e4', badge: '#8fd9b6' },
  { n: 5, name: 'Sunscreen', product: 'Skin1004 Hyalu-Cica Water-Fit Sun', tint: '#ffd9e6', badge: '#8fd99c' },
]

const night: Step[] = [
  { n: 1, name: 'Oil Cleanser', product: 'Banila Co Clean It Zero', tint: '#e6dcff', badge: '#c3a8ff' },
  { n: 2, name: 'Cleanser', product: 'Cetaphil Gentle Skin Cleanser', tint: '#cfe3ff', badge: '#f9a8c8' },
  { n: 3, name: 'Exfoliant', product: 'Paula’s Choice 2% BHA', tint: '#ffe3b3', badge: '#ffd166' },
  { n: 4, name: 'Retinol', product: 'The Inkey List Retinol Serum', tint: '#ffd9e6', badge: '#f9a8c8' },
  { n: 5, name: 'Night Cream', product: 'CeraVe Skin Renewing Cream', tint: '#d4f5e4', badge: '#8fd9b6' },
]

export function Routine() {
  const { navigate, notify } = useApp()
  const [mode, setMode] = useState<'morning' | 'night'>('morning')
  const [done, setDone] = useState<Record<string, boolean>>({
    'morning-1': true,
    'morning-2': true,
    'morning-3': true,
    'morning-4': true,
    'morning-5': true,
  })
  const steps = mode === 'morning' ? morning : night

  const toggle = (key: string) =>
    setDone((d) => ({ ...d, [key]: !d[key] }))

  return (
    <div className="flex flex-col px-5 pb-6 pt-4">
      <div className="flex items-center justify-between py-1">
        <button
          onClick={() => navigate('home')}
          className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-secondary"
          aria-label="Back to home"
        >
          <BackIcon />
        </button>
        <button
          onClick={() => notify('Your shopping bag is empty 🛍️')}
          className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-secondary"
          aria-label="Shopping bag"
        >
          <BagIcon />
        </button>
      </div>

      <h1 className="mb-4 text-2xl font-bold">My Routine</h1>

      {/* Segmented Morning / Night */}
      <div
        role="tablist"
        aria-label="Routine time"
        className="mb-5 flex gap-1 rounded-full bg-secondary p-1"
      >
        {(['morning', 'night'] as const).map((m) => {
          const active = mode === m
          return (
            <button
              key={m}
              role="tab"
              aria-selected={active}
              onClick={() => setMode(m)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 font-display text-sm font-bold capitalize transition-colors ${
                active
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary-foreground/70'
              }`}
            >
              {m === 'morning' ? <SunIcon width={18} /> : <MoonIcon width={18} />}
              {m}
            </button>
          )
        })}
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {steps.map((s) => {
          const key = `${mode}-${s.n}`
          const checked = !!done[key]
          return (
            <li
              key={key}
              className="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-sm ring-1 ring-border/50"
            >
              <span
                className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: s.badge }}
              >
                {s.n}
              </span>
              <ProductThumb tint={s.tint} />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold leading-tight">{s.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {s.product}
                </p>
              </div>
              <SunIcon
                width={20}
                className="flex-shrink-0 text-accent"
                aria-hidden
              />
              <button
                onClick={() => toggle(key)}
                aria-pressed={checked}
                aria-label={`Mark ${s.name} ${checked ? 'incomplete' : 'complete'}`}
                className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border-2 transition-colors ${
                  checked
                    ? 'border-primary bg-primary text-white'
                    : 'border-border text-transparent'
                }`}
              >
                {checked && <CheckIcon width={18} className="animate-pop" />}
              </button>
            </li>
          )
        })}
      </ol>

      <button
        onClick={() => notify('Product added to your routine ✨')}
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
      >
        <PlusIcon width={20} />
        Add Product
      </button>
    </div>
  )
}
