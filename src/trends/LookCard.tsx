import { HeartIcon } from '../components/icons'
import { useStore } from '../store'
import { shopUrl, type City, type Occasion } from './data'
import { formatSourceDate, type RankedTrend } from './engine'

export type LookContext = { city: City; occasion?: Occasion }

export type LookActions = {
  onTryOutfit: (r: RankedTrend, ctx: LookContext) => void
  onTryOwnGarment: (r: RankedTrend, ctx: LookContext) => void
  onTryMakeup: (r: RankedTrend, ctx: LookContext) => void
}

export function LookCard({ ranked, city, occasion, actions }: { ranked: RankedTrend; city: City; occasion?: Occasion; actions: LookActions }) {
  const ctx: LookContext = { city, occasion }
  const store = useStore()
  const t = ranked.trend
  const liked = store.likes.includes(t.id)

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-card shadow-sm ring-1 ring-border/50">
      <div className="flex h-3">
        {t.colors.map((c) => (
          <span key={c} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
              {t.kind === 'makeup' ? 'Makeup' : 'Outfit'} · {city.name}
            </p>
            <h3 className="font-display font-bold leading-tight">{t.title}</h3>
          </div>
          <button
            onClick={() => store.toggleLike(t.id)}
            aria-label={liked ? 'Unlike' : 'Like'}
            aria-pressed={liked}
            className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-secondary ${liked ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <HeartIcon width={18} className={liked ? 'fill-current' : ''} />
          </button>
        </div>

        <p className="text-sm text-secondary-foreground">{t.summary}</p>

        <ul className="space-y-0.5 text-xs text-secondary-foreground">
          {ranked.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
          {ranked.weatherNote && <li>• {ranked.weatherNote}</li>}
        </ul>

        <details className="rounded-2xl bg-secondary/60 p-3 text-xs">
          <summary className="cursor-pointer font-bold text-secondary-foreground">
            Sources ({t.sources.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {t.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-2 hover:underline">
                  {s.publisher}: {s.title}
                </a>
                <span className="text-muted-foreground"> · {formatSourceDate(s.date)}</span>
              </li>
            ))}
          </ul>
        </details>

        {t.tryon.cloth?.note && <p className="text-xs text-muted-foreground">{t.tryon.cloth.note}</p>}
        {!t.tryon.cloth && t.tryon.uploadHint && <p className="text-xs text-muted-foreground">{t.tryon.uploadHint}</p>}

        <div className="flex flex-wrap gap-2">
          {t.tryon.cloth && (
            <button onClick={() => actions.onTryOutfit(ranked, ctx)} className="rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-white">
              Try on: {t.tryon.cloth.title.replace(/ \(.*\)$/, '')}
            </button>
          )}
          {t.kind === 'outfit' && (
            <button onClick={() => actions.onTryOwnGarment(ranked, ctx)} className="rounded-full border border-border px-3.5 py-2 text-xs font-bold text-secondary-foreground">
              Try my own garment
            </button>
          )}
          {t.tryon.makeup && (
            <button onClick={() => actions.onTryMakeup(ranked, ctx)} className="rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-white">
              Try this makeup
            </button>
          )}
          <a
            href={shopUrl(t)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-3.5 py-2 text-xs font-bold text-secondary-foreground"
          >
            Shop similar
          </a>
          <button
            onClick={() => store.toggleDislike(t.id)}
            className="ml-auto rounded-full px-2.5 py-2 text-xs font-bold text-muted-foreground"
          >
            Not for me
          </button>
        </div>
      </div>
    </article>
  )
}
