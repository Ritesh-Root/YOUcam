import { Screen } from '../components/overlay'
import { formatDate, useStore } from '../store'
import { cityById } from '../trends/data'

export function SavedLooks({ onClose }: { onClose: () => void }) {
  const store = useStore()
  return (
    <Screen title="Saved looks" subtitle={`${store.looks.length} saved on this device`} onClose={onClose}>
      {store.looks.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-secondary p-8 text-center">
          <p className="text-4xl" aria-hidden>🪞</p>
          <p className="mt-2 font-display font-bold text-secondary-foreground">No saved looks yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Try on an outfit or makeup look and tap Save.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {store.looks.map((l) => (
            <article key={l.id} className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border/50">
              {l.image ? (
                <img src={l.image} alt={l.title} className="aspect-[3/4] w-full object-cover" />
              ) : (
                <div className="grid aspect-[3/4] w-full place-items-center bg-secondary p-3 text-center text-xs text-muted-foreground">
                  Image not kept
                </div>
              )}
              <div className="p-3">
                <p className="line-clamp-2 font-display text-sm font-bold leading-tight">{l.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatDate(l.savedAt.slice(0, 10))}
                  {l.cityId ? ` · ${cityById(l.cityId)?.name ?? ''}` : ''}
                </p>
                <button onClick={() => store.removeLook(l.id)} className="mt-2 text-xs font-bold text-muted-foreground">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Screen>
  )
}
