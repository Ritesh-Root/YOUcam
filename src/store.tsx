import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */
export type Undertone = 'warm' | 'cool' | 'neutral'
export type Fit = 'fitted' | 'regular' | 'relaxed'
export type Coverage = 'minimal' | 'moderate' | 'modest'

export type Profile = {
  name: string
  region: string
  culturalStyles: string[]
  usualClothing: string[]
  fit: Fit
  coverage: Coverage
  favoriteColors: string[]
  exclusions: string[]
  undertone?: Undertone
  facePhoto?: string // private data URL, kept in-browser only
  bodyPhoto?: string
}

export type Garment = {
  id: string
  name: string
  region: string
  type: string
  occasions: string[]
  colors: string[]
  coverage: Coverage
  palette: Undertone | 'any'
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
  garmentId: string
  occasion: string
  savedAt: string
}

export type EventPlan = {
  id: string
  title: string
  type: string
  date: string // ISO date
  role?: string
  dressCode?: string
  venue?: string
  ceremony?: string
}

export type Consent = { granted: boolean; version: string; at: string } | null

type State = {
  consent: Consent
  profile: Profile | null
  wardrobe: WardrobeItem[]
  looks: SavedLook[]
  events: EventPlan[]
  likes: string[]
  dislikes: string[]
}

const EMPTY: State = {
  consent: null,
  profile: null,
  wardrobe: [],
  looks: [],
  events: [],
  likes: [],
  dislikes: [],
}

/* ------------------------------------------------------------------ *
 * Static data — India-first catalog + palette + regions
 * ------------------------------------------------------------------ */
export const REGIONS = [
  'India',
  'Pakistan',
  'Bangladesh',
  'Sri Lanka',
  'Nigeria',
  'Japan',
  'Mexico',
  'United States',
  'United Kingdom',
]

export const CULTURAL_STYLES = [
  'Indian ethnic',
  'Indo-western fusion',
  'Contemporary western',
  'Minimal / neutral',
  'Streetwear',
  'Formal tailored',
]

export const CLOTHING_TYPES = [
  'Sarees',
  'Kurtas',
  'Lehengas',
  'Sherwanis',
  'Dresses',
  'Suits',
  'Jeans & tops',
  'Traditional wear',
]

export const OCCASIONS = [
  { id: 'wedding', label: 'Wedding', emoji: '💒' },
  { id: 'festival', label: 'Festival', emoji: '🪔' },
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'date', label: 'Date', emoji: '💕' },
  { id: 'casual', label: 'Casual outing', emoji: '🌸' },
]

export const catalog: Garment[] = [
  { id: 'g-saree-rose', name: 'Rose Silk Saree', region: 'India', type: 'Saree', occasions: ['wedding', 'festival'], colors: ['#f472a0', '#ffd166'], coverage: 'modest', palette: 'warm' },
  { id: 'g-lehenga-blush', name: 'Blush Embroidered Lehenga', region: 'India', type: 'Lehenga', occasions: ['wedding'], colors: ['#f9a8c8', '#e6dcff'], coverage: 'moderate', palette: 'cool' },
  { id: 'g-kurta-mint', name: 'Mint Cotton Kurta', region: 'India', type: 'Kurta', occasions: ['festival', 'casual', 'work'], colors: ['#8fd9b6', '#ffffff'], coverage: 'modest', palette: 'cool' },
  { id: 'g-sherwani-ivory', name: 'Ivory Sherwani', region: 'India', type: 'Sherwani', occasions: ['wedding'], colors: ['#f5efe0', '#ffd166'], coverage: 'modest', palette: 'warm' },
  { id: 'g-anarkali-coral', name: 'Coral Anarkali Suit', region: 'India', type: 'Anarkali', occasions: ['festival', 'party'], colors: ['#ff8a6b', '#f472a0'], coverage: 'moderate', palette: 'warm' },
  { id: 'g-saree-teal', name: 'Teal Georgette Saree', region: 'India', type: 'Saree', occasions: ['party', 'work'], colors: ['#3aa6a0', '#e6dcff'], coverage: 'moderate', palette: 'cool' },
  { id: 'g-kurti-lilac', name: 'Lilac Straight Kurti', region: 'India', type: 'Kurti', occasions: ['work', 'casual'], colors: ['#c3a8ff', '#ffffff'], coverage: 'modest', palette: 'cool' },
  { id: 'g-lehenga-gold', name: 'Gold Festive Lehenga', region: 'India', type: 'Lehenga', occasions: ['festival', 'wedding'], colors: ['#ffd166', '#ff8a6b'], coverage: 'moderate', palette: 'warm' },
  { id: 'g-dress-rosewrap', name: 'Rose Wrap Dress', region: 'United States', type: 'Dress', occasions: ['date', 'party', 'casual'], colors: ['#f472a0', '#4a2c38'], coverage: 'minimal', palette: 'warm' },
  { id: 'g-suit-charcoal', name: 'Charcoal Tailored Suit', region: 'United Kingdom', type: 'Suit', occasions: ['work', 'wedding'], colors: ['#4a2c38', '#cfd8ff'], coverage: 'modest', palette: 'cool' },
  { id: 'g-kimono-sakura', name: 'Sakura Furisode Kimono', region: 'Japan', type: 'Kimono', occasions: ['festival', 'wedding'], colors: ['#f9a8c8', '#ffd166'], coverage: 'modest', palette: 'warm' },
  { id: 'g-agbada-emerald', name: 'Emerald Agbada', region: 'Nigeria', type: 'Agbada', occasions: ['wedding', 'festival'], colors: ['#4caf82', '#ffd166'], coverage: 'modest', palette: 'cool' },
]

