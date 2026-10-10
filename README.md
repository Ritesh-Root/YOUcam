# HIGHLIGHT

**Dress for where you're going.** Pick an event and the city it's in. HIGHLIGHT shows the outfits and makeup trending there for that occasion, cites a dated source for every trend, checks the look against the event-day forecast and your colours, and puts it on your own photo with the YouCam API.

Built for the YouCam API Skin AI & eCommerce VTO Hackathon (closes Nov 2, 2026).

## What it does

- **Dress for an Occasion:** occasion, event city, date and role, then ranked looks. Hard filters run first (minimum coverage, words you excluded, womenswear/menswear). Then the score blends local trend strength (adjustable with a Classic ↔ On-trend dial), occasion fit, palette match (ΔE in Lab), the Open-Meteo forecast and your likes.
- **Trending near you:** the same data, browsed by city (Mumbai, Delhi, Bengaluru, Lagos, Dubai, London, New York, Seoul). Every card lists its sources with dates, and looks hidden by your settings show the reason.
- **Try it on:** trend outfits map to licensed YouCam cloth templates (`/task/cloth`). Trend makeup maps to exact `makeup-vto` effects. Anything without a template can be tried with your own garment photo (`/task/cloth-v4`).
- **All 54 YouCam AI features** in the AI Stylist menu call the real API: skin, face and body analysis and edits; makeup, nail and lens try-on; clothes, fabric, bag, scarf, shoes and hat; ring, bracelet, earring, watch and necklace; hair colour, style, bangs, volume, curls and detection; image tools; and video tools. Each feature shows YouCam's live unit price and your balance before it runs.
- **Skin:** skin scans are saved and charted in Progress. The routine is your own products, with warnings for clashing actives and a streak counted from real check-ins. Skin Prep builds a conservative plan counted back from the event date.

## Setup

```bash
cp .env.example .env.local     # add YOUCAM_API_KEY (and optionally YOUTUBE_API_KEY)
pnpm install                   # or npm install
pnpm dev                       # http://127.0.0.1:8443
```

Keys stay on the server and are never prefixed with `VITE_`. The dev server listens on localhost; set `HOST=0.0.0.0` to open it from a phone on your network.

## Deploy (Cloudflare Workers)

```bash
pnpm build
npx wrangler secret put YOUCAM_API_KEY
npx wrangler secret put YOUTUBE_API_KEY   # optional: live creator signals on trend pages
npx wrangler deploy
```

`worker/index.ts` serves `dist/` and runs the same `/api` handler as the dev server (`server/api.ts`).

## How keys and photos are protected

`server/api.ts` is the only code that touches provider keys.

- **YouCam proxy:** `/api/youcam/*` forwards only the endpoints the app uses. Unlisted paths return `403 PathNotAllowed`.
- **Same-origin only:** cross-site requests are refused.
- **Spending limits:** JSON bodies are capped at 64 KB. Video tasks are limited to 10 seconds and multi-image outputs to 4. Each device can make 200 requests per 5 minutes and 60 AI tasks per hour.
- **Upload relay:** `/api/upload` PUTs only to YouCam's S3 upload hosts, only JPEG, PNG, MP4 or MOV, and at most 60 MB.
- **Data on the device:** profile, photos, looks and scans live in IndexedDB in the browser. A photo leaves the device only when you run a feature, after a consent checkbox. YouCam keeps uploads for 30 days. Location is turned into the nearest supported city on the device; coordinates are never stored or sent.

## Trend data

`src/trends/data.ts` is a hand-collected snapshot (10 Oct 2026). Each trend has dated public sources and a YouCam template ID or makeup effects that were tested against the live API. City-level data isn't available yet, so a city uses its country's snapshot plus its own forecast, and the app says so. With `YOUTUBE_API_KEY` set, trend pages also list the month's most-viewed matching YouTube videos for that country. To refresh, update the file and `SNAPSHOT_DATE`.

## Project layout

```
server/api.ts           /api handler: YouCam proxy, upload relay, live trends, health
worker/index.ts         Cloudflare Worker entry
src/youcam.ts           browser client: upload, run task, poll, templates, prices, balance
src/stylist/features.ts the 54 AI features: endpoint, inputs, settings, request body
src/stylist/AIFeature.tsx generic runner for any feature
src/trends/             trend snapshot, ranking engine, weather, look cards
src/store.tsx           app state persisted to IndexedDB
```

See `PLAN.md` for the roadmap and the demo script.
