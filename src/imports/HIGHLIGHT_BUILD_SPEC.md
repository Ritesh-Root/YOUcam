# HIGHLIGHT — Build specification

This is the implementation handoff for the responsive web application described in your research dossier. Each named section below is intended to become the corresponding repository Markdown document as the application is implemented. This file defines contracts and work; it does not imply that application code or vendor integrations already exist.

Source basis: retrieved sections of 01_MASTER_PLAN_AND_HACKATHON_STRATEGY.md and 03_TECHNICAL_ARCHITECTURE_AND_APIS.md. The remaining attached research files require detailed review before importing their catalog or market claims. Implementation choices below are recommendations unless explicitly attributed to the dossier.

## README.md — Product and build entry point

HIGHLIGHT helps people choose culturally relevant outfits for an occasion, preview supported outfits on their photo, and plan conservative skincare preparation for the event.

Core journey: consent → selfie → appearance profile and suggested palette → cultural preferences → occasion → ranked outfits → virtual try-on → event preparation plan.

MVP: responsive web, guest sessions, India-first garment catalog, a small curated international selection, palette suggestions, occasion-aware recommendations, working YouCam integration, asynchronous processing, and a conservative skincare planner. No payments, marketplace, mandatory account signup, or native apps.

Stretch: wardrobe uploads, stylist chat/MCP, jewelry/scarf layering, calendar sync, weather, social cards, and simulation. None blocks the core submission.

Recommended repository layout:
```text
highlight/
  apps/web/                 React + TypeScript application
  apps/api/app/             FastAPI application
    routes/                HTTP contracts
    domain/                recommendation and routine rules
    providers/             YouCam adapter
    workers/               Celery tasks
    persistence/           models and repositories
  migrations/              versioned database migrations
  data/catalog/            licensed garment metadata
  data/rules/              reviewed cultural and skincare rules
  tests/                   contract, integration, end-to-end tests
  docs/                    sections defined in this specification
  compose.yaml
  .env.example
```
Expected local workflow to implement: copy environment example, start dependencies with Docker Compose, run migrations, seed catalog, then start web/API/worker. Do not document commands as working until the corresponding scripts exist.

## PRD.md — Requirements and acceptance

Primary scenario from the dossier: a user preparing for a friend's Indian wedding selects a ceremony, discovers suitable outfits, previews a look, and receives a preparation schedule.

| Capability | Acceptance condition |
|---|---|
| Guest onboarding | User completes consent without registering; another session cannot access their data |
| Photo intake | User can upload or use camera; rejected files receive actionable guidance |
| Appearance profile | Displays supported observations, photo-quality limitations, and editable palette preferences |
| Culture preferences | Region, garment preferences, modesty, and exclusions are explicitly chosen or confirmed |
| Occasion | Stores event date, ceremony, role, venue context, and user dress-code overrides |
| Recommendations | Returns eligible catalog items with traceable reasons; exclusion rules run before ranking |
| Try-on | Executes a real supported provider workflow; shows queued, running, failed, and successful states |
| Preparation plan | Respects days remaining and disclosed sensitivities; never promises medical results |
| Privacy | User can delete session assets and derived records |
| Demo | Entire core journey works at a public URL with sponsor credentials kept server-side |

One selfie begins onboarding; it is not a promise that a face-only image is sufficient for garment try-on. Request an additional suitably framed photograph when the selected provider operation requires it.

## ARCHITECTURE.md — System design

Recommended MVP: a modular monolith with a separately deployed asynchronous worker. Preserve the dossier's React, FastAPI, Celery, Redis, PostgreSQL, and private object storage components without splitting every domain into a microservice.

Browser → FastAPI → PostgreSQL/private storage. FastAPI records jobs and dispatches worker tasks through Redis. Workers call the provider through one adapter, persist normalized outcomes, and expose progress through the application's job endpoint.

Start with browser polling; SSE is a later optimization. PostgreSQL is the job source of truth. Redis is the queue and short-lived cache, not the sole record of user work. Vector search and pgvector are deferred until the curated catalog outgrows deterministic filtering.

Backend modules: sessions, consent, media, profiles, occasions, catalog, recommendations, try-on, routines, jobs, provider integration, and deletion. Routes validate requests; domain services enforce business rules; repositories own persistence; workers own long-running orchestration.