export const palettes: Record<
  Undertone,
  { name: string; hex: string; wear: string }[]
> = {
  warm: [
    { name: 'Coral', hex: '#ff8a6b', wear: 'Radiant for daytime festivals' },
    { name: 'Marigold', hex: '#ffd166', wear: 'Lifts warm complexions' },
    { name: 'Rose Gold', hex: '#f9a8c8', wear: 'Soft glow for evenings' },
    { name: 'Terracotta', hex: '#c96f4a', wear: 'Grounded, earthy formalwear' },
    { name: 'Warm Ivory', hex: '#f5efe0', wear: 'Flattering neutral base' },
  ],
  cool: [
    { name: 'Berry', hex: '#b5468b', wear: 'Rich for celebrations' },
    { name: 'Lilac', hex: '#c3a8ff', wear: 'Gentle, romantic tone' },
    { name: 'Teal', hex: '#3aa6a0', wear: 'Fresh contrast for parties' },
    { name: 'Sapphire', hex: '#4a6fd4', wear: 'Cool depth for formalwear' },
    { name: 'Cool Mint', hex: '#8fd9b6', wear: 'Light, airy daywear' },
  ],
  neutral: [
    { name: 'Dusty Rose', hex: '#d98a9e', wear: 'Universally soft' },
    { name: 'Sage', hex: '#a7b89a', wear: 'Calm, versatile' },
    { name: 'Mauve', hex: '#a98bab', wear: 'Elegant for evenings' },
    { name: 'Champagne', hex: '#e6d3b3', wear: 'Warm-neutral base' },
    { name: 'Slate Blue', hex: '#7d8bb0', wear: 'Balanced formalwear' },
  ],
}

/* ------------------------------------------------------------------ *
 * Recommendation ranking (application logic, not a provider claim)
 * ------------------------------------------------------------------ */
export type Ranked = {
  garment: Garment
  score: number
  reasons: string[]
}

