import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { kvGet, kvSet } from './lib/kv'

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */
export type Undertone = 'warm' | 'cool' | 'neutral'
export type Coverage = 'minimal' | 'moderate' | 'modest'
export type StyleFor = 'women' | 'men' | 'all'

export type Profile = {
  name: string
  /** City id from trends/data. Only the city is stored, never coordinates. */
  cityId: string
  styleFor: StyleFor
  coverage: Coverage
  favoriteColors: string[]
  exclusions: string[]
  undertone?: Undertone
  undertoneSource?: 'self' | 'measured'
  facePhoto?: string // resized JPEG data URL, kept on this device
  bodyPhoto?: string
}

export type ToneResult = {
  skin?: string
  eye?: string
  lip?: string
  hair?: string
  brow?: string
  measuredAt: string
}

export type SkinScan = {
  id: string
  date: string
  concerns: { type: string; score: number }[]
  overall?: number
  skinAge?: number
}

export type WardrobeItem = {
  id: string
  name: string
  type: string
  color: string
  occasion: string
  photo?: string
}

export type SavedLook = {
  id: string
  title: string
  /** Resized copy of the YouCam result, so it outlives the 2-hour result link. */
  image?: string
  featureId?: string
  trendId?: string
  cityId?: string
  occasion?: string
  savedAt: string
}

export type EventPlan = {
  id: string
  title: string
  type: string
  date: string // YYYY-MM-DD, local
  cityId?: string
  role?: string
  dressCode?: string
  venue?: string
  ceremony?: string
}

export type RoutineProduct = {
  id: string
  name: string
  step: string
  time: 'am' | 'pm'
}

export type Consent = { granted: boolean; version: string; at: string } | null

type State = {
  consent: Consent
  /** The user agreed to send photos to YouCam when running AI features. */
  uploadConsent: boolean
  profile: Profile | null
  wardrobe: WardrobeItem[]
  looks: SavedLook[]
  events: EventPlan[]
  likes: string[]
  dislikes: string[]
  scans: SkinScan[]
  tone: ToneResult | null
  routine: RoutineProduct[]
  /** date (YYYY-MM-DD) → routine done */
  checkins: Record<string, { am?: boolean; pm?: boolean }>
  trendDial: number
}

const EMPTY: State = {
  consent: null,
  uploadConsent: false,
  profile: null,
  wardrobe: [],
  looks: [],
  events: [],
  likes: [],
  dislikes: [],
  scans: [],
  tone: null,
  routine: [],
  checkins: {},
  trendDial: 0.6,
}

/* ------------------------------------------------------------------ *
 * Static data
 * ------------------------------------------------------------------ */
export const OCCASIONS = [
  { id: 'wedding', label: 'Wedding', emoji: '💒' },
  { id: 'festival', label: 'Festival', emoji: '🪔' },
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'date', label: 'Date', emoji: '💕' },
  { id: 'casual', label: 'Casual outing', emoji: '🌸' },
] as const

export const palettes: Record<Undertone, { name: string; hex: string; wear: string }[]> = {
  warm: [
    { name: 'Coral', hex: '#ff8a6b', wear: 'Bright for daytime festivals' },
    { name: 'Marigold', hex: '#ffd166', wear: 'Lifts warm complexions' },
    { name: 'Terracotta', hex: '#c96f4a', wear: 'Earthy formalwear' },
    { name: 'Olive', hex: '#6b7a3a', wear: 'Easy everyday neutral' },
    { name: 'Warm Ivory', hex: '#f5efe0', wear: 'Soft neutral base' },
  ],
  cool: [
    { name: 'Berry', hex: '#b5468b', wear: 'Rich for celebrations' },
    { name: 'Sapphire', hex: '#3d5fc4', wear: 'Cool depth for formalwear' },
    { name: 'Emerald', hex: '#0f6b4f', wear: 'Jewel tone for evenings' },
    { name: 'Lilac', hex: '#b9a2f0', wear: 'Gentle daywear' },
    { name: 'Pure White', hex: '#f7f7f7', wear: 'Crisp neutral base' },
  ],
  neutral: [
    { name: 'Dusty Rose', hex: '#d98a9e', wear: 'Soft and versatile' },
    { name: 'Sage', hex: '#a7b89a', wear: 'Calm, easy to wear' },
    { name: 'Plum', hex: '#6b2d5c', wear: 'Elegant for evenings' },
    { name: 'Champagne', hex: '#e6d3b3', wear: 'Warm-neutral base' },
    { name: 'Teal', hex: '#2f8f8a', wear: 'Balanced jewel tone' },
  ],
}

