import { useState } from 'react'
import {
  BellIcon,
  ChevronRight,
  HeartIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
} from '../components/icons'
import { useApp } from '../components/app-context'
import {
  OCCASIONS,
  catalog,
  daysUntil,
  rankGarments,
  useStore,
} from '../store'
import { GarmentVisual } from '../stylist/GarmentCard'
import type { StylistView } from '../stylist/routes'

function RoutineStrip({
  label,
  steps,
  tint,
  ink,
  icon,
  tints,
  onClick,
}: {
  label: string
  steps: number
  tint: string
  ink: string
  icon: React.ReactNode
  tints: string[]
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-3xl p-2.5 pr-4 text-left transition-transform active:scale-[0.98]"
      style={{ backgroundColor: tint }}
    >
      <span
        className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-white/70"
        style={{ color: ink }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold" style={{ color: ink }}>
          {label}
        </p>
        <p className="text-sm" style={{ color: ink, opacity: 0.75 }}>
          {steps} steps
        </p>
      </div>
      <div className="flex -space-x-3">
        {tints.map((t, i) => (
          <div
            key={i}
            className="h-9 w-8 rounded-xl bg-white shadow-sm ring-2 ring-white/80"
          >
            <svg viewBox="0 0 26 40" className="h-full w-full p-1">
              <rect x="4" y="10" width="18" height="28" rx="5" fill={t} />
            </svg>
          </div>
        ))}
      </div>
      <ChevronRight width={18} style={{ color: ink, opacity: 0.6 }} />
    </button>
  )
}

export function Home({
  onOpenStylist,
  onOpenOccasion,
  onOpenSetup,
}: {
  onOpenStylist: (v: StylistView) => void
  onOpenOccasion: (preset?: string) => void
  onOpenSetup: () => void
}) {
  const tips = [
    "Don't forget sunscreen! It's the best anti-aging product 🌤️",
    'Double cleanse at night to melt away SPF 🫧',
    'Patch-test new actives on your jaw first 🧪',
  ]
  const [tip, setTip] = useState(0)
  const { navigate, notify } = useApp()
  const store = useStore()
  const name = store.profile?.name ?? 'there'
  const picks = rankGarments(catalog, store.profile).slice(0, 6)
  const upcoming = store.events
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0]

  return (
    <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onOpenSetup}
          className="grid h-10 w-10 place-items-center rounded-full text-primary transition-colors hover:bg-secondary"
          aria-label="Edit profile & preferences"
        >
          <MenuIcon />
        </button>
        <button
          onClick={() => notify('No new notifications 🔔')}
          className="grid h-10 w-10 place-items-center rounded-full text-primary transition-colors hover:bg-secondary"
          aria-label="Notifications"
        >
          <BellIcon />
        </button>
      </div>

      {/* Greeting */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            Good morning,
            <br />
            <span className="text-primary">{name}!</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Glow a little today ✨
          </p>
        </div>
        <div
          className="mt-1 grid h-16 w-20 place-items-center overflow-hidden rounded-3xl"
          style={{
            background:
              'linear-gradient(135deg, #ffe3f0 0%, #ffd6e6 100%)',
          }}
          aria-hidden
        >
          <svg width="46" height="40" viewBox="0 0 46 40" fill="none">
            {/* sun */}
            <circle cx="17" cy="15" r="7.5" fill="#ffd166" />
            {[...Array(8)].map((_, i) => {
              const a = (i * Math.PI) / 4
              return (
                <line
                  key={i}
                  x1={17 + Math.cos(a) * 10}
                  y1={15 + Math.sin(a) * 10}
                  x2={17 + Math.cos(a) * 13}
                  y2={15 + Math.sin(a) * 13}
                  stroke="#ffd166"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )
            })}
            {/* cloud */}
            <path
              d="M22 30a5 5 0 0 1 4.6-5 6.5 6.5 0 0 1 12.4 1.2A4.4 4.4 0 0 1 38 35H26a4 4 0 0 1-4-5Z"
              fill="#fff"
              stroke="#f9a8c8"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </header>

      {/* Skin mood hero */}
      <section
        className="relative overflow-hidden rounded-[2rem] p-5 text-white shadow-lg shadow-primary/25"
        style={{
          background: 'linear-gradient(135deg, #f9a8c8 0%, #f472a0 100%)',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
          Today's Skin Mood
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-full bg-white/85 text-4xl shadow-inner">
            <span aria-hidden>☺️</span>
          </div>
          <div>
            <p className="font-display text-xl font-bold">Looking good!</p>
            <p className="text-sm text-white/85">
              Keep it up, your skin loves the care 💕
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('progress')}
          className="mt-5 flex w-full items-center justify-between rounded-full bg-white px-5 py-3 font-display font-bold text-primary transition-transform active:scale-[0.98]"
        >
          Record Skin
          <ChevronRight width={18} />
        </button>
      </section>

      {/* Where are you going? */}
      <button
        onClick={() => onOpenOccasion()}
        className="flex items-center gap-4 rounded-[1.75rem] border border-border bg-card p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
      >
        <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-secondary text-xl">
          ✨
        </span>
        <div className="flex-1">
          <p className="font-display font-bold leading-tight">Where are you going?</p>
          <p className="text-xs text-muted-foreground">
            Get an occasion-ready outfit & color plan
          </p>
        </div>
        <ChevronRight width={18} className="text-muted-foreground" />
      </button>

      {/* Upcoming event */}
      {upcoming && (
        <button
          onClick={() => onOpenOccasion(upcoming.type)}
          className="flex items-center gap-4 rounded-[1.75rem] p-4 text-left text-white shadow-lg shadow-primary/25 transition-transform active:scale-[0.99]"
          style={{ background: 'linear-gradient(135deg, #c3a8ff, #f472a0)' }}
        >
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-white/25 text-2xl">
            💒
          </span>
          <div className="flex-1">
            <p className="font-display font-bold leading-tight">
              {upcoming.title} in {daysUntil(upcoming.date)} days
            </p>
            <p className="text-xs text-white/85">Tap for outfits & skin prep</p>
          </div>
          <ChevronRight width={18} className="text-white/80" />
        </button>
      )}

      {/* Your Style Picks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Your Style Picks</h2>
          <button
            onClick={() => onOpenStylist('cultural')}
            className="text-sm font-semibold text-primary"
          >
            See all
          </button>
        </div>
        <div className="scroll-area flex gap-3 overflow-x-auto pb-1">
          {picks.map((r) => (
            <button
              key={r.garment.id}
              onClick={() => onOpenStylist('cultural')}
              className="w-28 flex-shrink-0 text-left"
            >
              <div className="w-28">
                <GarmentVisual colors={r.garment.colors} />
              </div>
              <p className="mt-1.5 truncate font-display text-xs font-bold">
                {r.garment.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {r.garment.region}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Daily routine */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Daily Routine</h2>
          <button
            onClick={() => navigate('routine')}
            className="text-sm font-semibold text-primary"
          >
            Edit
          </button>
        </div>
        <RoutineStrip
          label="Morning"
          steps={4}
          tint="var(--morning)"
          ink="var(--morning-ink)"
          icon={<SunIcon />}
          tints={['#bfe3ff', '#cfe8ff', '#d9f0ff']}
          onClick={() => navigate('routine')}
        />
        <RoutineStrip
          label="Night"
          steps={5}
          tint="var(--night)"
          ink="var(--night-ink)"
          icon={<MoonIcon />}
          tints={['#e6dcff', '#d7c8ff', '#efe7ff']}
          onClick={() => navigate('routine')}
        />
      </section>

      {/* Tip */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Today's Tip</h2>
        <div className="flex items-center gap-4 rounded-3xl bg-secondary p-4">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-white text-primary">
            <HeartIcon width={22} />
          </span>
          <p className="text-sm font-semibold text-secondary-foreground">
            {tips[tip]}
          </p>
        </div>
        <div className="flex justify-center gap-1.5">
          {tips.map((_, i) => (
            <button
              key={i}
              onClick={() => setTip(i)}
              aria-label={`Tip ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === tip ? 20 : 8,
                backgroundColor: i === tip ? 'var(--primary)' : 'var(--border)',
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
