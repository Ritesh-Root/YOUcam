import { useEffect, useState } from 'react'
import { Chip, Screen } from '../components/overlay'
import { useApp } from '../components/app-context'
import { OCCASIONS, daysUntil, formatDate, todayIso, useStore } from '../store'
import { CITIES, cityById, type Occasion as OccasionId } from '../trends/data'
import { forecastFor, type Weather } from '../trends/engine'
import { TrendResults } from '../trends/TrendResults'
import type { LookActions } from '../trends/LookCard'

const CEREMONIES = ['Mehndi', 'Haldi', 'Sangeet', 'Wedding day', 'Reception', 'Engagement', 'Traditional (Nigerian)']

export function Occasion({
  onClose,
  preset,
  actions,
}: {
  onClose: () => void
  preset?: { occasion?: string; eventId?: string }
  actions: LookActions
}) {
  const store = useStore()
  const { notify } = useApp()
  const existing = store.events.find((e) => e.id === preset?.eventId)
  const [occasion, setOccasion] = useState<OccasionId | undefined>((existing?.type ?? preset?.occasion) as OccasionId | undefined)
  const [cityId, setCityId] = useState(existing?.cityId ?? store.profile?.cityId ?? 'mumbai')
  const [date, setDate] = useState(existing?.date ?? '')
  const [role, setRole] = useState(existing?.role ?? 'Guest')
  const [ceremony, setCeremony] = useState(existing?.ceremony ?? '')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherState, setWeatherState] = useState<'none' | 'loading' | 'far' | 'past' | 'ok' | 'error'>('none')
  const city = cityById(cityId) ?? CITIES[0]

  useEffect(() => {
    setWeather(null)
    if (!date) return setWeatherState('none')
    const d = daysUntil(date)
    if (d < 0) return setWeatherState('past')
    if (d > 15) return setWeatherState('far')
    setWeatherState('loading')
    let cancelled = false
    forecastFor(city, date).then((w) => {
      if (cancelled) return
      setWeather(w)
      setWeatherState(w ? 'ok' : 'error')
    })
    return () => {
      cancelled = true
    }
  }, [city, date])

  const label = OCCASIONS.find((o) => o.id === occasion)?.label ?? 'Event'

  const save = () => {
    if (!occasion || !date) return
    if (daysUntil(date) < 0) return notify('That date has passed. Pick a future date.')
    store.upsertEvent({ id: existing?.id, title: ceremony || label, type: occasion, date, cityId, role, ceremony: ceremony || undefined })
    notify('Event saved')
  }

  return (
    <Screen title="Where are you going?" subtitle="Looks trending where your event is" onClose={onClose}>
      <div className="space-y-5 pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {OCCASIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOccasion(o.id)}
              aria-pressed={occasion === o.id}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs font-bold transition ${occasion === o.id ? 'bg-primary text-white' : 'bg-secondary text-secondary-foreground'}`}
            >
              <span className="text-xl" aria-hidden>{o.emoji}</span>
              {o.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-bold">
            Event city
            <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold">
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">
            Date
            <input type="date" value={date} min={todayIso()} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold" />
          </label>
        </div>

        {occasion === 'wedding' && (
          <div>
            <p className="mb-2 text-sm font-bold">Ceremony</p>
            <div className="flex flex-wrap gap-2">
              {CEREMONIES.map((c) => <Chip key={c} label={c} selected={ceremony === c} onClick={() => setCeremony(ceremony === c ? '' : c)} />)}
            </div>
          </div>
        )}

        <label className="block text-sm font-bold">
          Your role
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold">
            {['Guest', 'Close family', 'Bride/Groom', 'Host', 'Colleague'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>

        <WeatherCard state={weatherState} weather={weather} cityName={city.name} date={date} />

        {occasion && date && (
          <button onClick={save} className="w-full rounded-full border border-border py-3 text-sm font-bold">
            Save “{ceremony || label}” on {formatDate(date)} in {city.name}
          </button>
        )}

        {occasion ? (
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold">Trending in {city.name} for a {label.toLowerCase()}</h2>
            <TrendResults city={city} occasion={occasion} weather={weather} actions={actions} />
          </section>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Pick an occasion to see what is trending in {city.name}.</p>
        )}
      </div>
    </Screen>
  )
}

function WeatherCard({ state, weather, cityName, date }: { state: string; weather: Weather | null; cityName: string; date: string }) {
  if (state === 'none') return <p className="text-xs text-muted-foreground">Add a date to check the {cityName} forecast.</p>
  if (state === 'past') return <p className="text-xs font-semibold text-[#b3261e]">That date has passed.</p>
  if (state === 'far') return <p className="text-xs text-muted-foreground">The forecast for {formatDate(date)} appears 16 days before the event.</p>
  if (state === 'loading') return <p className="text-xs text-muted-foreground">Checking the {cityName} forecast…</p>
  if (state === 'error' || !weather) return <p className="text-xs text-muted-foreground">The forecast is unavailable right now.</p>
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#e8f1fb] p-3 text-sm text-[#1f3b5a]">
      <span className="text-2xl" aria-hidden>{weather.rainChance >= 50 ? '🌧️' : weather.maxC >= 30 ? '☀️' : '⛅'}</span>
      <p>
        {cityName}, {formatDate(weather.date)}: {Math.round(weather.minC)}–{Math.round(weather.maxC)}°C, {Math.round(weather.humidity)}% humidity, {weather.rainChance}% chance of rain.
        <span className="block text-xs opacity-75">Open-Meteo forecast</span>
      </p>
    </div>
  )
}
