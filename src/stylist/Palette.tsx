import { Chip, Screen, SetupBanner } from '../components/overlay'
import { palettes, useStore, type Undertone } from '../store'

export function Palette({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const profile = store.profile
  const undertone: Undertone = profile?.undertone ?? 'neutral'
  const swatches = palettes[undertone]

  return (
    <Screen title="My Palette" subtitle="Colors that complement you" onClose={onClose}>
      <SetupBanner>
        Automatic skin-tone analysis needs YouCam provider setup. These
        suggestions use your self-selected undertone and are style guidance, not
        a scientific measurement.
      </SetupBanner>

      <div className="mb-5">
        <p className="mb-2 font-display text-sm font-bold">Your undertone</p>
        <div className="flex gap-2">
          {(['warm', 'cool', 'neutral'] as Undertone[]).map((u) => (
            <Chip
              key={u}
              label={u[0].toUpperCase() + u.slice(1)}
              selected={undertone === u}
              onClick={() =>
                profile
                  ? store.updateProfile({ undertone: u })
                  : undefined
              }
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Adjust if lighting affected your photo or you prefer a different read.
        </p>
      </div>

      <p className="mb-3 font-display text-sm font-bold">Wearable colors</p>
      <div className="grid grid-cols-1 gap-2.5">
        {swatches.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border/50"
          >
            <span
              className="h-12 w-12 flex-shrink-0 rounded-xl ring-1 ring-black/5"
              style={{ backgroundColor: s.hex }}
            />
            <div className="flex-1">
              <p className="font-display font-bold leading-tight">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.wear}</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{s.hex}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 mb-3 font-display text-sm font-bold">Outfit examples</p>
      <div className="flex gap-3 overflow-x-auto pb-2 scroll-area">
        {swatches.slice(0, 4).map((s, i) => (
          <div key={i} className="flex-shrink-0">
            <div
              className="h-32 w-24 rounded-2xl"
              style={{
                background: `linear-gradient(160deg, ${s.hex}, ${
                  swatches[(i + 1) % swatches.length].hex
                })`,
              }}
            />
            <p className="mt-1 w-24 text-center text-xs font-semibold text-secondary-foreground">
              {s.name} look
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        We preserve your natural appearance — no skin lightening or beautifying
        filters are ever applied.
      </p>
    </Screen>
  )
}
