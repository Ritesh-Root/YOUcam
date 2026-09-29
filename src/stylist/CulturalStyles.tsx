import { useMemo, useState } from 'react'
import { Chip, Screen } from '../components/overlay'
import { REGIONS, catalog, rankGarments, useStore } from '../store'
import { GarmentCard } from './GarmentCard'
import type { StylistView } from './routes'

export function CulturalStyles({
  onClose,
  onNavigate,
}: {
  onClose: () => void
  onNavigate: (v: StylistView) => void
}) {
  const store = useStore()
  const [region, setRegion] = useState(store.profile?.region ?? 'India')

  const ranked = useMemo(() => {
    const items = catalog.filter((g) => g.region === region)
    return rankGarments(items, store.profile).filter(
      (r) => !store.dislikes.includes(r.garment.id),
    )
  }, [region, store.profile, store.dislikes])

  return (
    <Screen title="Cultural Styles" subtitle="Explore garments by region" onClose={onClose}>
      <p className="mb-1 text-xs text-muted-foreground">
        Explore any region — location never implies ethnicity or religion.
      </p>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scroll-area">
        {REGIONS.map((r) => (
          <div key={r} className="flex-shrink-0">
            <Chip label={r} selected={region === r} onClick={() => setRegion(r)} />
          </div>
        ))}
      </div>

      {ranked.length === 0 ? (
        <Empty region={region} />
      ) : (
        <div className="space-y-4">
          {ranked.map((r) => (
            <GarmentCard
              key={r.garment.id}
              ranked={r}
              onTryOn={() => onNavigate('tryon')}
              onPlanPrep={() => onNavigate('skinprep')}
            />
          ))}
        </div>
      )}
    </Screen>
  )
}

function Empty({ region }: { region: string }) {
  return (
    <div className="mt-10 rounded-3xl bg-secondary p-8 text-center">
      <p className="text-4xl">🧵</p>
      <p className="mt-2 font-display font-bold text-secondary-foreground">
        Catalog growing for {region}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        We start India-first and add reviewed garments for more regions over time.
      </p>
    </div>
  )
}
