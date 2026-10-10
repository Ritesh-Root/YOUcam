import { useEffect, useMemo, useState } from 'react'
import { BottomSheet } from '../components/overlay'
import { getFeatureCosts, type Sku } from '../youcam'
import type { StylistView } from './routes'
import { AI_FEATURES, FEATURE_CATEGORIES } from './features'

const core: { id: StylistView; label: string; emoji: string; hint: string }[] = [
  { id: 'occasion', label: 'Dress for an Occasion', emoji: '✨', hint: 'Trending where your event is' },
  { id: 'trends', label: 'Trending Near You', emoji: '📍', hint: 'Looks by city, with sources' },
  { id: 'tryon', label: 'Outfit Try-On', emoji: '🪞', hint: 'YouCam outfits or your own' },
  { id: 'palette', label: 'My Palette', emoji: '🎨', hint: 'Measured or chosen colours' },
  { id: 'wardrobe', label: 'My Wardrobe', emoji: '👗', hint: 'Try on what you own' },
  { id: 'skinprep', label: 'Skin Prep', emoji: '💧', hint: 'Event-ready, gently' },
]

function priceLabel(skus: Sku[] | undefined, task: string): string | undefined {
  if (!skus) return undefined
  const match = skus.filter((s) => s.run_task_url.endsWith(`/s2s/${task}`))
  if (!match.length) return undefined
  const min = match.reduce((a, b) => (a.amount / a.proc_unit <= b.amount / b.proc_unit ? a : b))
  const per = min.unit === 'second' ? '/s' : ''
  return min.proc_unit > 1 ? `${min.amount}u/${min.proc_unit}${per ? 's' : ''}` : `${min.amount}u${per}`
}

export function StylistMenu({
  open,
  onClose,
  onPick,
  onPickFeature,
}: {
  open: boolean
  onClose: () => void
  onPick: (v: StylistView) => void
  onPickFeature: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [skus, setSkus] = useState<Sku[]>()
  const q = query.trim().toLowerCase()

  useEffect(() => {
    if (open && !skus) getFeatureCosts().then(setSkus).catch(() => undefined)
  }, [open, skus])

  const grouped = useMemo(
    () =>
      FEATURE_CATEGORIES.map((cat) => ({
        ...cat,
        items: AI_FEATURES.filter(
          (feat) => feat.category === cat.name && (!q || feat.name.toLowerCase().includes(q) || feat.blurb.toLowerCase().includes(q)),
        ),
      })).filter((g) => g.items.length > 0),
    [q],
  )

  const coreMatches = core.filter((c) => !q || c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q))
  const noResults = coreMatches.length === 0 && grouped.length === 0

  return (
    <BottomSheet open={open} onClose={onClose} title="AI Stylist">
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search features…"
          aria-label="Search features"
          className="w-full rounded-full border border-border bg-secondary/60 py-2.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary"
        />
      </div>

      <div className="scroll-area max-h-[60vh] space-y-5 overflow-y-auto pb-1">
        {coreMatches.length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Your Stylist</h3>
            <div className="grid grid-cols-2 gap-3">
              {coreMatches.map((it) => (
                <button key={it.id} onClick={() => onPick(it.id)} className="flex flex-col items-start gap-2 rounded-3xl bg-secondary p-4 text-left transition-transform active:scale-[0.97]">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card text-xl shadow-sm" aria-hidden>{it.emoji}</span>
                  <span className="font-display text-sm font-bold leading-tight text-secondary-foreground">{it.label}</span>
                  <span className="text-xs text-muted-foreground">{it.hint}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {grouped.map((group) => (
          <section key={group.name}>
            <h3 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <span aria-hidden>{group.emoji}</span>
              {group.name}
            </h3>
            <div className="space-y-2">
              {group.items.map((feat) => {
                const price = priceLabel(skus, feat.task)
                return (
                  <button key={feat.id} onClick={() => onPickFeature(feat.id)} className="flex w-full items-center gap-3 rounded-2xl bg-secondary/60 p-3 text-left transition-transform active:scale-[0.98]">
                    <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-card text-lg shadow-sm" aria-hidden>{feat.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm font-bold text-secondary-foreground">{feat.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{feat.blurb}</span>
                    </span>
                    {price && (
                      <span className="flex-shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary" title="YouCam units">
                        {price}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        {noResults && <p className="py-6 text-center text-sm text-muted-foreground">No features match “{query}”.</p>}
        <p className="px-1 text-[11px] text-muted-foreground">Prices are YouCam units per result (u) or per second (/s), from YouCam’s live price list.</p>
      </div>
    </BottomSheet>
  )
}
