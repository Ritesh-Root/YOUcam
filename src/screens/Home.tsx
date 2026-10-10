import { useMemo, useState } from 'react'
import { ChevronRight, HeartIcon, MenuIcon, MoonIcon, SunIcon } from '../components/icons'
import { useApp } from '../components/app-context'
import { daysUntil, formatDate, paletteFor, todayIso, useStore } from '../store'
import { cityById, CITIES } from '../trends/data'
import { rankTrends } from '../trends/engine'
import type { StylistView } from '../stylist/routes'

function greeting(): string {
  const h = new Date().getHours()
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const TIPS = [
  'Sunscreen every morning, even on cloudy days.',
  'Double cleanse at night if you wore sunscreen or makeup.',
  'Patch-test a new product on your jaw for a few days first.',
]

export function Home({
  onOpenStylist,
  onOpenOccasion,
  onOpenSetup,
  onOpenFeature,
}: {
  onOpenStylist: (v: StylistView) => void
  onOpenOccasion: (preset?: { occasion?: string; eventId?: string }) => void
  onOpenSetup: () => void
  onOpenFeature: (id: string) => void
}) {
  const [tip, setTip] = useState(0)
  const { navigate } = useApp()
  const store = useStore()
  const profile = store.profile
  const city = cityById(profile?.cityId) ?? CITIES[0]
  const upcoming = store.events
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const picks = useMemo(
    () =>
      rankTrends({
        city,
        profile,
        palette: paletteFor(profile),
        weather: null,
        likes: store.likes,
        dislikes: store.dislikes,
        trendDial: store.trendDial,
      }).ranked.slice(0, 6),
    [city, profile, store.likes, store.dislikes, store.trendDial],
  )

  const lastScan = store.scans.at(-1)
  const today = store.checkins[todayIso()] ?? {}
  const am = store.routine.filter((p) => p.time === 'am').length
  const pm = store.routine.filter((p) => p.time === 'pm').length

  return (
    <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={onOpenSetup} className="grid h-10 w-10 place-items-center rounded-full text-primary transition-colors hover:bg-secondary" aria-label="Edit profile and preferences">
          <MenuIcon />
        </button>
        <button onClick={() => onOpenStylist('trends')} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">
          📍 {city.name}
        </button>
      </div>

      <header>
        <h1 className="text-2xl font-bold leading-tight">
          {greeting()}
          {profile?.name ? (
            <>
              ,<br />
              <span className="text-primary">{profile.name}</span>
            </>
          ) : null}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Dress for where you’re going.</p>
      </header>

      {!profile && (
        <button onClick={onOpenSetup} className="flex items-center gap-4 rounded-[1.75rem] border border-primary/40 bg-card p-4 text-left">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-secondary text-xl" aria-hidden>👋</span>
          <div className="flex-1">
            <p className="font-display font-bold leading-tight">Set up your profile</p>
            <p className="text-xs text-muted-foreground">Your city, colours and what to leave out. Two minutes.</p>
          </div>
          <ChevronRight width={18} className="text-muted-foreground" />
        </button>
      )}

      <section className="rounded-[2rem] bg-foreground p-5 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Where are you going?</p>
        <p className="mt-2 font-display text-2xl font-bold leading-tight">See what’s trending where your event is</p>
        <p className="mt-2 text-sm text-white/80">Outfits and makeup from dated local sources, checked against the forecast, then on your own photo.</p>
        <button onClick={() => onOpenOccasion()} className="mt-5 w-full rounded-full bg-white py-3 font-display font-bold text-foreground">
          Plan a look
        </button>
      </section>

      {upcoming && (
        <button
          onClick={() => onOpenOccasion({ eventId: upcoming.id })}
          className="flex items-center gap-4 rounded-[1.75rem] p-4 text-left text-white shadow-lg shadow-primary/25"
          style={{ background: 'linear-gradient(135deg, #b5468b, #f472a0)' }}
        >
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-white/25 text-2xl" aria-hidden>📅</span>
          <div className="flex-1">
            <p className="font-display font-bold leading-tight">
              {upcoming.title} {daysUntil(upcoming.date) === 0 ? 'is today' : `in ${daysUntil(upcoming.date)} day${daysUntil(upcoming.date) === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs text-white/85">
              {formatDate(upcoming.date)}
              {upcoming.cityId ? ` · ${cityById(upcoming.cityId)?.name}` : ''} · tap for looks
            </p>
          </div>
          <ChevronRight width={18} className="text-white/80" />
        </button>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Trending in {city.country}</h2>
          <button onClick={() => onOpenStylist('trends')} className="text-sm font-semibold text-primary">See all</button>
        </div>
        <div className="scroll-area flex gap-3 overflow-x-auto pb-1">
          {picks.map((r) => (
            <button key={r.trend.id} onClick={() => onOpenStylist('trends')} className="w-36 flex-shrink-0 overflow-hidden rounded-2xl bg-card text-left ring-1 ring-border/60">
              <div className="flex h-16">
                {r.trend.colors.map((c) => <span key={c} className="flex-1" style={{ backgroundColor: c }} />)}
              </div>
              <div className="p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">{r.trend.kind}</p>
                <p className="line-clamp-2 font-display text-xs font-bold leading-snug">{r.trend.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-secondary p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/80">Skin</p>
        {lastScan ? (
          <div className="mt-2">
            <p className="font-display text-xl font-bold">
              {lastScan.overall !== undefined ? `Overall ${Math.round(lastScan.overall)} / 100` : `${lastScan.concerns.length} concerns scored`}
            </p>
            <p className="text-sm text-muted-foreground">Last YouCam scan: {formatDate(lastScan.date.slice(0, 10))}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-secondary-foreground">No scans yet. A YouCam skin scan scores up to 16 concerns from one selfie.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => onOpenFeature('skin-analysis')} className="rounded-full bg-primary py-2.5 text-sm font-bold text-white">
            {lastScan ? 'Scan again' : 'Scan my skin'}
          </button>
          <button onClick={() => navigate('progress')} className="rounded-full bg-card py-2.5 text-sm font-bold text-primary">
            My progress
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Daily routine</h2>
          <button onClick={() => navigate('routine')} className="text-sm font-semibold text-primary">{store.routine.length ? 'Open' : 'Set up'}</button>
        </div>
        {([['am', 'Morning', am, today.am, SunIcon, 'var(--morning)', 'var(--morning-ink)'], ['pm', 'Night', pm, today.pm, MoonIcon, 'var(--night)', 'var(--night-ink)']] as const).map(([key, label, count, done, Icon, tint, ink]) => (
          <button key={key} onClick={() => navigate('routine')} className="flex w-full items-center gap-3 rounded-3xl p-2.5 pr-4 text-left" style={{ backgroundColor: tint }}>
            <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-white/70" style={{ color: ink }}><Icon /></span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold" style={{ color: ink }}>{label}</p>
              <p className="text-sm" style={{ color: ink, opacity: 0.8 }}>
                {count ? `${count} step${count === 1 ? '' : 's'} · ${done ? 'done today' : 'not done yet'}` : 'No products added'}
              </p>
            </div>
            <ChevronRight width={18} style={{ color: ink, opacity: 0.6 }} />
          </button>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Tip</h2>
        <div className="flex items-center gap-4 rounded-3xl bg-secondary p-4">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-white text-primary"><HeartIcon width={22} /></span>
          <p className="text-sm font-semibold text-secondary-foreground">{TIPS[tip]}</p>
        </div>
        <div className="flex justify-center gap-1.5">
          {TIPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setTip(i)}
              aria-label={`Tip ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{ width: i === tip ? 20 : 8, backgroundColor: i === tip ? 'var(--primary)' : 'var(--border)' }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
