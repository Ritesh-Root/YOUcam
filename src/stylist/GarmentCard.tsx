import { HeartIcon } from '../components/icons'
import { useStore, type Ranked } from '../store'

export function GarmentVisual({ colors }: { colors: string[] }) {
  return (
    <div
      className="h-28 w-full rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${
          colors[1] ?? colors[0]
        } 100%)`,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 100 70" className="h-full w-full opacity-90">
        <path d="M35 8 L50 16 L65 8 L74 22 L64 30 L64 62 L36 62 L36 30 L26 22 Z" fill="rgba(255,255,255,0.35)" />
      </svg>
    </div>
  )
}

export function GarmentCard({
  ranked,
  occasion,
  onTryOn,
  onPlanPrep,
}: {
  ranked: Ranked
  occasion?: string
  onTryOn?: () => void
  onPlanPrep?: () => void
}) {
  const store = useStore()
  const g = ranked.garment
  const liked = store.likes.includes(g.id)
  const disliked = store.dislikes.includes(g.id)
  const saved = store.looks.some((l) => l.garmentId === g.id)

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-card shadow-sm ring-1 ring-border/50">
      <div className="relative p-2">
        <GarmentVisual colors={g.colors} />
        <button
          onClick={() => store.toggleLike(g.id)}
          aria-label={liked ? 'Unlike' : 'Like'}
          aria-pressed={liked}
          className={`absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-card/90 shadow-sm transition ${
            liked ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <HeartIcon width={18} className={liked ? 'fill-current' : ''} />
        </button>
      </div>
      <div className="space-y-3 p-4 pt-1">
        <div>
          <h3 className="font-display font-bold leading-tight">{g.name}</h3>
          <p className="text-xs text-muted-foreground">
            {g.region} · {g.type}
          </p>
        </div>

        <div className="rounded-2xl bg-secondary/70 p-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">
            Why this suits you
          </p>
          <ul className="space-y-0.5 text-xs text-secondary-foreground">
            {ranked.reasons.slice(0, 3).map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => store.saveLook(g.id, occasion ?? 'general')}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              saved
                ? 'bg-primary text-white'
                : 'border border-border bg-card text-secondary-foreground'
            }`}
          >
            {saved ? '✓ Saved' : 'Save Look'}
          </button>
          {onTryOn && (
            <button
              onClick={onTryOn}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-secondary-foreground"
            >
              Try On
            </button>
          )}
          {onPlanPrep && (
            <button
              onClick={onPlanPrep}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-secondary-foreground"
            >
              Plan Skin Prep
            </button>
          )}
          <button
            onClick={() => store.toggleDislike(g.id)}
            aria-pressed={disliked}
            className={`ml-auto rounded-full px-2.5 py-1.5 text-xs font-bold transition ${
              disliked ? 'bg-foreground/80 text-white' : 'text-muted-foreground'
            }`}
          >
            Not for me
          </button>
        </div>
      </div>
    </article>
  )
}
