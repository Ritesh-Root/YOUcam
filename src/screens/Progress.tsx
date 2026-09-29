import { useState } from 'react'
import { ArrowDown, CalendarIcon, FlameIcon, HeartIcon } from '../components/icons'
import { useApp } from '../components/app-context'

const ranges = {
  Week: [72, 68, 74, 71, 78, 82, 85],
  Month: [64, 70, 66, 73, 69, 77, 81],
  Year: [55, 60, 58, 66, 70, 74, 82],
} as const
const labels = {
  Week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  Month: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
  Year: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'],
} as const

function ScoreChart({ data, days }: { data: readonly number[]; days: readonly string[] }) {
  const w = 300
  const h = 90
  const min = Math.min(...data) - 6
  const max = Math.max(...data) + 6
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f472a0" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f472a0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#fill)" />
        <path d={line} fill="none" stroke="#f472a0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === pts.length - 1 ? 5 : 3}
            fill={i === pts.length - 1 ? '#f472a0' : '#fff'}
            stroke="#f472a0"
            strokeWidth="2.5"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted-foreground">
        {days.map((d, i) => (
          <span
            key={d}
            className={
              i === days.length - 1
                ? 'rounded-full bg-primary px-2 py-0.5 text-white'
                : ''
            }
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}

function Concern({
  name,
  delta,
  face,
}: {
  name: string
  delta: string
  face: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-sm ring-1 ring-border/50">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-lg">
        {face}
      </span>
      <div className="flex-1">
        <p className="font-display font-bold leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground">Improving</p>
      </div>
      <span className="flex items-center gap-1 rounded-full bg-[#e6f7ee] px-2.5 py-1 text-sm font-bold text-success">
        <ArrowDown width={14} />
        {delta}
      </span>
    </div>
  )
}

export function Progress() {
  const { notify } = useApp()
  const [range, setRange] = useState<keyof typeof ranges>('Week')
  const data = ranges[range]

  return (
    <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let’s see your glow up! ✨
          </p>
        </div>
        <button
          onClick={() => notify('Calendar view coming soon 📅')}
          className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-secondary"
          aria-label="Calendar"
        >
          <CalendarIcon />
        </button>
      </header>

      {/* Range segmented */}
      <div className="flex gap-1 rounded-full bg-secondary p-1">
        {(Object.keys(ranges) as (keyof typeof ranges)[]).map((r) => {
          const active = range === r
          return (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 rounded-full py-2.5 font-display text-sm font-bold transition-colors ${
                active ? 'bg-primary text-white shadow-sm' : 'text-secondary-foreground/70'
              }`}
            >
              {r}
            </button>
          )
        })}
      </div>

      {/* Skin score */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Skin Score</h2>
        <div className="rounded-[2rem] bg-secondary p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-end gap-3">
              <span className="font-display text-5xl font-bold text-primary">
                {data[data.length - 1]}
              </span>
              <div className="pb-1">
                <p className="font-display font-bold text-secondary-foreground">
                  Great!
                </p>
                <p className="text-xs text-muted-foreground">
                  Your skin is happy and healthy 💗
                </p>
              </div>
            </div>
            <span className="text-3xl" aria-hidden>🎀</span>
          </div>
          <ScoreChart data={data} days={labels[range]} />
        </div>
      </section>

      {/* Concerns */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Skin Concerns</h2>
          <button
            onClick={() => notify('Edit your skin concerns ✏️')}
            className="text-sm font-semibold text-primary"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2.5">
          <Concern name="Acne" delta="40%" face="😊" />
          <Concern name="Dark Spots" delta="20%" face="🙂" />
          <Concern name="Redness" delta="15%" face="😌" />
        </div>
      </section>

      {/* Streak */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Streak</h2>
        <div
          className="flex items-center gap-4 rounded-[2rem] p-5 text-white shadow-lg shadow-primary/25"
          style={{ background: 'linear-gradient(135deg, #f9a8c8, #f472a0)' }}
        >
          <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-white/25 text-[#ff7a3d]">
            <FlameIcon width={30} />
          </span>
          <div className="flex-1">
            <p>
              <span className="font-display text-3xl font-bold">12</span>{' '}
              <span className="font-semibold">days in a row!</span>
            </p>
            <p className="text-sm text-white/85">You’re doing amazing 🔥</p>
          </div>
          <HeartIcon width={26} className="text-white/70" />
        </div>
      </section>
    </div>
  )
}
