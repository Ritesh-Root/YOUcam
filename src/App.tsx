import { useCallback, useRef, useState } from 'react'
import {
  HomeIcon,
  PlusIcon,
  ProfileIcon,
  ProgressIcon,
  RoutineIcon,
} from './components/icons'
import { AppContext, type Tab } from './components/app-context'
import { useStore } from './store'
import { Home } from './screens/Home'
import { Routine } from './screens/Routine'
import { Progress } from './screens/Progress'
import { Profile } from './screens/Profile'
import { StylistMenu } from './stylist/StylistMenu'
import { ProfileSetup } from './stylist/ProfileSetup'
import { Palette } from './stylist/Palette'
import { CulturalStyles } from './stylist/CulturalStyles'
import { Occasion } from './stylist/Occasion'
import { Wardrobe } from './stylist/Wardrobe'
import { TryOn } from './stylist/TryOn'
import { SkinPrep } from './stylist/SkinPrep'
import { AIFeature } from './stylist/AIFeature'
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
  const [view, setView] = useState<StylistView | null>(null)
  const [occasionPreset, setOccasionPreset] = useState<string | undefined>()
  const [featureId, setFeatureId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((message: string) => {
    setToast(message)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const navigate = useCallback((next: Tab) => setTab(next), [])

  // Any stylist feature requires a set-up profile first.
  const openStylist = useCallback(
    (v: StylistView) => {
      setMenuOpen(false)
      if (v !== 'profile' && !store.profile) {
        setView('profile')
      } else {
        setView(v)
      }
    },
    [store.profile],
  )

  // Provider-backed AI features also require a set-up profile first.
  const openFeature = useCallback(
    (id: string) => {
      setMenuOpen(false)
      if (!store.profile) {
        setFeatureId(id)
        setView('profile')
      } else {
        setFeatureId(id)
        setView('aifeature')
      }
    },
    [store.profile],
  )

  const goOccasion = useCallback(
    (preset?: string) => {
      setOccasionPreset(preset)
      if (!store.profile) setView('profile')
      else setView('occasion')
    },
    [store.profile],
  )

  return (
    <AppContext.Provider value={{ navigate, notify }}>
      <div className="min-h-screen w-full bg-background sm:grid sm:place-items-center sm:py-8">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col overflow-hidden bg-card shadow-xl shadow-primary/20 sm:min-h-0 sm:h-[860px] sm:rounded-[2.75rem] sm:ring-8 sm:ring-white/70">
          {/* Base tab screens */}
          <main className="scroll-area flex-1 overflow-y-auto pb-28">
            {tab === 'home' && (
              <Home
                onOpenStylist={openStylist}
                onOpenOccasion={goOccasion}
                onOpenSetup={() => setView('profile')}
              />
            )}
            {tab === 'routine' && <Routine />}
            {tab === 'progress' && <Progress />}
            {tab === 'profile' && <Profile onEdit={() => setView('profile')} />}
          </main>

          {/* Toast */}
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-6"
          >
            {toast && (
              <div className="animate-pop rounded-full bg-foreground/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
                {toast}
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <nav
            aria-label="Primary"
            className="absolute inset-x-0 bottom-0 z-10 border-t border-border/60 bg-card/95 backdrop-blur"
          >
            <div className="relative mx-auto flex max-w-[440px] items-center justify-between px-5 pb-5 pt-3">
              {navItems.slice(0, 2).map((item) => (
                <NavButton key={item.id} {...item} active={tab === item.id} onClick={() => setTab(item.id)} />
              ))}
              <button
                aria-label="Open AI Stylist"
                className="grid h-14 w-14 -translate-y-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-card transition-transform active:scale-95"
                onClick={() => setMenuOpen(true)}
              >
                <PlusIcon width={26} />
              </button>
              {navItems.slice(2).map((item) => (
                <NavButton key={item.id} {...item} active={tab === item.id} onClick={() => setTab(item.id)} />
              ))}
            </div>
          </nav>

          {/* AI Stylist menu */}
          <StylistMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onPick={openStylist}
            onPickFeature={openFeature}
          />

          {/* Stylist feature overlays */}
          {view === 'profile' && <ProfileSetup onClose={() => setView(null)} />}
          {view === 'palette' && <Palette onClose={() => setView(null)} />}
          {view === 'cultural' && (
            <CulturalStyles onClose={() => setView(null)} onNavigate={openStylist} />
          )}
          {view === 'occasion' && (
            <Occasion onClose={() => setView(null)} onNavigate={openStylist} preset={occasionPreset} />
          )}
          {view === 'wardrobe' && (
            <Wardrobe onClose={() => setView(null)} onNavigate={openStylist} />
          )}
          {view === 'tryon' && <TryOn onClose={() => setView(null)} />}
          {view === 'skinprep' && <SkinPrep onClose={() => setView(null)} />}
          {view === 'aifeature' && featureId && (
            <AIFeature featureId={featureId} onClose={() => setView(null)} />
          )}
        </div>
      </div>
    </AppContext.Provider>
  )
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: typeof HomeIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-14 flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <Icon width={22} strokeWidth={active ? 2.4 : 2} />
      {label}
    </button>
  )
}