Only the backend can hold provider credentials. Private image URLs must not appear in analytics or logs. Presigned upload URLs are limited grants to storage, not access to provider credentials.

## DATA_MODEL.md — Persistence contracts

Use UUID identifiers, UTC audit timestamps, foreign keys, indexed ownership columns, and versioned migrations. Store event dates as local dates with an explicit timezone when scheduling requires one.

| Table | Important fields |
|---|---|
| sessions | id, token_hash, expires_at, deletion_requested_at |
| consents | id, session_id, purpose, policy_version, granted_at, revoked_at |
| media_assets | id, session_id, object_key, sha256, mime, bytes, width, height, purpose, status, expires_at |
| appearance_profiles | id, session_id, source_asset_id, observations_json, palette_id, confidence_json, method_version |
| preferences | session_id, regions_json, garments_json, exclusions_json, palette_overrides_json |
| occasions | id, session_id, local_date, timezone, ceremony, attendee_role, venue_context, dress_code_json |
| garments | id, name, region_tags, garment_type, occasion_tags, colors_json, coverage_tags, image_asset_key, license_json, active |
| cultural_rules | id, version, scope_json, predicate_json, action, explanation, source_note, reviewed_at |
| jobs | id, session_id, kind, state, input_json, provider_task_id, dedupe_key, attempt_count, error_code, next_poll_at, expires_at |
| recommendations | id, session_id, occasion_id, profile_id, rule_version, ranked_items_json |
| tryons | id, session_id, person_asset_id, garment_id, job_id, result_asset_id, provider_operation |
| routine_plans | id, session_id, occasion_id, input_snapshot_json, rules_version, plan_json, safety_notes_json |
| credit_ledger | id, job_id, provider_operation, estimated_units, confirmed_units, accounting_status |

A dedupe key is unique within session and job kind. Query every private record through an ownership check. No global cross-user photo-result cache. Reject unsupported JSON schema versions rather than silently interpreting incompatible data.

## API_CONTRACTS.md — Application API

These are proposed HIGHLIGHT endpoints, not confirmed YouCam URLs. Prefix all routes with /api/v1. Use a secure HttpOnly guest-session cookie, same-origin deployment where possible, and Origin/CSRF protection on mutations.

| Method and route | Request → response |
|---|---|
| POST /sessions | {} → session expiry and current consent version |
| POST /consents | purpose, policy_version, granted → consent receipt |
| POST /media/upload-intents | filename, mime, bytes, purpose → asset_id, upload_url, expires_at |
| POST /media/{id}/complete | {} → validation state; server verifies object before accepting |
| POST /analyses | asset_id, requested_capabilities → 202 job_id |
| GET /jobs/{id} | → state, phase, result reference or safe error |
| GET /profiles/current | → normalized observations, suggested palette, uncertainty |
| PATCH /preferences | explicit preference fields → saved preferences |
| POST /occasions | date, ceremony, role, venue, dress code → occasion |
| GET /catalog | validated filters and cursor → items, next_cursor |
| POST /recommendations | occasion_id, profile_id → eligible ranked items and explanations |
| POST /tryons | person_asset_id, garment_id → 202 job_id |
| POST /routine-plans | occasion_id, safety questionnaire → plan or request for missing inputs |
| DELETE /session-data | {} → 202 deletion_job_id |

Error envelope: error.code, error.message, error.retryable, request_id. Use 400 for malformed input, 401 for missing session, 404 for absent or inaccessible resources, 409 for state conflict, 422 for failed validation, 429 for limits, and 503 for temporarily unavailable capabilities.

Paid operations require an Idempotency-Key header. Repeated key plus identical body returns the original job. Repeated key plus changed body returns 409. Never expose raw upstream error payloads to users.

## PROVIDER_INTEGRATION.md — YouCam boundary

Adapter operations: capabilities(), upload_asset(), submit_analysis(), submit_tryon(), get_task(), normalize_result(). Application services depend on this interface, never directly on vendor JSON.

The dossier names Fabric VTO, skin/tone analysis, Fitzpatrick classification, Camera Kit, simulation, scarf/jewelry VTO, and MCP hosts. Treat exact endpoints, SDK versions, available regions, input requirements, prices, and response fields as UNVERIFIED until checked against account-specific official documentation and a successful spike. An India host requirement is not established merely because the dossier says it is.