export function rankGarments(
  items: Garment[],
  profile: Profile | null,
  occasion?: string,
): Ranked[] {
  const excl = new Set((profile?.exclusions ?? []).map((e) => e.toLowerCase()))
  const eligible = items.filter(
    (g) =>
      !excl.has(g.type.toLowerCase()) &&
      !g.colors.some((c) => excl.has(c.toLowerCase())),
  )

  return eligible
    .map((g) => {
      const reasons: string[] = []
      let score = 0
      const W = { palette: 0.35, occasion: 0.3, style: 0.25, coverage: 0.1 }

      if (profile?.undertone) {
        if (g.palette === profile.undertone || g.palette === 'any') {
          score += W.palette
          reasons.push(`Complements your ${profile.undertone} undertone`)
        }
      }
      if (occasion && g.occasions.includes(occasion)) {
        score += W.occasion
        reasons.push(`Fitting for a ${occasion}`)
      }
      if (
        profile?.culturalStyles?.length &&
        profile.region &&
        g.region === profile.region
      ) {
        score += W.style
        reasons.push(`Matches your ${g.region} style`)
      }
      if (profile?.coverage && g.coverage === profile.coverage) {
        score += W.coverage
        reasons.push(`Respects your ${g.coverage} coverage preference`)
      }
      if (reasons.length === 0) reasons.push('A versatile everyday option')
      return { garment: g, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
}

export function daysUntil(iso: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const then = new Date(iso)
  then.setHours(0, 0, 0, 0)
  return Math.round((then.getTime() - now.getTime()) / 86400000)
}

/* ------------------------------------------------------------------ *
 * Context / provider
 * ------------------------------------------------------------------ */
type Store = State & {
  setConsent: (granted: boolean) => void
  saveProfile: (p: Profile) => void
  updateProfile: (patch: Partial<Profile>) => void
  clearPhotos: () => void
  addWardrobe: (item: Omit<WardrobeItem, 'id'>) => void
  removeWardrobe: (id: string) => void
  saveLook: (garmentId: string, occasion: string) => void
  removeLook: (id: string) => void
  addEvent: (e: Omit<EventPlan, 'id'>) => EventPlan
  removeEvent: (id: string) => void
  toggleLike: (id: string) => void
  toggleDislike: (id: string) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)
const KEY = 'highlight.state.v1'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? { ...EMPTY, ...(JSON.parse(raw) as State) } : EMPTY
    } catch {
      return EMPTY
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked — features still work for the session */
    }
  }, [state])

  const uid = () => Math.random().toString(36).slice(2, 10)

  const api = useMemo<Store>(
    () => ({
      ...state,
      setConsent: (granted) =>
        setState((s) => ({
          ...s,
          consent: { granted, version: '1.0', at: new Date().toISOString() },
        })),
      saveProfile: (p) => setState((s) => ({ ...s, profile: p })),
      updateProfile: (patch) =>
        setState((s) => ({
          ...s,
          profile: s.profile ? { ...s.profile, ...patch } : s.profile,
        })),
      clearPhotos: () =>
        setState((s) => ({
          ...s,
          profile: s.profile
            ? { ...s.profile, facePhoto: undefined, bodyPhoto: undefined }
            : s.profile,
        })),
      addWardrobe: (item) =>
        setState((s) => ({
          ...s,
          wardrobe: [{ ...item, id: uid() }, ...s.wardrobe],
        })),
      removeWardrobe: (id) =>
        setState((s) => ({
          ...s,
          wardrobe: s.wardrobe.filter((w) => w.id !== id),
        })),
      saveLook: (garmentId, occasion) =>
        setState((s) =>
          s.looks.some((l) => l.garmentId === garmentId && l.occasion === occasion)
            ? s
            : {
                ...s,
                looks: [
                  { id: uid(), garmentId, occasion, savedAt: new Date().toISOString() },
                  ...s.looks,
                ],
              },
        ),
      removeLook: (id) =>
        setState((s) => ({ ...s, looks: s.looks.filter((l) => l.id !== id) })),
      addEvent: (e) => {
        const full = { ...e, id: uid() }
        setState((s) => ({ ...s, events: [full, ...s.events] }))
        return full
      },
      removeEvent: (id) =>
        setState((s) => ({ ...s, events: s.events.filter((ev) => ev.id !== id) })),
      toggleLike: (id) =>
        setState((s) => ({
          ...s,
          likes: s.likes.includes(id)
            ? s.likes.filter((x) => x !== id)
            : [...s.likes, id],
          dislikes: s.dislikes.filter((x) => x !== id),
        })),
      toggleDislike: (id) =>
        setState((s) => ({
          ...s,
          dislikes: s.dislikes.includes(id)
            ? s.dislikes.filter((x) => x !== id)
            : [...s.dislikes, id],
          likes: s.likes.filter((x) => x !== id),
        })),
      resetAll: () => setState(EMPTY),
    }),
    [state],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/* Read a File into a data URL (private, stays in the browser). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
