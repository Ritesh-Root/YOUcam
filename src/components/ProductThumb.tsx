// Lightweight, dependency-free product bottle illustration so the routine list
// stays cohesive without relying on external product photography.
export function ProductThumb({ tint = '#dbeafe' }: { tint?: string }) {
  return (
    <div className="grid h-14 w-12 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-border/70">
      <svg width="26" height="40" viewBox="0 0 26 40" aria-hidden>
        <rect x="9" y="1" width="8" height="5" rx="1.5" fill={tint} />
        <rect
          x="4"
          y="6"
          width="18"
          height="32"
          rx="5"
          fill={tint}
          opacity="0.55"
        />
        <rect x="4" y="20" width="18" height="18" rx="5" fill={tint} />
        <rect x="7.5" y="24" width="11" height="3" rx="1.5" fill="#fff" opacity="0.85" />
      </svg>
    </div>
  )
}
