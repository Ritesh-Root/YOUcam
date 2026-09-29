import { ChevronRight } from '../components/icons'
import { useApp } from '../components/app-context'
import { useStore } from '../store'

export function Profile({ onEdit }: { onEdit: () => void }) {
  const { notify } = useApp()
  const store = useStore()
  const p = store.profile

  const rows = [
    {
      label: p ? 'Skin & Style Profile' : 'Set up your profile',
      hint: p
        ? `${p.region} · ${p.coverage} coverage`
        : 'Consent, photo & preferences',
      icon: '🧴',
      action: onEdit,
    },
    {
      label: 'My Wardrobe',
      hint: `${store.wardrobe.length} item${store.wardrobe.length === 1 ? '' : 's'}`,
      icon: '👗',
      action: () => notify('Open the AI Stylist to manage your wardrobe 👗'),
    },
    {
      label: 'Saved Looks',
      hint: `${store.looks.length} saved`,
      icon: '💖',
      action: () => notify(`${store.looks.length} looks saved`),
    },
    {
      label: 'Reminders',
      hint: 'Morning 8:00 · Night 10:00',
      icon: '⏰',
      action: () => notify('Reminders set for your routine ⏰'),
    },
    {
      label: 'Privacy & Data',
      hint: p?.facePhoto ? 'Photo stored privately · delete anytime' : 'No photo stored',
      icon: '🔒',
      action: onEdit,
    },
  ]

  return (
    <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
      <h1 className="text-2xl font-bold">Profile</h1>

      <section
        className="flex items-center gap-4 rounded-[2rem] p-5 text-white shadow-lg shadow-primary/25"
        style={{ background: 'linear-gradient(135deg, #f9a8c8, #f472a0)' }}
      >
        <div className="grid h-16 w-16 overflow-hidden rounded-full bg-white/85 text-3xl">
          {p?.facePhoto ? (
            <img src={p.facePhoto} alt="You" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center">👧</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-display text-xl font-bold">{p?.name ?? 'Guest'}</p>
          <p className="text-sm text-white/85">
            {p ? 'Your style, your glow ✨' : 'Set up to personalize'}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="rounded-full bg-white/25 px-3 py-1.5 text-sm font-bold"
        >
          Edit
        </button>
      </section>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['12', 'Day streak'],
          ['85', 'Skin score'],
          [String(store.looks.length), 'Saved looks'],
        ].map(([n, l]) => (
          <div key={l} className="rounded-3xl bg-secondary p-4 text-center">
            <p className="font-display text-2xl font-bold text-primary">{n}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2.5">
        {rows.map((r) => (
          <button
            key={r.label}
            onClick={r.action}
            className="flex w-full items-center gap-3 rounded-3xl bg-card p-4 text-left shadow-sm ring-1 ring-border/50 transition-transform active:scale-[0.99]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-lg">
              {r.icon}
            </span>
            <div className="flex-1">
              <p className="font-display font-bold leading-tight">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.hint}</p>
            </div>
            <ChevronRight width={18} className="text-muted-foreground" />
          </button>
        ))}
      </section>
    </div>
  )
}
