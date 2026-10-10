# HIGHLIGHT plan (revised 2026-10-10)

This replaces the scope in `src/imports/HIGHLIGHT_BUILD_SPEC.md` for the YouCam API Skin AI & eCommerce VTO Hackathon (submissions close **Nov 2, 2026**). The old spec planned FastAPI, Celery, Redis and Postgres over five weeks. We have three weeks and a working Vite app, so this plan keeps the app and adds one Cloudflare Worker.

## Pitch

**Dress for where you're going.** Pick an event and the city it's in. HIGHLIGHT shows the outfit, makeup look and hairstyle trending in that city for that occasion right now, cites where each trend comes from, checks it against the weather and your colours, and puts the whole look on your own photo with YouCam.

Why this angle:
- YouCam has no location or cultural-dress API. The trend layer is ours, which makes it a non-obvious use of the API (a judging criterion).
- The last YouCam hackathon had 238 entries. Dozens were the same "selfie → colour season → outfit → try-on" stylist, and none of those placed. The winners solved one specific problem honestly (blind shoppers, colours that vanish on darker skin, trustworthy try-on, Shopify plugin with honest labels). No visible entry did city-level trends.
- Styles differ by city and spread between cities with time lags (GeoStyle, ICCV 2019; "From Paris to Berlin", CVPR 2020: 7.7M photos, 44 cities). App reviews keep asking for suggestions that fit the person, not generic ones.

## Product decisions

1. **The location is where the event is**, not only where you live. The default is your current city (coarse). You can set the event city: a Mumbai user going to a Jaipur wedding gets Jaipur trends.
2. **Trend is one input, not the boss.** Hard filters run first (exclusions, coverage). Then: local trend for this occasion (0 to 0.5, set by a "Classic ↔ On-trend" dial), occasion fit 0.25, palette match 0.20, weather fit 0.15, your likes 0.10. Missing factors are dropped and the rest renormalised.
3. **Every trend shows its evidence**: source, date and a link (e.g. "YouTube Howto & Style IN, 3 Oct · r/IndianFashionAddicts, 6 Oct"). If a city has too little data, fall back to the country and say so on screen.
4. **Location never implies identity.** Never infer religion, ethnicity or modesty from a place. Coverage and exclusions are the user's choices.
5. **No fake numbers.** Anything that isn't measured or collected is removed or labelled "Sample".

## Cut, keep, add

| Cut | Keep (fix) | Add |
|---|---|---|
| The 49 dead "Setup" tiles (now replaced: all 54 features call the API) | Consent flow | City and event-city picker, optional geolocation → city |
| Hard-coded skin score, streak, "Acne ↓40%", "Looking good!" | Clothes VTO (cloth templates and cloth-v4) | Trend snapshot + live YouTube signals (`/api/trends/live`) |
| Hard-coded routine (pairs retinol with 2% BHA) and fake "Add product" / "Reminders" toasts | Occasion form | Makeup look matched to the trend (exact makeup-vto effects) |
| Cultural Styles browser (merge into Discover) | Event skin prep (fix bugs, keep it conservative) | Palette from skin-tone-analysis (still editable) |
| Wardrobe (stretch only) | Explanation chips on cards | Weather for the event date (Open-Meteo) |
| Myntra product photos copied into `public/` (licensing risk) | | YouCam cloth templates and licensed images; shop links that search a local store instead of linking fixed product pages that go dead |

## Architecture

- **Frontend:** this Vite React SPA, deployed as static assets on Cloudflare.
- **One Cloudflare Worker** (`worker/index.ts`, sharing `server/api.ts` with the dev server):
  - `/api/youcam/*`: an allowlisted proxy for the endpoints the 54 features use. Same-origin only, with per-IP rate limits and per-request spending caps (video ≤ 10 s, ≤ 4 outputs, 64 KB bodies). The key lives only in a Worker secret.
  - `/api/upload`: relays file uploads to YouCam's S3 hosts only (JPEG, PNG, MP4, MOV, ≤ 60 MB).
  - `/api/trends/live`: the month's most-viewed matching YouTube videos for a country (needs `YOUTUBE_API_KEY`).
  - Weather comes from Open-Meteo, called from the browser (free, no key).
- **Trends today:** a hand-collected snapshot in `src/trends/data.ts` (8 cities, 30 trends, dated sources). Each city uses its country's trends plus its own forecast, and the app says so.
- **Not built yet (stretch):** a scheduled collector (YouTube, Reddit, Pinterest Trends) writing city-level trends to KV, and a global daily unit cap. Rate limits are kept in Worker memory, so they reset when an isolate restarts; before a wide public launch, move them to Cloudflare's rate-limiting binding or a Durable Object.
- Do **not** use the raw Google daily-trends feed. On 10 Oct 2026 it was almost all sports and news in all 15 countries tested.

