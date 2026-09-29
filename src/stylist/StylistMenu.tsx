import { useMemo, useState } from 'react'
import { BottomSheet } from '../components/overlay'
import type { StylistView } from './routes'
import { AI_FEATURES, FEATURE_CATEGORIES } from './features'

const core: { id: StylistView; label: string; emoji: string; hint: string }[] = [
  { id: 'palette', label: 'My Palette', emoji: '🎨', hint: 'Colors that suit you' },
  { id: 'cultural', label: 'Cultural Styles', emoji: '🥻', hint: 'Regional outfits' },
  { id: 'occasion', label: 'Dress for an Occasion', emoji: '✨', hint: 'Where are you going?' },
  { id: 'wardrobe', label: 'My Wardrobe', emoji: '👗', hint: 'Your garments' },
  { id: 'tryon', label: 'Virtual Try-On', emoji: '🪞', hint: 'Preview a look' },
  { id: 'skinprep', label: 'Skin Prep', emoji: '💧', hint: 'Event-ready skin' },
]

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
  const q = query.trim().toLowerCase()

  const grouped = useMemo(
    () =>
      FEATURE_CATEGORIES.map((cat) => ({
        ...cat,
        items: AI_FEATURES.filter(
          (feat) =>
            feat.category === cat.name &&
            (!q ||
              feat.name.toLowerCase().includes(q) ||
              feat.blurb.toLowerCase().includes(q)),
        ),
      })).filter((g) => g.items.length > 0),
    [q],
  )

  const coreMatches = core.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q),
  )
  const noResults = coreMatches.length === 0 && grouped.length === 0

  return (
    <BottomSheet open={open} onClose={onClose} title="AI Stylist">
      {/* Search */}
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search features…"
          aria-label="Search features"
          className="w-full rounded-full border border-border bg-secondary/60 py-2.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary"
        />
      </div>

      {/* Scrollable feature list */}
      <div className="scroll-area max-h-[60vh] space-y-5 overflow-y-auto pb-1">
        {coreMatches.length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Your Stylist
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {coreMatches.map((it) => (
                <button
                  key={it.id}
                  onClick={() => onPick(it.id)}
                  className="flex flex-col items-start gap-2 rounded-3xl bg-secondary p-4 text-left transition-transform active:scale-[0.97]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card text-xl shadow-sm">
                    {it.emoji}
                  </span>
                  <span className="font-display text-sm font-bold leading-tight text-secondary-foreground">
                    {it.label}
                  </span>
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
              {group.items.map((feat) => (
                <button
                  key={feat.id}
                  onClick={() => onPickFeature(feat.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-secondary/60 p-3 text-left transition-transform active:scale-[0.98]"
                >
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-card text-lg shadow-sm">
                    {feat.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold text-secondary-foreground">
                      {feat.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {feat.blurb}
                    </span>
                  </span>
                  <span className="flex-shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                    Setup
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        {noResults && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No features match “{query}”.
          </p>
        )}
      </div>
    </BottomSheet>
  )
}
