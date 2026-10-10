import { useEffect, useMemo, useState } from 'react'
import { paletteFor, useStore } from '../store'
import { getHealth } from '../youcam'
import { SNAPSHOT_DATE, TRENDS, type City, type Occasion } from './data'
import { formatSourceDate, rankTrends, type RankedTrend, type Weather } from './engine'
import { LookCard, type LookActions } from './LookCard'

type Live = { available: boolean; reason?: string; source?: string; fetched_at?: string; items?: { title: string; channel: string; url: string; published_at: string }[] }

export function TrendResults({
  city,
  occasion,
  weather,
  kind,
  actions,
}: {
  city: City
  occasion?: Occasion
  weather: Weather | null
  kind?: 'outfit' | 'makeup'
  actions: LookActions
}) {
  const store = useStore()
  const [showHidden, setShowHidden] = useState(false)
  const { ranked, excluded } = useMemo(
    () =>
      rankTrends({
        city,
        occasion,
        profile: store.profile,
        palette: paletteFor(store.profile),
        weather,
        likes: store.likes,
        dislikes: store.dislikes,
        trendDial: store.trendDial,
      }),
    [city, occasion, store.profile, weather, store.likes, store.dislikes, store.trendDial],
  )
  const shown = kind ? ranked.filter((r) => r.trend.kind === kind) : ranked
  const dismissed = TRENDS.filter((t) => t.region === city.region && store.dislikes.includes(t.id))
  const sourceCount = new Set(TRENDS.filter((t) => t.region === city.region).flatMap((t) => t.sources.map((s) => s.url))).size

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-secondary p-3">
        <label htmlFor="trend-dial" className="flex items-center justify-between text-xs font-bold text-secondary-foreground">
          <span>Classic</span>
          <span>How much should trends count?</span>
          <span>On-trend</span>
        </label>
        <input
          id="trend-dial"
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={store.trendDial}
          onChange={(e) => store.setTrendDial(Number(e.target.value))}
          className="w-full accent-[color:var(--primary)]"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Trend snapshot for {city.country}, collected {formatSourceDate(SNAPSHOT_DATE)} from {sourceCount} dated public sources. City-level data is not available yet, so {city.name} uses the national snapshot plus the local forecast.
      </p>

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
          Nothing in the {city.country} snapshot fits{occasion ? ` a ${occasion}` : ''} with your settings.
          {excluded.length > 0 && ' Some looks are hidden by your profile settings (below).'}
        </p>
      ) : (
        shown.map((r: RankedTrend) => <LookCard key={r.trend.id} ranked={r} city={city} occasion={occasion} actions={actions} />)
      )}

      {(excluded.length > 0 || dismissed.length > 0) && (
        <div className="rounded-2xl border border-border p-3 text-xs">
          <button onClick={() => setShowHidden((v) => !v)} className="font-bold text-secondary-foreground">
            {showHidden ? 'Hide' : 'Show'} hidden looks ({excluded.length + dismissed.length})
          </button>
          {showHidden && (
            <ul className="mt-2 space-y-1.5">
              {excluded.map(({ trend, reason }) => (
                <li key={trend.id}>
                  <strong>{trend.title}</strong> · {reason}. Change it in your profile.
                </li>
              ))}
              {dismissed.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span><strong>{t.title}</strong> · you marked “Not for me”</span>
                  <button onClick={() => store.toggleDislike(t.id)} className="font-bold text-primary">Restore</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <LiveSignals city={city} occasion={occasion} />
    </div>
  )
}

function LiveSignals({ city, occasion }: { city: City; occasion?: Occasion }) {
  const [live, setLive] = useState<Live>()
  const [enabled, setEnabled] = useState<boolean>()
  const query = `${occasion && occasion !== 'casual' ? `${occasion} ` : ''}outfit ${city.name}`

  useEffect(() => {
    getHealth().then((h) => setEnabled(h.youtube))
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLive(undefined)
    fetch(`/api/trends/live?country=${city.region === 'GB' ? 'GB' : city.region}&q=${encodeURIComponent(query)}`)
      .then((r) => r.json() as Promise<Live>)
      .then((d) => !cancelled && setLive(d))
      .catch(() => !cancelled && setLive({ available: false, reason: 'Could not reach the trend service.' }))
    return () => {
      cancelled = true
    }
  }, [enabled, city.region, query])

  if (enabled === false) {
    return (
      <p className="text-xs text-muted-foreground">
        Live creator signals are off. Set YOUTUBE_API_KEY on the server to add this week’s most-viewed “{query}” videos.
      </p>
    )
  }
  if (!live) return null
  if (!live.available) return <p className="text-xs text-muted-foreground">Live signals unavailable: {live.reason}</p>
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-border/60">
      <p className="font-display text-sm font-bold">Live this month in {city.country}</p>
      <p className="mb-2 text-[11px] text-muted-foreground">{live.source}</p>
      <ul className="space-y-1.5 text-xs">
        {(live.items ?? []).slice(0, 6).map((i) => (
          <li key={i.url}>
            <a href={i.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{i.title}</a>
            <span className="text-muted-foreground"> · {i.channel}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