export const ROUTINE_STEPS = ['Cleanser', 'Toner', 'Serum', 'Treatment', 'Moisturizer', 'Sunscreen', 'Eye cream', 'Oil']

/* ------------------------------------------------------------------ *
 * Dates (local, never UTC-shifted)
 * ------------------------------------------------------------------ */
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function daysUntil(iso: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((parseLocal(iso).getTime() - today.getTime()) / 86400000)
}

export function formatDate(iso: string): string {
  return parseLocal(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Days in a row, ending today or yesterday, with at least one routine check-in. */
export function currentStreak(checkins: State['checkins']): number {
  const done = (iso: string) => Boolean(checkins[iso]?.am || checkins[iso]?.pm)
  const d = new Date()
  let iso = todayIso()
  if (!done(iso)) {
    d.setDate(d.getDate() - 1)
    iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  let streak = 0
  while (done(iso)) {
    streak += 1
    d.setDate(d.getDate() - 1)
    iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return streak
}

/* Ingredient pairs that commonly irritate when used in the same routine. */
const ACTIVE_WORDS: Record<string, RegExp> = {
  retinoid: /retin|tretinoin|adapalene|bakuchiol/i,
  'exfoliating acid': /\b(aha|bha|glycolic|salicylic|lactic|mandelic|peel)\b/i,
  'benzoyl peroxide': /benzoyl/i,
  'vitamin C': /vitamin c|ascorbic/i,
}

export function routineWarnings(products: RoutineProduct[]): string[] {
  const warnings: string[] = []
  for (const time of ['am', 'pm'] as const) {
    const found = Object.entries(ACTIVE_WORDS)
      .filter(([, re]) => products.some((p) => p.time === time && re.test(p.name)))
      .map(([k]) => k)
    if (found.includes('retinoid') && found.includes('exfoliating acid')) {
      warnings.push(`Your ${time === 'am' ? 'morning' : 'night'} routine has a retinoid and an exfoliating acid. Using both together often irritates; alternate nights instead.`)
    }
    if (found.includes('retinoid') && found.includes('benzoyl peroxide')) {
      warnings.push(`Benzoyl peroxide can deactivate some retinoids. Use them at different times of day.`)
    }
  }
  if (products.some((p) => p.time === 'am') && !products.some((p) => p.time === 'am' && p.step === 'Sunscreen')) {
    warnings.push('Your morning routine has no sunscreen.')
  }
  return warnings
}

/* ------------------------------------------------------------------ *
 * Context / provider
 * ------------------------------------------------------------------ */
type Store = State & {
  loaded: boolean
  saveError: string | null
  setConsent: (granted: boolean) => void
  setUploadConsent: (granted: boolean) => void
  saveProfile: (p: Profile) => void
  updateProfile: (patch: Partial<Profile>) => void
  clearPhotos: () => void
  addWardrobe: (item: Omit<WardrobeItem, 'id'>) => void
  removeWardrobe: (id: string) => void
  saveLook: (look: Omit<SavedLook, 'id' | 'savedAt'>) => void
  removeLook: (id: string) => void
  upsertEvent: (e: Omit<EventPlan, 'id'> & { id?: string }) => EventPlan
  removeEvent: (id: string) => void
  toggleLike: (id: string) => void
  toggleDislike: (id: string) => void
  addScan: (scan: Omit<SkinScan, 'id'>) => void
  setTone: (tone: ToneResult) => void
  addRoutineProduct: (p: Omit<RoutineProduct, 'id'>) => void
  removeRoutineProduct: (id: string) => void
  checkIn: (time: 'am' | 'pm', done: boolean) => void
  setTrendDial: (v: number) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)
const KEY = 'highlight.state.v2'
const LEGACY_KEY = 'highlight.state.v1'

const uid = () => Math.random().toString(36).slice(2, 10)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const first = useRef(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let saved: Partial<State> | undefined
      try {
        saved = await kvGet<Partial<State>>(KEY)
      } catch {
        saved = undefined
      }
      if (!saved) {
        // One-time import of the old localStorage profile (photos were dropped there when the quota filled).
        try {
          const raw = localStorage.getItem(LEGACY_KEY)
          if (raw) {
            const old = JSON.parse(raw) as { profile?: Record<string, unknown>; consent?: Consent; events?: EventPlan[] }
            saved = {
              consent: old.consent ?? null,
              events: (old.events ?? []).map((e) => ({ ...e })),
              profile: old.profile
                ? {
                    ...EMPTY_PROFILE,
                    name: String(old.profile.name ?? ''),
                    coverage: (old.profile.coverage as Coverage) ?? 'moderate',
                    undertone: old.profile.undertone as Undertone | undefined,
                    exclusions: (old.profile.exclusions as string[]) ?? [],
                  }
                : null,
            }
            localStorage.removeItem(LEGACY_KEY)
          }
        } catch {
          /* ignore unreadable legacy data */
        }
      }
      if (!cancelled) {
        setState({ ...EMPTY, ...(saved ?? {}) })
        setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (first.current) {
      first.current = false
      return
    }
    kvSet(KEY, state)
      .then(() => setSaveError(null))
      .catch(() => setSaveError('Changes could not be saved on this device. Free up storage and try again.'))
  }, [state, loaded])

  const update = useCallback((fn: (s: State) => State) => setState(fn), [])

  const api = useMemo<Store>(
    () => ({
      ...state,
      loaded,
      saveError,
      setConsent: (granted) =>
        update((s) => ({ ...s, consent: { granted, version: '2.0', at: new Date().toISOString() } })),
      setUploadConsent: (granted) => update((s) => ({ ...s, uploadConsent: granted })),
      saveProfile: (p) => update((s) => ({ ...s, profile: p })),
      updateProfile: (patch) =>
        update((s) => ({ ...s, profile: s.profile ? { ...s.profile, ...patch } : s.profile })),
      clearPhotos: () =>
        update((s) => ({
          ...s,
          profile: s.profile ? { ...s.profile, facePhoto: undefined, bodyPhoto: undefined } : s.profile,
        })),
      addWardrobe: (item) => update((s) => ({ ...s, wardrobe: [{ ...item, id: uid() }, ...s.wardrobe] })),
      removeWardrobe: (id) => update((s) => ({ ...s, wardrobe: s.wardrobe.filter((w) => w.id !== id) })),
      saveLook: (look) =>
        update((s) => ({ ...s, looks: [{ ...look, id: uid(), savedAt: new Date().toISOString() }, ...s.looks] })),
      removeLook: (id) => update((s) => ({ ...s, looks: s.looks.filter((l) => l.id !== id) })),
      upsertEvent: (e) => {
        const existing = state.events.find(
          (x) => (e.id && x.id === e.id) || (x.type === e.type && x.date === e.date && x.cityId === e.cityId),
        )
        const full: EventPlan = { ...e, id: existing?.id ?? e.id ?? uid() }
        update((s) => ({ ...s, events: [full, ...s.events.filter((x) => x.id !== full.id)] }))
        return full
      },
      removeEvent: (id) => update((s) => ({ ...s, events: s.events.filter((ev) => ev.id !== id) })),
      toggleLike: (id) =>
        update((s) => ({
          ...s,
          likes: s.likes.includes(id) ? s.likes.filter((x) => x !== id) : [...s.likes, id],
          dislikes: s.dislikes.filter((x) => x !== id),
        })),
      toggleDislike: (id) =>
        update((s) => ({
          ...s,
          dislikes: s.dislikes.includes(id) ? s.dislikes.filter((x) => x !== id) : [...s.dislikes, id],
          likes: s.likes.filter((x) => x !== id),
        })),
      addScan: (scan) => update((s) => ({ ...s, scans: [...s.scans, { ...scan, id: uid() }].slice(-60) })),
      setTone: (tone) => update((s) => ({ ...s, tone })),
      addRoutineProduct: (p) => update((s) => ({ ...s, routine: [...s.routine, { ...p, id: uid() }] })),
      removeRoutineProduct: (id) => update((s) => ({ ...s, routine: s.routine.filter((p) => p.id !== id) })),
      checkIn: (time, done) =>
        update((s) => {
          const day = todayIso()
          return { ...s, checkins: { ...s.checkins, [day]: { ...s.checkins[day], [time]: done } } }
        }),
      setTrendDial: (v) => update((s) => ({ ...s, trendDial: v })),
      resetAll: () => update(() => EMPTY),
    }),
    [state, loaded, saveError, update],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export const EMPTY_PROFILE: Profile = {
  name: '',
  cityId: 'mumbai',
  styleFor: 'all',
  coverage: 'moderate',
  favoriteColors: [],
  exclusions: [],
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/** The palette used for ranking: favourite colours plus the undertone palette. */
export function paletteFor(profile: Profile | null): string[] {
  if (!profile) return []
  const base = profile.undertone ? palettes[profile.undertone].map((p) => p.hex) : []
  return [...profile.favoriteColors, ...base]
}
