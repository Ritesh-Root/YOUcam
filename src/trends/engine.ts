/*
 * Ranks the local trend snapshot for one person, one event and one city.
 * Hard filters run first; scores only order what is left.
 */

import { daysUntil, type Coverage, type Profile } from '../store'
import { CITIES, SNAPSHOT_DATE, trendsForRegion, type City, type Occasion, type Trend, type Warmth } from './data'

/* ------------------------------------------------------------------ *
 * Location
 * ------------------------------------------------------------------ */
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLon = rad(bLon - aLon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/** Nearest city with trend data. Runs on the device; coordinates are never stored or sent. */
export function nearestCity(lat: number, lon: number): { city: City; km: number } {
  let best = { city: CITIES[0], km: Infinity }
  for (const city of CITIES) {
    const km = haversineKm(lat, lon, city.lat, city.lon)
    if (km < best.km) best = { city, km }
  }
  return best
}

/* ------------------------------------------------------------------ *
 * Weather (Open-Meteo, free, no key). Forecasts cover the next 16 days.
 * ------------------------------------------------------------------ */
export type Weather = { date: string; maxC: number; minC: number; rainChance: number; humidity: number }

export async function forecastFor(city: City, isoDate: string): Promise<Weather | null> {
  const days = daysUntil(isoDate)
  if (days < 0 || days > 15) return null
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_mean',
    timezone: 'auto',
    start_date: isoDate,
    end_date: isoDate,
  }).toString()
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const d = (await res.json()) as { daily?: Record<string, number[]> }
    const daily = d.daily
    if (!daily?.temperature_2m_max?.length) return null
    return {
      date: isoDate,
      maxC: daily.temperature_2m_max[0],
      minC: daily.temperature_2m_min[0],
      rainChance: daily.precipitation_probability_max?.[0] ?? 0,
      humidity: daily.relative_humidity_2m_mean?.[0] ?? 0,
    }
  } catch {
    return null
  }
}

function weatherFit(warmth: Warmth, w: Weather): { score: number; note?: string } {
  const hot = w.maxC >= 30 || (w.maxC >= 27 && w.humidity >= 70)
  const cold = w.maxC <= 12
  if (hot && warmth === 'warm') return { score: 0, note: `Heavy for ${Math.round(w.maxC)}°C` }
  if (hot && warmth === 'light') return { score: 1, note: `Light enough for ${Math.round(w.maxC)}°C` }
  if (cold && warmth === 'light') return { score: 0.2, note: `Add a layer: ${Math.round(w.maxC)}°C` }
  if (cold && warmth === 'warm') return { score: 1, note: `Warm enough for ${Math.round(w.maxC)}°C` }
  return { score: 0.7 }
}

/* ------------------------------------------------------------------ *
 * Colour: CIE76 ΔE in Lab space
 * ------------------------------------------------------------------ */
function hexToLab(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const [r, g, b] = srgb
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

export function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = hexToLab(a)
  const [l2, a2, b2] = hexToLab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

/**
 * Warm/cool estimate from a measured skin colour (Lab hue angle). A style
 * heuristic, shown as an estimate the user can change; not a measurement of
 * undertone.
 */
export function undertoneFromSkin(hex: string): 'warm' | 'cool' | 'neutral' {
  const [, a, b] = hexToLab(hex)
  const hue = (Math.atan2(b, a) * 180) / Math.PI
  if (hue >= 62) return 'warm'
  if (hue <= 52) return 'cool'
  return 'neutral'
}

/* ------------------------------------------------------------------ *
 * Ranking
 * ------------------------------------------------------------------ */
const COVERAGE_RANK: Record<Coverage, number> = { minimal: 0, moderate: 1, modest: 2 }

export type RankedTrend = {
  trend: Trend
  score: number
  reasons: string[]
  weatherNote?: string
}

export type RankInput = {
  city: City
  occasion?: Occasion
  profile: Profile | null
  palette: string[]
  weather: Weather | null
  likes: string[]
  dislikes: string[]
  /** 0 = classic, 1 = on-trend. Scales the trend weight between 0 and 0.5. */
  trendDial: number
}

function recency(trend: Trend): number {
  const dated = trend.sources.map((s) => s.date).filter((d): d is string => Boolean(d))
  if (!dated.length) return 0.4
  const newest = dated.sort().at(-1)!
  const ageDays = (Date.parse(SNAPSHOT_DATE) - Date.parse(newest)) / 86400000
  return Math.max(0.2, 1 - ageDays / 240)
}

export function trendStrength(trend: Trend): number {
  return Math.min(1, 0.45 * recency(trend) + 0.2 * Math.min(trend.sources.length, 3))
}

export function rankTrends(input: RankInput): { ranked: RankedTrend[]; excluded: { trend: Trend; reason: string }[] } {
  const { city, occasion, profile, palette, weather, likes, dislikes } = input
  const audience = profile?.styleFor ?? 'all'
  const minCoverage = profile ? COVERAGE_RANK[profile.coverage] : 0
  const exclusions = (profile?.exclusions ?? []).map((e) => e.toLowerCase())
  const excluded: { trend: Trend; reason: string }[] = []

  const candidates = trendsForRegion(city.region).filter((t) => {
    if (dislikes.includes(t.id)) return false
    if (audience !== 'all' && t.for !== 'all' && t.for !== audience) {
      excluded.push({ trend: t, reason: `Shown for ${t.for === 'men' ? 'menswear' : 'womenswear'}` })
      return false
    }
    if (COVERAGE_RANK[t.coverage] < minCoverage) {
      excluded.push({ trend: t, reason: `Less coverage than your ${profile!.coverage} setting` })
      return false
    }
    const hit = exclusions.find((e) => `${t.title} ${t.shop}`.toLowerCase().includes(e))
    if (hit) {
      excluded.push({ trend: t, reason: `You excluded “${hit}”` })
      return false
    }
    if (occasion && !t.occasions.includes(occasion)) return false
    return true
  })

  const trendWeight = 0.5 * Math.max(0, Math.min(1, input.trendDial))
  const ranked = candidates.map((t): RankedTrend => {
    const reasons: string[] = []
    const parts: [number, number][] = []

    const strength = trendStrength(t)
    parts.push([trendWeight, strength])
    reasons.push(`Trending in ${city.country}: ${t.sources.length} source${t.sources.length > 1 ? 's' : ''}`)

    if (occasion) {
      parts.push([0.25, 1])
      reasons.push(`Worn for ${occasion === 'casual' ? 'casual outings' : `${occasion}s`}`)
    }

    if (palette.length && t.kind === 'outfit') {
      const best = Math.min(...t.colors.flatMap((c) => palette.map((p) => deltaE(c, p))))
      const match = Math.max(0, 1 - best / 60)
      parts.push([0.2, match])
      if (match >= 0.6) reasons.push('Close to colours in your palette')
    }

    let weatherNote: string | undefined
    if (weather) {
      const fit = weatherFit(t.warmth, weather)
      parts.push([0.15, fit.score])
      weatherNote = fit.note
    }

    if (likes.includes(t.id)) {
      parts.push([0.1, 1])
      reasons.push('You liked this')
    }

    const total = parts.reduce((s, [w]) => s + w, 0)
    const score = total ? parts.reduce((s, [w, v]) => s + w * v, 0) / total : 0
    return { trend: t, score, reasons, weatherNote }
  })

  ranked.sort((a, b) => b.score - a.score)
  return { ranked, excluded }
}

export function formatSourceDate(date?: string): string {
  if (!date) return 'undated'
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