Verification matrix to complete before live implementation:

| Capability | Evidence required | Fallback |
|---|---|---|
| Skin observations | Enabled operation, consent requirements, sample response | Disable automated observations; retain user-entered preferences |
| Tone analysis | Supported output fields and documented interpretation | Editable palette preference, clearly not measured analysis |
| Apparel try-on | Valid person/garment pair, task lifecycle, result terms | Other validated garment category; never fabricated success |
| Camera SDK | Working version and integration/license requirements | Browser camera and file upload |
| Simulation/MCP | Confirmed access and realistic delivery effort | Omit from MVP |

Mock and live adapters use the same normalized contract. Fixtures contain consenting or synthetic subjects and no credentials. Show a persistent “Demo data” indicator when fixtures are enabled. Submission evidence must distinguish recorded examples from live operations.

## JOBS_AND_FAILURES.md — Durable asynchronous work

States: queued → submitting → running → succeeded. Other terminal states: failed, expired, canceled. Unknown submission outcome is a separate reconciliation state, not permission to submit again.

Create the job transactionally, then dispatch through a durable outbox or a periodic undispatched-job reconciler. Workers claim jobs with a lease. Save the upstream task identifier immediately. Worker restarts resume polling rather than create another paid task.

Use bounded exponential backoff with jitter; respect Retry-After. Make polling deadline and attempt limits configurable per operation after measuring provider behavior. A browser timeout must not create a replacement paid job automatically.

If submission times out before returning a provider identifier, reconcile using provider idempotency/status capabilities if available. Otherwise require controlled operator review rather than blind resubmission. Internal job deduplication alone cannot guarantee upstream exactly-once billing.

Cancellation stops local follow-up and suppresses display; it may not cancel provider computation or billing. Explain this in UX. Persist outputs only after validation and ownership checks. Block late writes when session deletion is pending.

## RECOMMENDATIONS.md — Explainable outfit selection

Stage 1: active, licensed catalog availability and valid image assets. Stage 2: user exclusions and contextual cultural restrictions. Stage 3: weighted soft ranking. Stage 4: diversify garment styles and return reasons.

Suggested initial weights: palette preference 0.35, occasion match 0.30, explicit style preference 0.25, venue suitability 0.10. These are tunable product defaults, not research-established values. Missing factors are omitted and remaining weights normalized. Explicit exclusions always outrank a high score.

Use curated palettes as suggestions and permit correction. CIEDE2000 measures color difference; it does not establish universal attractiveness or validate a seasonal diagnosis. Do not infer Fitzpatrick sun-response type, ethnicity, or medical status from pixels. Do not call camera-derived undertones exact.

Return garment_id, score, matched_preferences, rule_decisions, and explanation. If nothing qualifies, show the conflicting constraints and allow user-controlled relaxation; never silently weaken a hard exclusion.

## CULTURAL_CATALOG.md — Data and editorial policy

Begin with the dossier's proposed 20 Indian garment records. Add a small reviewed set for five additional cultural contexts only after the core flow works. Import detailed taxonomy from the attached cultural document only after reviewing its source passages.

Each garment requires name, garment type, region/context tags, palette colors, ceremony suitability, coverage, source image provenance, usage permissions, and try-on validation status. Do not fabricate commerce links or stock availability.

Ask users what context they want; geography does not determine identity. Rules are contextual editorial guidance with sources and override behavior. Avoid universal claims about a religion, nationality, or community. Sacred/restricted contexts require careful review rather than an LLM deciding cultural permission.

## SKINCARE_SAFETY.md — Conservative preparation plans

Purpose: educational, cosmetic preparation guidance, not diagnosis or treatment. Inputs include event date, current routine, sensitivities, allergies, active irritation, and optional relevant safety disclosures. Permit skipping sensitive questions; unanswered questions default to a conservative plan.

Baseline guidance: gentle cleansing as tolerated, moisturizer, sun protection guidance, and continuing tolerated products. No forced 30-day schedule if the event is sooner. Avoid introducing new actives immediately before an event. Do not prescribe concentrations, diagnose conditions, or infer contraindications from an image.

