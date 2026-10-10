import { useEffect, useState } from 'react'
import { Chip, Screen } from '../components/overlay'
import { todayIso, useStore } from '../store'
import { CITIES, cityById } from '../trends/data'
import { forecastFor, type Weather } from '../trends/engine'
import { TrendResults } from '../trends/TrendResults'
import type { LookActions } from '../trends/LookCard'

export function LocalTrends({ onClose, actions }: { onClose: () => void; actions: LookActions }) {
  const store = useStore()
  const [cityId, setCityId] = useState(store.profile?.cityId ?? 'mumbai')
  const [kind, setKind] = useState<'all' | 'outfit' | 'makeup'>('all')
  const [weather, setWeather] = useState<Weather | null>(null)
  const city = cityById(cityId) ?? CITIES[0]

  useEffect(() => {
    let cancelled = false
    setWeather(null)
    forecastFor(city, todayIso()).then((w) => !cancelled && setWeather(w))
    return () => {
      cancelled = true
    }
  }, [city])

  return (
    <Screen title="Trending near you" subtitle={`${city.name}${weather ? ` · ${Math.round(weather.maxC)}°C today` : ''}`} onClose={onClose}>
      <div className="space-y-4 pb-4">
        <div className="scroll-area flex gap-2 overflow-x-auto pb-1">
          {CITIES.map((c) => (
            <div key={c.id} className="flex-shrink-0">
              <Chip label={c.name} selected={cityId === c.id} onClick={() => setCityId(c.id)} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Chip label="All" selected={kind === 'all'} onClick={() => setKind('all')} />
          <Chip label="Outfits" selected={kind === 'outfit'} onClick={() => setKind('outfit')} />
          <Chip label="Makeup" selected={kind === 'makeup'} onClick={() => setKind('makeup')} />
        </div>
        <TrendResults city={city} weather={weather} kind={kind === 'all' ? undefined : kind} actions={actions} />
      </div>
    </Screen>
  )
}
