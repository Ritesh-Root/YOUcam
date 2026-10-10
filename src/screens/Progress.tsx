import { useState } from 'react'
import { FlameIcon } from '../components/icons'
import { currentStreak, formatDate, useStore, type SkinScan } from '../store'

const RANGES = { Week: 7, Month: 31, All: Infinity } as const
type Range = keyof typeof RANGES

const nice = (s: string) => s.replace(/^hd_/, '').replace(/_v2$/, '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

function scoreOf(scan: SkinScan): number {
  if (scan.overall !== undefined) return scan.overall
  if (!scan.concerns.length) return 0
  return scan.concerns.reduce((s, c) => s + c.score, 0) / scan.concerns.length
}

function ScoreChart({ scans }: { scans: SkinScan[] }) {
  const w = 300
  const h = 100
  const pad = 8
  const values = scans.map(scoreOf)
  const min = Math.max(0, Math.min(...values) - 5)
  const max = Math.min(100, Math.max(...values) + 5)
  const pts = values.map((v, i) => {
    const x = scans.length === 1 ? w / 2 : pad + (i / (scans.length - 1)) * (w - pad * 2)
    const y = pad + (h - pad * 2) * (1 - (v - min) / Math.max(1, max - min))
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`Skin score from ${Math.round(values[0])} to ${Math.round(values.at(-1)!)}`}>
        {pts.length > 1 && <path d={line} fill="none" stroke="#f472a0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? '#f472a0' : '#fff'} stroke="#f472a0" strokeWidth="2.5" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] font-semibold text-muted-foreground">
        <span>{formatDate(scans[0].date.slice(0, 10))}</span>
        {scans.length > 1 && <span>{formatDate(scans.at(-1)!.date.slice(0, 10))}</span>}
      </div>
    </div>
  )
}

export function Progress({ onScan }: { onScan: () => void }) {
  const store = useStore()
  const [range, setRange] = useState<Range>('Month')
  const cutoff = Date.now() - RANGES[range] * 86400000
  const scans = store.scans.filter((s) => Date.parse(s.date) >= cutoff)
  const latest = store.scans.at(-1)
  const previous = store.scans.at(-2)
  const streak = currentStreak(store.checkins)

  return (
    <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
      <header>
        <h1 className="text-2xl font-bold">My Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">From your YouCam skin scans and routine check-ins.</p>
      </header>

      {store.scans.length === 0 ? (
        <section className="rounded-[2rem] bg-secondary p-6 text-center">
          <p className="text-4xl" aria-hidden>🔬</p>
          <p className="mt-2 font-display font-bold text-secondary-foreground">No skin scans yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Run a YouCam skin scan to start tracking. Scan in the same light each time so results compare.</p>
          <button onClick={onScan} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">Scan my skin</button>
        </section>
      ) : (
        <>
          <div className="flex gap-1 rounded-full bg-secondary p-1">
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`flex-1 rounded-full py-2.5 font-display text-sm font-bold transition-colors ${range === r ? 'bg-primary text-white shadow-sm' : 'text-secondary-foreground/70'}`}
              >
                {r}
              </button>
            ))}
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">Skin score</h2>
            <div className="rounded-[2rem] bg-secondary p-5">
              <div className="mb-3 flex items-end gap-3">
                <span className="font-display text-5xl font-bold text-primary tabular-nums">{Math.round(scoreOf(latest!))}</span>
                <p className="pb-1 text-xs text-muted-foreground">
                  {latest!.overall !== undefined ? 'YouCam overall score' : 'Average of scored concerns'} · {formatDate(latest!.date.slice(0, 10))}
                </p>
              </div>
              {scans.length > 0 ? <ScoreChart scans={scans} /> : <p className="text-sm text-muted-foreground">No scans in this period.</p>}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Concerns</h2>
              <button onClick={onScan} className="text-sm font-semibold text-primary">Scan again</button>
            </div>
            <ul className="space-y-2.5">
              {latest!.concerns.map((c) => {
                const before = previous?.concerns.find((p) => p.type === c.type)?.score
                const delta = before !== undefined ? c.score - before : undefined
                return (
                  <li key={c.type} className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-sm ring-1 ring-border/50">
                    <div className="flex-1">
                      <p className="font-display font-bold leading-tight">{nice(c.type)}</p>
                      <p className="text-xs text-muted-foreground">Score {c.score} / 100 (higher is less visible)</p>
                    </div>
                    {delta !== undefined && (
                      <span className={`rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${delta >= 0 ? 'bg-[#e6f7ee] text-success' : 'bg-[#fde7e5] text-[#8c1d18]'}`}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            {!previous && <p className="text-xs text-muted-foreground">Changes appear after your second scan.</p>}
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Routine streak</h2>
        <div className="flex items-center gap-4 rounded-[2rem] p-5 text-white shadow-lg shadow-primary/25" style={{ background: 'linear-gradient(135deg, #f9a8c8, #f472a0)' }}>
          <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-white/25 text-[#ff7a3d]"><FlameIcon width={30} /></span>
          <p>
            <span className="font-display text-3xl font-bold tabular-nums">{streak}</span>{' '}
            <span className="font-semibold">day{streak === 1 ? '' : 's'} in a row</span>
            <span className="block text-sm text-white/85">{streak ? 'Counted from routine check-ins.' : 'Mark your routine done to start a streak.'}</span>
          </p>
        </div>
      </section>
    </div>
  )
}
