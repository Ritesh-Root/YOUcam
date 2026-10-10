import { Chip, Screen } from '../components/overlay'
import { formatDate, palettes, useStore, type Undertone } from '../store'

export function Palette({ onClose, onMeasure }: { onClose: () => void; onMeasure: () => void }) {
  const store = useStore()
  const profile = store.profile
  const undertone: Undertone = profile?.undertone ?? 'neutral'
  const swatches = palettes[undertone]
  const tone = store.tone

  return (
    <Screen title="My Palette" subtitle="Colours used to rank your looks" onClose={onClose}>
      <div className="space-y-5 pb-4">
        {tone ? (
          <div className="rounded-3xl bg-card p-4 ring-1 ring-border/60">
            <p className="font-display text-sm font-bold">Measured by YouCam Facial Color Tones</p>
            <p className="mb-3 text-xs text-muted-foreground">{formatDate(tone.measuredAt.slice(0, 10))}</p>
            <div className="grid grid-cols-5 gap-2">
              {([['Skin', tone.skin], ['Eyes', tone.eye], ['Brows', tone.brow], ['Lips', tone.lip], ['Hair', tone.hair]] as const)
                .filter(([, hex]) => hex)
                .map(([label, hex]) => (
                  <div key={label} className="text-center">
                    <span className="mx-auto block h-11 w-11 rounded-2xl ring-1 ring-black/10" style={{ backgroundColor: hex }} />
                    <p className="mt-1 text-[11px] font-bold">{label}</p>
                  </div>
                ))}
            </div>
            <button onClick={onMeasure} className="mt-3 text-xs font-bold text-primary">Measure again (20 units)</button>
          </div>
        ) : (
          <div className="rounded-3xl bg-secondary p-4">
            <p className="text-sm text-secondary-foreground">
              Measure your skin, eye, lip and hair colours from a selfie with YouCam’s Facial Color Tones analysis, or choose an undertone yourself below.
            </p>
            <button onClick={onMeasure} className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">
              Measure my colours (20 units)
            </button>
          </div>
        )}

        <div>
          <p className="mb-2 font-display text-sm font-bold">Undertone</p>
          <div className="flex gap-2">
            {(['warm', 'cool', 'neutral'] as Undertone[]).map((u) => (
              <Chip
                key={u}
                label={u[0].toUpperCase() + u.slice(1)}
                selected={undertone === u}
                onClick={() => profile && store.updateProfile({ undertone: u, undertoneSource: 'self' })}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {profile?.undertoneSource === 'measured'
              ? 'Estimated from your measured skin colour. Change it if it looks wrong to you.'
              : profile
                ? 'Chosen by you. Palette advice is style guidance, not a measurement.'
                : 'Set up your profile to save a palette.'}
          </p>
        </div>

        <div>
          <p className="mb-3 font-display text-sm font-bold">Colours to try</p>
          <div className="grid grid-cols-1 gap-2.5">
            {swatches.map((s) => (
              <div key={s.name} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border/50">
                <span className="h-12 w-12 flex-shrink-0 rounded-xl ring-1 ring-black/5" style={{ backgroundColor: s.hex }} />
                <div className="flex-1">
                  <p className="font-display font-bold leading-tight">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.wear}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{s.hex}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          HIGHLIGHT never lightens skin or applies beauty filters on its own. Edit tools only run when you choose them.
        </p>
      </div>
    </Screen>
  )
}