Use reviewed deterministic rules. For pregnancy/breastfeeding, active irritation, medication-related uncertainty, or complex concerns, avoid recommending new actives and suggest qualified advice. A disclaimer is not a substitute for these gates.

A simulation, if added, is a cosmetic illustration, never a prediction of treatment efficacy or guaranteed event-day improvement. Store rule version and input snapshot so recommendations are auditable. Sensitive answers must not enter product analytics.

## UI_UX.md — Screens and behavior

Recommended visual direction: warm ivory canvas, charcoal text, emerald actions, muted gold accents, generous spacing, and editorial garment imagery. Maintain readable contrast and never rely on color alone for status.

| Screen | Primary interaction | Required alternate states |
|---|---|---|
| Welcome | Start guest journey | Privacy explanation, resume session |
| Capture | Upload or use camera | Permission denied, unsupported image, poor framing |
| Analysis | Follow actual job progress | Retry guidance, timeout, unsupported capability |
| Palette | Review and adjust suggestions | Uncertainty, missing analysis, manual preference |
| Occasion | Enter ceremony and date | Past date, unspecified dress code |
| Discover | Filter and inspect ranked garments | Empty results, conflicting constraints |
| Outfit detail | Inspect rationale and start try-on | Unsupported garment, insufficient photo |
| Try-on result | Compare original and generated image | Failure, cancellation, delayed result |
| Preparation | Review event-relative routine | Safety gate, short timeline, no consent |
| Privacy | Delete session data | Pending deletion, completed deletion |

Use bottom navigation on small screens: Discover, Occasion, Prep, Profile. Keyboard navigation, visible focus, labeled inputs, screen-reader job announcements, reduced-motion support, and responsive layouts are acceptance requirements. Never show a fabricated progress percentage or call an image preview proof of physical fit.

## SECURITY_AND_PRIVACY.md — Controls

Collect explicit purpose-specific consent before sending a photo to a provider. Disclose processing purposes, provider involvement, retention policy, deletion limitations, and generated-image behavior. Do not use face identification or public image galleries.

Suggested retention policy requiring implementation and disclosure: raw uploads and generated images expire after 24 hours, guest metadata after seven days. Verify provider retention separately; local deletion cannot promise upstream erasure without provider support.

Validate decoded image content, pixel dimensions, byte limits, and supported formats. Strip EXIF where compatible with the workflow. Private storage only; short-lived signed access; random storage keys. Restrict provider result downloads to trusted hosts and enforce limits to prevent SSRF and oversized downloads.

Deletion removes private objects, associated database data, and session caches; cancels queued jobs; prevents late worker recreation; and documents backup expiry. Keep only minimal nonidentifying operational accounting where necessary. Rate-limit by session and IP; set per-session and global credit caps.

## TEST_PLAN.md — Required verification

Unit: hard cultural exclusions, normalized ranking weights, palette overrides, short-event plans, missing safety answers, contraindication gates, job state transitions, and dedupe key/body conflicts.

Integration: guest isolation, consent enforcement, malicious/oversized uploads, worker restart, queue dispatch failure, provider 429, malformed response, missing task ID, polling timeout, deletion during generation, and unexpected late results.

End-to-end: mobile guest journey through saved try-on and preparation plan; keyboard-only completion; denied camera permission with upload fallback; no-result catalog state; session deletion followed by denied retrieval.

Provider spike: test permitted sample images and several target garment types. Record actual latency, cost, framing requirements, drape distortions, and identity/skin appearance changes. Do not claim inclusive performance from a tiny sample or claim generated apparel proves sizing accuracy.

Release gates: no exposed secrets; no cross-session access; no unlabelled mock results; one verified live provider journey; bounded spending; functional deletion; accessible core screens; passing migration and deployment smoke tests.

## DEPLOYMENT.md — Environments and operations

Recommended deployment: static React frontend, FastAPI service, Celery worker, managed PostgreSQL, managed Redis, and private S3-compatible storage. Prefer routing /api through the frontend origin. Provider credentials exist only in API/worker secrets.

