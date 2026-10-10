import { useEffect, useState } from 'react'
import { BottleIcon, ChevronRight, DressIcon, HeartIcon, LockIcon, ProfileIcon } from '../components/icons'
import { useApp } from '../components/app-context'
import { currentStreak, useStore } from '../store'
import { cityById } from '../trends/data'
import { getBalance } from '../youcam'
import type { StylistView } from '../stylist/routes'

export function Profile({ onEdit, onOpen }: { onEdit: () => void; onOpen: (v: StylistView) => void }) {
  const { notify } = useApp()
  const store = useStore()
  const p = store.profile
  const [confirmReset, setConfirmReset] = useState(false)
  const [balance, setBalance] = useState<number>()

  useEffect(() => {
    getBalance().then(setBalance).catch(() => undefined)
  }, [])

  const rows = [
    { label: p ? 'Profile and preferences' : 'Set up your profile', hint: p ? `${cityById(p.cityId)?.name ?? ''} · ${p.coverage} coverage` : 'City, colours, exclusions', icon: BottleIcon, action: onEdit },
    { label: 'My Palette', hint: p?.undertone ? `${p.undertone}${p.undertoneSource === 'measured' ? ' (measured)' : ''}` : 'Not set', icon: HeartIcon, action: () => onOpen('palette') },
    { label: 'My Wardrobe', hint: `${store.wardrobe.length} item${store.wardrobe.length === 1 ? '' : 's'}`, icon: DressIcon, action: () => onOpen('wardrobe') },
    { label: 'Saved looks', hint: `${store.looks.length} saved`, icon: HeartIcon, action: () => onOpen('looks') },
  ]

  return (
    <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
      <h1 className="text-2xl font-bold">Profile</h1>

      <section className="flex items-center gap-4 rounded-[2rem] p-5 text-white shadow-lg shadow-primary/25" style={{ background: 'linear-gradient(135deg, #f9a8c8, #f472a0)' }}>
        <div className="grid h-16 w-16 overflow-hidden rounded-full bg-white/85">
          {p?.facePhoto ? (
            <img src={p.facePhoto} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-primary"><ProfileIcon width={32} height={32} /></span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-display text-xl font-bold">{p?.name || 'Guest'}</p>
          <p className="text-sm text-white/85">{p ? `📍 ${cityById(p.cityId)?.name}` : 'Set up to personalise'}</p>
        </div>
        <button onClick={onEdit} className="rounded-full bg-white/25 px-3 py-1.5 text-sm font-bold">Edit</button>
      </section>

      <div className="grid grid-cols-3 gap-3">
        {[
          [String(store.scans.length), 'Skin scans'],
          [String(store.looks.length), 'Saved looks'],
          [String(currentStreak(store.checkins)), 'Day streak'],
        ].map(([n, l]) => (
          <div key={l} className="rounded-3xl bg-secondary p-4 text-center">
            <p className="font-display text-2xl font-bold text-primary tabular-nums">{n}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2.5">
        {rows.map((r) => {
          const Icon = r.icon
          return (
            <button key={r.label} onClick={r.action} className="flex w-full items-center gap-3 rounded-3xl bg-card p-4 text-left shadow-sm ring-1 ring-border/50">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary"><Icon width={22} height={22} /></span>
              <div className="flex-1">
                <p className="font-display font-bold leading-tight">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.hint}</p>
              </div>
              <ChevronRight width={18} className="text-muted-foreground" />
            </button>
          )
        })}
      </section>

      <section className="space-y-3 rounded-3xl bg-card p-4 ring-1 ring-border/50">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary"><LockIcon width={22} height={22} /></span>
          <div>
            <p className="font-display font-bold leading-tight">Privacy and data</p>
            <p className="text-xs text-muted-foreground">Everything is stored on this device. Photos sent to YouCam are kept there for 30 days.</p>
          </div>
        </div>
        {balance !== undefined && <p className="text-xs text-muted-foreground">YouCam account balance: {balance.toFixed(0)} units</p>}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              store.clearPhotos()
              notify('Profile photos deleted')
            }}
            disabled={!p?.facePhoto && !p?.bodyPhoto}
            className="rounded-full border border-border py-2.5 text-sm font-bold disabled:opacity-40"
          >
            Delete photos
          </button>
          <button onClick={() => setConfirmReset(true)} className="rounded-full border border-[#b3261e]/40 py-2.5 text-sm font-bold text-[#b3261e]">
            Delete all data
          </button>
        </div>
        {confirmReset && (
          <div role="alertdialog" aria-label="Confirm deletion" className="rounded-2xl bg-[#fde7e5] p-3 text-sm text-[#8c1d18]">
            <p>Delete your profile, photos, looks, scans, routine and events from this device? This cannot be undone.</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmReset(false)} className="rounded-full bg-white py-2 font-bold">Keep</button>
              <button
                onClick={() => {
                  store.resetAll()
                  setConfirmReset(false)
                  notify('All data deleted')
                }}
                className="rounded-full bg-[#b3261e] py-2 font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
