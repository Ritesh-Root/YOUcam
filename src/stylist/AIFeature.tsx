import { useState } from 'react'
import { DemoTag, Screen, SetupBanner } from '../components/overlay'
import { getFeature } from './features'
import { useStore } from '../store'

/*
 * Generic screen for a provider-backed AI capability (YouCam / MakeupAR AI API).
 * Live results require backend credentials, which this in-browser build does not
 * have. We therefore keep this honest: an explicit "requires setup" banner, and a
 * clearly-labeled demo preview. We never present a simulated result as a live one.
 */
export function AIFeature({
  featureId,
  onClose,
}: {
  featureId: string
  onClose: () => void
}) {
  const store = useStore()
  const feature = getFeature(featureId)
  const [showDemo, setShowDemo] = useState(false)

  if (!feature) {
    return (
      <Screen title="Feature" onClose={onClose}>
        <p className="text-sm text-muted-foreground">This feature is unavailable.</p>
      </Screen>
    )
  }

  const verb =
    feature.kind === 'analysis'
      ? 'Analyze'
      : feature.kind === 'tryon'
        ? 'Try it on'
        : 'Generate'
  const hasPhoto = Boolean(store.profile?.facePhoto)

  return (
    <Screen title={feature.name} subtitle={feature.category} onClose={onClose}>
      <div className="space-y-4">
        <SetupBanner>
          This feature is powered by the YouCam / MakeupAR AI API. Live results
          require a provider API key kept on a backend — it isn’t connected in this
          preview, so this screen shows a labeled demo only.
        </SetupBanner>

        <div className="flex items-start gap-3 rounded-3xl bg-secondary p-4">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-card text-2xl shadow-sm">
            {feature.emoji}
          </span>
          <p className="text-sm text-secondary-foreground">{feature.blurb}</p>
        </div>

        {/* Source photo */}
        <div>
          <p className="mb-2 text-sm font-bold">Your photo</p>
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3">
            <div className="grid h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-secondary">
              {hasPhoto ? (
                <img
                  src={store.profile!.facePhoto}
                  alt="You"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-2xl">📷</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasPhoto
                ? 'Using the photo from your profile. Photos stay private in your browser.'
                : 'Add a photo in your profile to personalize this feature.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDemo(true)}
          className="w-full rounded-full bg-primary py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
        >
          {verb} — see demo
        </button>

        {showDemo && (
          <div className="space-y-3 rounded-3xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold">Preview</p>
              <DemoTag />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Before', 'After'].map((label, i) => (
                <div key={label} className="space-y-1.5">
                  <div
                    className="grid aspect-[3/4] place-items-center overflow-hidden rounded-2xl"
                    style={{
                      background:
                        i === 0
                          ? 'linear-gradient(135deg,#f3e9ef,#e9dfe8)'
                          : 'linear-gradient(135deg,#ffe3f0,#f9a8c8)',
                    }}
                  >
                    <span className="text-3xl">{i === 0 ? '🙂' : feature.emoji}</span>
                  </div>
                  <p className="text-center text-[11px] font-semibold text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Illustrative demo only — not a real analysis or generated result.
              Connect the AI API on a backend to enable live {feature.name}.
            </p>
          </div>
        )}
      </div>
    </Screen>
  )
}