Environment contract to implement: DATABASE_URL, REDIS_URL, STORAGE_BUCKET, STORAGE_ENDPOINT, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, PUBLIC_APP_URL, SESSION_SECRET, YOUCAM_BASE_URL, YOUCAM_API_KEY, PROVIDER_MODE, JOB_TIMEOUT_SECONDS, MAX_UPLOAD_BYTES, SESSION_CREDIT_CAP, GLOBAL_CREDIT_CAP.

Development defaults to mock. Staging has a tightly capped live budget. Production must refuse mock mode unless an explicitly labeled public demonstration mode is intended. CI runs lint, type checks, unit tests, integration tests, frontend build, and secret scanning.

Release order: back up database → compatible migration → API/worker rollout → frontend rollout → live smoke test. Rollback application images only when schema remains compatible; use forward corrective migrations for destructive schema changes.

Expose readiness and liveness separately. Monitor job age, queue depth, provider error rate, latency, orphaned tasks, credit usage, and deletion failures. Logs include request/job IDs but no image URLs, raw photos, sensitive questionnaire answers, or provider tokens.

## IMPLEMENTATION_PLAN.md — Dependency-ordered backlog

1. Foundation: repository, CI, environment validation, database, session ownership, consent, private uploads, deletion skeleton. Done when two guests are isolated and uploads are validated.
2. Provider spike: confirm supported operations and ethnic garment behavior; save sanitized fixtures. Done when one live task completes with documented input/output and cost.
3. Async infrastructure: jobs, outbox/reconciliation, worker leases, polling, idempotency, spending caps. Done when restart and ambiguous-submission tests pass.
4. Product profile: appearance adapter, editable palette, quality and uncertainty UI. Done when failed analysis still supports explicit manual preferences.
5. Catalog and events: seed reviewed garments, cultural rules, occasion form, ranking and explanations. Done when exclusions cannot be overridden by scores.
6. Try-on: valid person-image capture, paid task integration, results and failure UI. Done when the primary demo garment works through the public frontend.
7. Preparation: safety questionnaire, reviewed rules, event-relative schedule. Done when sensitive cases trigger conservative guidance.
8. Release: accessibility, deletion races, performance, live deployment, documentation, demo recording. Add stretch features only after all core gates pass.

Suggested dossier-aligned cadence: week 1 foundation/spike, week 2 profile and jobs, week 3 catalog/events/try-on, week 4 preparation and stabilization, week 5 submission. Scope must shrink if the initial provider spike fails.

## DEMO_AND_SUBMISSION.md — Evidence-driven presentation

Suggested 2:45 walkthrough: 0:00–0:20 problem and consent; 0:20–0:45 capture and editable palette; 0:45–1:15 wedding context and outfit reasons; 1:15–1:55 real try-on; 1:55–2:25 conservative event preparation; 2:25–2:45 architecture, sponsor integration, and public demo link.

Show actual operation names only after verification. Disclose prerecorded processing and mock screens. Include repository access, setup instructions, screenshots, live URL, and video as appropriate to the confirmed event requirements. Recheck the exact event's rules independently; earlier conversation research mixed two hackathons.

Avoid unsupported “world's first,” clinically proven, guaranteed improvement, distortion-free, or return-reduction claims. Market estimates and eligibility details in the research dossier are not verified product outcomes or legal guidance.

## AGENTS.md — Coding-agent handoff

Implement one backlog milestone at a time and keep this specification synchronized with actual code. Never invent provider endpoints, claim tests were run when they were not, expose secrets in frontend code, or replace failed integrations with unlabeled fixtures.

For every change: specify acceptance criteria, implement a narrow slice, add relevant tests, document new environment values, and report remaining integration dependencies. Do not add MCP, vector search, payments, or extra services before the core journey passes.

## DECISIONS_AND_OPEN_QUESTIONS.md — Decision register

Accepted recommendations: guest web app; modular backend plus asynchronous worker; private photo storage; curated catalog; explainable ranking; conservative skincare; polling before SSE; editable palette; stretch work deferred.

Unresolved before provider coding: enabled YouCam operations and regional host, real request/response schemas, provider idempotency, prices and quota, image framing, output licensing, provider retention/deletion, and actual ethnic garment quality.

Unresolved before publication: reviewed catalog image permissions, reviewed cultural taxonomy and skincare sources, measured accessibility/performance, exact hackathon eligibility and deliverables. These are verification tasks, not reasons to block building the local skeleton.
