import { useRef, useState } from 'react'
import { Chip, Screen } from '../components/overlay'
import { PlusIcon } from '../components/icons'
import { OCCASIONS, fileToDataUrl, useStore } from '../store'
import type { StylistView } from './routes'

const TYPES = ['Top', 'Bottom', 'Dress', 'Ethnic', 'Outerwear', 'Footwear']

export function Wardrobe({
  onClose,
  onNavigate,
}: {
  onClose: () => void
  onNavigate: (v: StylistView) => void
}) {
  const store = useStore()
  const [filter, setFilter] = useState('All')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('Top')
  const [color, setColor] = useState('#f472a0')
  const [occasion, setOccasion] = useState('casual')
  const [photo, setPhoto] = useState<string | undefined>()
  const fileRef = useRef<HTMLInputElement>(null)

  const items =
    filter === 'All'
      ? store.wardrobe
      : store.wardrobe.filter((w) => w.type === filter)

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f?.type.startsWith('image/')) setPhoto(await fileToDataUrl(f))
  }

  const add = () => {
    if (!name.trim()) return
    store.addWardrobe({ name: name.trim(), type, color, occasion, photo })
    setName('')
    setPhoto(undefined)
    setAdding(false)
  }

  return (
    <Screen
      title="My Wardrobe"
      subtitle={`${store.wardrobe.length} item${store.wardrobe.length === 1 ? '' : 's'}`}
      onClose={onClose}
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label="Add garment"
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white shadow-md shadow-primary/30"
        >
          <PlusIcon width={20} />
        </button>
      }
    >
      {adding && (
        <div className="mb-5 space-y-3 rounded-3xl bg-secondary p-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="grid h-28 w-full place-items-center overflow-hidden rounded-2xl bg-card ring-1 ring-border"
          >
            {photo ? (
              <img src={photo} alt="Garment" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">
                📷 Add garment photo
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Garment name"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
          />
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <Chip key={t} label={t} selected={type === t} onClick={() => setType(t)} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold">
              Color
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="ml-2 h-8 w-10 rounded border-0 bg-transparent align-middle"
              />
            </label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold"
            >
              {OCCASIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={add}
            className="w-full rounded-full bg-primary py-3 font-display font-bold text-primary-foreground"
          >
            Save to wardrobe
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scroll-area">
        {['All', ...TYPES].map((t) => (
          <div key={t} className="flex-shrink-0">
            <Chip label={t} selected={filter === t} onClick={() => setFilter(t)} />
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-secondary p-8 text-center">
          <p className="text-4xl">👚</p>
          <p className="mt-2 font-display font-bold text-secondary-foreground">
            {store.wardrobe.length === 0 ? 'Your wardrobe is empty' : 'Nothing in this filter'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload clothing photos to mix owned pieces with suggested styles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((w) => (
            <div key={w.id} className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border/50">
              <div className="h-28 w-full" style={{ backgroundColor: w.color }}>
                {w.photo && (
                  <img src={w.photo} alt={w.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-display text-sm font-bold">{w.name}</p>
                <p className="text-xs text-muted-foreground">
                  {w.type} · {OCCASIONS.find((o) => o.id === w.occasion)?.label ?? w.occasion}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onNavigate('tryon')}
                    className="rounded-full border border-border px-2.5 py-1 text-xs font-bold text-secondary-foreground"
                  >
                    Try On
                  </button>
                  <button
                    onClick={() => store.removeWardrobe(w.id)}
                    className="ml-auto rounded-full px-2 py-1 text-xs font-bold text-muted-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Screen>
  )
}