## Milestones

| Dates | Milestone | Status (2026-10-10) |
|---|---|---|
| Oct 10–12 | **M0 Honesty and bug fixes** | **Done.** All 16 review issues fixed (list below). `tsc` and `vite build` pass. |
| Oct 13–17 | **M1 Public deploy** | **Built, not deployed.** The Worker and allowlisted proxy are tested locally under `wrangler dev`. Run `wrangler deploy` with your account. City picker, geolocation → nearest city, and Open-Meteo weather are done. |
| Oct 15–22 | **M2 Trend Radar** | **Snapshot done** for 8 cities and 30 trends with dated sources. Live YouTube signals are ready behind `YOUTUBE_API_KEY`. **Left:** a Reddit collector and a scheduled refresh. |
| Oct 20–26 | **M3 Full look** | **Done:** palette from skin-tone-analysis, trend makeup through makeup-vto, trend outfits through YouCam cloth templates, own-garment try-on, event-city flow. **Left:** a side-by-side "Compare cities" view (today you switch the city on one screen). |
| Oct 27–Nov 1 | **M4 Proof and submission** | **Left:** test with at least 5 real people in at least 2 cities, an accessibility pass, the 3-minute video and the Devpost write-up. |

All 54 AI features were run against the live API on 2026-10-10 with YouCam doc samples, generated product shots and short test clips. 163 units were used and 837 remain. Five features reached YouCam but returned "use a different photo" because no suitable sample exists: earrings (earlobes must show), necklace (neck centred), hair type and hair frizz (left and right head turns), and hair density (crown at 45°). Each surfaces YouCam's explanation in the app.

## M0 fixes (from the 2026-10-10 review), all done

1. Invented skin score, streak and concern deltas were removed. Progress, Home and Profile show only real scans and check-ins.
2. The hard-coded routine was replaced by your own products, warnings for clashing actives (retinoid with acid, benzoyl peroxide) and a check-in that drives the streak.
3. "Use my location" now picks the nearest supported city on the device. Coordinates are never stored.
4. Profile has a name field (no more "Millie"), and the greeting follows the time of day.
5. State moved from localStorage to IndexedDB. Photos are resized before they are stored.
6. `daysUntil` parses local dates, so countdowns are right in every time zone.
7. Skin Prep ranges are fixed ("Days 3–-3" is gone), and past dates are blocked.
8. Events are upserted, so pressing a button twice no longer duplicates them. A date is required.
9. Try On from a trend card opens with that template preselected. Every outfit trend is try-on-able through a template or your own photo.
10. Ranking applies hard filters first (coverage, exclusions, audience), and excluded looks show the reason.
11. Consent text is accurate. Storing on the device and sending photos to YouCam are separate consents.
12. The proxy has an allowlist, same-origin check, rate limits, unit-spending caps and an upload host/type/size check, and the server listens on localhost.
13. The site title and description are fixed. The README describes the real app.
14. The copied Myntra product photos were removed. Outfits use YouCam's licensed templates or your own photo.
15. The 49 "Setup" tiles are replaced by 54 working features, each showing its live price.
16. One Cloudflare Worker replaces the FastAPI/Celery plan.

## 3-minute demo

1. **0:00–0:20** Problem: the same app gives the same advice in Mumbai and London, and trends move city to city.
2. **0:20–0:40** "Friend's sangeet, Mumbai, Nov 22": event, city, weather.
3. **0:40–1:10** Trending in Mumbai for sangeets, with source chips, a weather note and the palette match.
4. **1:10–1:50** One tap: the outfit on my body (cloth-v4) and the trending makeup on my face (makeup-vto).
5. **1:50–2:20** Switch the event to Lagos, then Dubai: everything changes, with sources.
6. **2:20–2:45** Honesty and privacy: evidence, fallbacks, city-level location only, delete my data.
7. **2:45–3:00** Architecture, the YouCam APIs used, and the impact for shoppers and for brands planning city-level stock.

## Risks

- **Thin data for a city:** fall back to the country and label it.
- **Keys:** get a YouTube Data API key and a Reddit app today. Pinterest Trends needs approval, so treat it as optional.
- **Terms of service:** prefer official APIs. For retailers, link to a search instead of scraping product pages.
- **"Trends make everyone look the same":** the trend dial and personal-fit hard filters handle this. Present trends as options, not instructions.
- **Try-on accuracy on darker skin and draped garments:** test early and show results honestly. Never claim fit or size.
