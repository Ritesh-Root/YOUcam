import { useCallback, useMemo, useRef, useState } from 'react'
import { HomeIcon, PlusIcon, ProfileIcon, ProgressIcon, RoutineIcon } from './components/icons'
import { AppContext, type Tab } from './components/app-context'
import { useStore } from './store'
import { Home } from './screens/Home'
import { Routine } from './screens/Routine'
import { Progress } from './screens/Progress'
import { Profile } from './screens/Profile'
import { StylistMenu } from './stylist/StylistMenu'
import { ProfileSetup } from './stylist/ProfileSetup'
import { Palette } from './stylist/Palette'
import { LocalTrends } from './stylist/LocalTrends'
import { Occasion } from './stylist/Occasion'
import { Wardrobe } from './stylist/Wardrobe'
import { TryOn, type TryOnPreset } from './stylist/TryOn'
import { SkinPrep } from './stylist/SkinPrep'
import { SavedLooks } from './stylist/SavedLooks'
import { AIFeature, type FeaturePreset } from './stylist/AIFeature'
import { getFeature } from './stylist/features'
import { TRENDS } from './trends/data'
import type { LookActions } from './trends/LookCard'
import type { StylistView } from './stylist/routes'

const navItems: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'routine', label: 'Routine', icon: RoutineIcon },
  { id: 'progress', label: 'Progress', icon: ProgressIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
]

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [stack, setStack] = useState<StylistView[]>([])
  const [occasionPreset, setOccasionPreset] = useState<{ occasion?: string; eventId?: string }>()
  const [tryOnPreset, setTryOnPreset] = useState<TryOnPreset>()
  const [feature, setFeature] = useState<{ id: string; preset?: FeaturePreset }>()
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const view = stack.at(-1) ?? null

  const notify = useCallback((message: string) => {
    setToast(message)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const navigate = useCallback((next: Tab) => {
    setStack([])
    setTab(next)
  }, [])

  const push = useCallback((v: StylistView) => {
    setMenuOpen(false)
    setStack((s) => [...s.filter((x) => x !== v), v])
  }, [])
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), [])

  const openStylist = useCallback(
    (v: StylistView) => {
      if (v === 'tryon') setTryOnPreset(undefined)
      if (v === 'occasion') setOccasionPreset(undefined)
      push(v)
    },
    [push],
  )

  const openFeature = useCallback(
    (id: string, preset?: FeaturePreset) => {
      if (getFeature(id)?.screen === 'tryon') {
        setTryOnPreset(undefined)
        push('tryon')
        return
      }
      setFeature({ id, preset })
      push('aifeature')
    },
    [push],
  )

  const openOccasion = useCallback(
    (preset?: { occasion?: string; eventId?: string }) => {
      setOccasionPreset(preset)
      push('occasion')
    },
    [push],
  )

  const openTryOn = useCallback(
    (preset?: TryOnPreset) => {
      setTryOnPreset(preset)
      push('tryon')
    },
    [push],
  )

  const lookActions = useMemo<LookActions>(
    () => ({
      onTryOutfit: (r, ctx) =>
        openTryOn({
          templateId: r.trend.tryon.cloth?.templateId,
          title: r.trend.tryon.cloth?.title,
          trendId: r.trend.id,
          cityId: ctx.city.id,
          occasion: ctx.occasion,
        }),
      onTryOwnGarment: (r, ctx) => openTryOn({ trendId: r.trend.id, cityId: ctx.city.id, occasion: ctx.occasion, own: true }),
      onTryMakeup: (r) =>
        openFeature('makeup-tryon', {
          label: `${r.trend.title}: ${r.trend.tryon.makeup?.label ?? ''}`,
          bodyOverride: { effects: r.trend.tryon.makeup?.effects ?? [] },
          hideParams: true,
        }),
    }),
    [openTryOn, openFeature],
  )

  if (!store.loaded) {
    return <div className="grid h-full place-items-center bg-background text-sm text-muted-foreground">Loading…</div>
  }

  return (
    <AppContext.Provider value={{ navigate, notify }}>
      <div className="h-full w-full overflow-hidden bg-background sm:grid sm:place-items-center sm:p-8">
        <div className="relative mx-auto flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-card shadow-xl shadow-primary/20 sm:h-[min(860px,100%)] sm:rounded-[2.75rem] sm:ring-8 sm:ring-white/70">
          {store.saveError && (
            <div role="alert" className="z-50 bg-[#fde7e5] px-4 py-2 text-center text-xs font-semibold text-[#8c1d18]">{store.saveError}</div>
          )}
          <main className="scroll-area flex-1 overflow-y-auto pb-28">
            {tab === 'home' && (
              <Home onOpenStylist={openStylist} onOpenOccasion={openOccasion} onOpenSetup={() => push('profile')} onOpenFeature={openFeature} />
            )}
            {tab === 'routine' && <Routine />}
            {tab === 'progress' && <Progress onScan={() => openFeature('skin-analysis')} />}
            {tab === 'profile' && <Profile onEdit={() => push('profile')} onOpen={openStylist} />}
          </main>

          <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-24 z-[60] flex justify-center px-6">
            {toast && <div className="animate-pop rounded-full bg-foreground/90 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg">{toast}</div>}
          </div>

          <nav aria-label="Primary" className="absolute inset-x-0 bottom-0 z-10 border-t border-border/60 bg-card/95 backdrop-blur">
            <div className="relative mx-auto flex max-w-[440px] items-center justify-between px-5 pb-5 pt-3">
              {navItems.slice(0, 2).map((item) => (
                <NavButton key={item.id} {...item} active={tab === item.id} onClick={() => navigate(item.id)} />
              ))}
              <button
                aria-label="Open AI Stylist"
                className="grid h-14 w-14 -translate-y-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-card transition-transform active:scale-95"
                onClick={() => setMenuOpen(true)}
              >
                <PlusIcon width={26} />
              </button>
              {navItems.slice(2).map((item) => (
                <NavButton key={item.id} {...item} active={tab === item.id} onClick={() => navigate(item.id)} />
              ))}
            </div>
          </nav>

          <StylistMenu open={menuOpen} onClose={() => setMenuOpen(false)} onPick={openStylist} onPickFeature={(id) => openFeature(id)} />

          {view === 'profile' && <ProfileSetup onClose={pop} />}
          {view === 'palette' && <Palette onClose={pop} onMeasure={() => openFeature('facial-tones')} />}
          {view === 'trends' && <LocalTrends onClose={pop} actions={lookActions} />}
          {view === 'occasion' && <Occasion onClose={pop} preset={occasionPreset} actions={lookActions} />}
          {view === 'wardrobe' && <Wardrobe onClose={pop} onTryOn={(photo) => openTryOn({ garmentPhoto: photo })} />}
          {view === 'tryon' && (
            <TryOn
              key={JSON.stringify(tryOnPreset ?? {})}
              preset={tryOnPreset}
              onClose={pop}
              onOpenMakeup={(trendId) => {
                const t = TRENDS.find((x) => x.id === trendId)
                if (t?.tryon.makeup) {
                  openFeature('makeup-tryon', { label: `${t.title}: ${t.tryon.makeup.label}`, bodyOverride: { effects: t.tryon.makeup.effects }, hideParams: true })
                }
              }}
            />
          )}
          {view === 'skinprep' && <SkinPrep onClose={pop} onOpenFeature={(id) => openFeature(id)} />}
          {view === 'looks' && <SavedLooks onClose={pop} />}
          {view === 'aifeature' && feature && (
            <AIFeature key={`${feature.id}-${feature.preset?.label ?? ''}`} featureId={feature.id} preset={feature.preset} onClose={pop} />
          )}
        </div>
      </div>
    </AppContext.Provider>
  )
}

function NavButton({ label, icon: Icon, active, onClick }: { label: string; icon: typeof HomeIcon; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-14 flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <Icon width={22} strokeWidth={active ? 2.4 : 2} />
      {label}
    </button>
  )
}
