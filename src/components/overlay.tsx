import { useEffect, type ReactNode } from 'react'
import { BackIcon } from './icons'

/* Full-screen overlay panel used by every AI Stylist feature screen. */
export function Screen({
  title,
  subtitle,
  onClose,
  action,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pb-3 pt-5">
        <button
          onClick={onClose}
          aria-label="Back"
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-primary hover:bg-secondary"
        >
          <BackIcon />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold leading-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      <div className="scroll-area flex-1 overflow-y-auto px-5 pb-8">{children}</div>
    </div>
  )
}

/* Bottom sheet for the AI Stylist menu. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-label={title}
        className="relative animate-sheet rounded-t-[2rem] bg-card px-5 pb-8 pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <h2 className="mb-4 text-center font-display text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  )
}

/* Small honest banner for provider-dependent features. */
export function SetupBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-2xl border border-accent/50 bg-[#fff6e0] p-3 text-sm text-accent-foreground">
      <span aria-hidden className="mt-0.5">⚙️</span>
      <p>{children}</p>
    </div>
  )
}

export function DemoTag() {
  return (
    <span className="rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      Demo preview
    </span>
  )
}

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
        selected
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-card text-secondary-foreground'
      }`}
    >
      {label}
    </button>
  )
}
