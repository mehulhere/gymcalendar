# Product & Technical Specification: Gym Tracking App

## 1) Product Overview

A Next.js (React) Progressive Web App that lets users:

* Check in on a calendar (attendance).
* Log workouts (optionally).
* Build workout plans (days, exercises, sets; optional muscle tagging).
* Track training **volume** and weekly muscle stress.
* Get LLM‑powered insights, alternates, and tips (cached).
* Visualize progress—weights/volume charts, weigh‑ins, and "body parts hit" heatmaps.
* Sign up/sign in securely; data stored in MongoDB; JWT auth.

**Primary goal:** Make consistency visible (calendar + heatmaps), keep logging effortless, and use rule‑based + LLM guidance to steer recovery and progress.

---

## 2) Tech Stack

* **Frontend:** Next.js 14 (App Router), React 18, TypeScript, shadcn/ui (Radix UI), Tailwind CSS
* **PWA:** next-pwa for offline support, app manifest, service worker
* **State:** Zustand (lightweight), React Query (server state & cache)
* **Charts:** `react-chartjs-2` (Chart.js) - touch-optimized
* **Calendar:** shadcn Calendar (react-day-picker) with touch gestures
* **Auth & Security:** Custom JWT (access + refresh), HttpOnly cookies, bcrypt, Zod validation, Helmet headers
* **Backend:** Next.js Route Handlers (Edge-friendly where possible; Node runtime for LLM/Mongo)
* **Database:** MongoDB (Mongoose ODM)
* **LLM Integration:** Provider-agnostic (OpenAI, Azure OpenAI, etc.). Abstraction layer with caching in MongoDB.
* **Testing:** Jest + React Testing Library (unit), Playwright (e2e with mobile viewport), Supertest (API)
* **DevOps:** Vercel (frontend & API routes) or Node server on Docker; GitHub Actions CI; Sentry for monitoring

---

## 3) Key Concepts & Definitions

* **Attendance vs. Logging:** Checking in does **not** require logging sets/reps. Logging is optional.
* **Volume (per exercise set):** `load = weight * reps`.
  **Exercise volume:** sum of load across sets.
  **Muscle volume:** sum of exercise volume * muscle weighting (primary = 1.0, secondary = 0.5).
  **Bodyweight/no‑load moves:** use `estimated_load = body_weight * load_factor` (defaults: push‑up 0.7×BW, pull‑up 1.0×BW, dip 0.9×BW, plank counts as `time_secs / 60 * RPE_weight`, default 20 kg). These factors are configurable.
* **Weekly set count (stress):** Count sets per muscle across a rolling 7‑day window.
  **Overreached (red):** > 20 sets/week for a muscle. 10–20 = neutral, <10 = low (blue scale).
* **Make‑up session:** Doing 2 sessions on one day allows allocating one session to a **past missed scheduled day in the same calendar week**. That missed day becomes "made up" (green outlined with ✓ icon).

---

## 4) User Roles

* **User:** CRUD on own data
* **Admin (optional):** Manage exercise dictionary; moderate reports; view analytics

---

## 5) User Stories (selected)

1. As a user I can sign up/sign in securely and stay signed in.
2. I can tap a date to **check in**; attended dates turn **green**; missed scheduled days are **red**; rest/unscheduled days are **gray**.
3. I can allocate a second workout on a day as a **make‑up** for a prior missed day (same week).
4. I can build workout plans: create days (e.g., "Leg Day" or "Day 1"), add exercises, sets, reps; optionally tag muscle groups or auto‑infer from exercise name.
5. I can start a workout from a plan: see exercise cards, mark sets done, mark exercise done (card turns green).
6. For each exercise, I can tap a **YouTube icon** to open results in the YouTube app or browser.
7. I can add alternates to an exercise; if none exist, tap a **Remix** button to fetch alternates from the LLM (cached).
8. I can tap a **Tips (💡)** icon to get LLM tips for that exercise/session (cached).
9. I can log weights/reps; see volume and weight charts over time.
10. I can record weigh‑ins and a goal (target weight + target date) and see "on track?" feedback.
11. I can open a **Stats** page showing today's hit muscles, weekly heatmap, muscles over 20 sets (red), and weigh‑in charts.

---

## 6) UX & Screens

### 6.1 Navigation

* Bottom navigation bar with icons: **Calendar**, **Plans**, **Workout**, **Stats**, **Profile**
* Active state indicated with color and label
* Fixed position, always accessible via thumb zone

### 6.2 Calendar (Attendance)

* Month view with color codes:
  * **Green:** attended (✓ badge).
  * **Red:** scheduled but missed.
  * **Gray:** rest / no plan day / future.
  * **Green (double‑ring):** attended twice; tap opens "Assign make‑up" bottom sheet.
* Large **Check-in button** (thumb-friendly, 48px min height) on today
* **Swipe gestures** to navigate between months
* **Tap and hold** on date for quick info sheet: Sessions, plan day name, status, make‑up links
* Pull-to-refresh for sync

### 6.3 Workout Plan Builder

* Create Plan → Add "Days" (name + recurrence: by weekday(s) or "Day 1/2/3 loop")
* Add Exercises to a day: name (autocomplete from dictionary with large touch targets), sets (count), default reps, optional target weight, **muscles** (auto‑infer via dictionary; user can override)
* **Alternates**: add multiple manually via bottom sheet; also "Suggest alternates" (LLM)
* Exercise row has **YouTube** icon (opens YouTube app or in-app browser)
* Floating Action Button (FAB) to save as draft or publish (active)
* Only one active plan at a time (configurable)
* **Swipe-to-delete** on exercise rows
* **Drag handles** for reordering exercises

### 6.4 Start Workout / Do Workout

* Choose plan & day via bottom sheet; large "Start Workout" button opens the **Session** page
* Cards per exercise: show set list with large tap targets for input
* **Number pad overlay** for quick weight/rep entry
* Mark sets done with satisfying haptic feedback; card shows progress bar; card turns **green** when completed
* Actions on each card (icon buttons, 44px min):
  * **Remix (⟲)**: get/query an alternate (LLM or pre‑added) via bottom sheet
  * **Tips (💡)**: fetch LLM tips in expandable card; first fetch stores result in cache
* Sticky header showing: elapsed time (always visible), current exercise name
* Sticky footer: total volume today, large **Finish & Check In** button
* **Swipe between exercises** for faster navigation
* Auto-save on field blur (optimistic updates)

### 6.5 Stats

* **Pull-to-refresh** to update
* **Today's muscles hit**: anterior/posterior SVG body map filled by intensity (blue scale) based on today's muscle volume
  * **Pinch-to-zoom** on muscle map
  * **Tap muscle** for quick volume details in bottom sheet
* **Weekly muscle heatmap**: same map aggregating last 7 days. Muscles **>20 sets/week** outlined **red**
* **Volume charts**: by exercise, by muscle group, by week; selectable ranges
  * **Horizontal swipe** to navigate time periods
  * **Pinch-to-zoom** on charts
  * Landscape orientation supported for detailed chart view
* **Weigh‑ins**: line chart (daily + 7‑day moving average)
  * Rule‑based card: "On track / Slightly behind / Aggressive / Consider recovery", with rationale
  * **Swipe chart** to see historical periods
* **Insights (LLM)** card: text summary of recent volume trends and recovery notes (cached weekly)
  * Expandable card with "Read more" if content is long

### 6.6 Profile

* Units (kg/lb), height, body weight preference, equipment available
* Goal weight + target date (or weeks); prompts to confirm if not set via modal
* Privacy, export data (JSON/CSV via share sheet), delete account
* **Install PWA** prompt if not installed
* Theme toggle (light/dark/system)

---

## 7) Color & Visual Language (shadcn)

* **Green**: `emerald-500/600` for attended/completed
* **Red**: `red-500/600` for missed or over 20 sets
* **Gray**: `zinc-300/400` for rest/future days
* **Touch targets**: Minimum 44x44px for all interactive elements
* **Typography**: Minimum 16px base font; larger for primary actions (18-20px)
* **Spacing**: Generous padding (min 16px) for tap comfort
* **Bottom sheets**: Primary interaction pattern for modals and overlays
* Components: `Card`, `Button`, `Tabs`, `Tooltip`, `Dialog`, `DropdownMenu`, `Badge`, `Progress`, `Textarea`, `Input`, `Select`, `Calendar`, `Table`, `Accordion`, `Toast`, `Sheet` (bottom drawer)

---

## 8) Exercise Dictionary (seed & usage)

* **Fields:** `name`, `aliases[]`, `equipment` (machine, cable, dumbbell, barbell, bodyweight, band), `primary_muscles[]`, `secondary_muscles[]`, `category` (push, pull, hinge, squat, carry, core), `youtube_query_override` (optional)
* Used for autocomplete; muscle inference; default YouTube search; LLM grounding (provide dictionary to prompt for alternates/tips)
* Seed at least 300 common movements across machines/free weights/bodyweight

---

## 9) Data Model (MongoDB collections)

**users**

* `_id`, `email` (unique), `password_hash`, `name`, `settings` { `unit`: 'kg'|'lb', `timezone`, `equipment[]`, `theme`: 'light'|'dark'|'system' }, `createdAt`, `updatedAt`

**auth_tokens** (optional if using rotating refresh tokens)

* `userId`, `refreshTokenHash`, `expiresAt`, `createdAt`

**exercises**

* `_id`, `name`, `aliases[]`, `equipment`, `primary_muscles[]`, `secondary_muscles[]`, `category`, `youtube_query_override`, `createdBy` (null for system)

**plans**

* `_id`, `userId`, `name`, `isActive`, `schedule`:
  * mode: `'weekday'|'sequence'`
  * `weekdayMap`: `{mon: planDayId|null, ...}` (if weekday mode)
  * `sequenceOrder[]`: `[planDayId]` (if Day 1/2/3 loop)
* `days[]`: `[ { _id, name, notes, exercises:[{ exerciseId, sets, defaultReps, targetWeight, musclesOverride{primary[],secondary[]} , alternates[exerciseId] }] } ]`
* timestamps

**sessions**

* `_id`, `userId`, `date` (local), `planId?`, `planDayId?`, `status`: `'in_progress'|'completed'|'abandoned'`, `checkIn: boolean`, `makeupForDate?`, `startedAt`, `endedAt`,
  `exercises:[ { exerciseId, altOfExerciseId? , sets:[{ reps, weight, rpe? }], notes } ]`, `totalVolume`

**attendance**

* `_id`, `userId`, `date`, `status`: `'attended'|'missed'|'rest'`, `madeUpBySessionId?`, `notes`
  * Created by scheduler (missed/rest) and by session completion (attended). (Alternatively, infer from sessions & schedule on the fly; stored form is faster.)

**weigh_ins**

* `_id`, `userId`, `date`, `weight`, `note`

**goals**

* `_id`, `userId`, `targetWeight`, `targetDate`, `createdAt`, `updatedAt`

**llm_cache**

* `_id`, `type`: `'TIP'|'ALTERNATE'|'INSIGHT'`, `keyHash`, `prompt`, `response`, `metadata` (e.g., exerciseId, userId), `createdAt`, `expiresAt`

**analytics_rollups** (optional)

* weekly summaries per user/muscle for fast stats

---

## 10) Core Algorithms & Business Rules

### 10.1 Attendance & Make‑Ups

1. **Scheduled day detection**
   * If `schedule.mode = weekday`, a given date is scheduled if `weekdayMap` has a plan day
   * If `sequence`, generate schedule across weeks by rolling through `sequenceOrder` and skipping days without planned training (e.g., every other day)

2. **Marking missed**
   * At midnight local or on calendar render: if date < today and scheduled but no check‑in nor make‑up allocation → `missed`

3. **Double session (make‑up)**
   * When finishing a second session today, show bottom sheet listing **missed scheduled days this week (Mon–Sun) with no existing make‑up**
   * On select, set `session.makeupForDate = <missedDate>` and update that `attendance` to `attended` with flag `madeUpBySessionId`

### 10.2 Volume

```
setVolume = weight * reps
exerciseVolume = Σ setVolume
muscleVolume = Σ (exerciseVolume * weightFactor)
where weightFactor = 1.0 (primary) or 0.5 (secondary)
sessionVolume = Σ exerciseVolume
weeklyMuscleSets = Σ sets per muscle in last 7 days
```

### 10.3 Muscle Heatmaps

* **Blue scale** for intensity (low → high) based on normalized **muscleVolume** (or sets) in the selected window
* **Red outline/fill** if `weeklyMuscleSets > 20`

### 10.4 Weigh‑in "On Track?" Rule

* Let `W0` = latest 7‑day avg weight, `Wg` = goal weight, `D` = days until target date
* **Required daily rate:** `r_req = (W0 - Wg) / D` (kg/day; negative if gaining)
* **Actual rate (trend):** linear regression slope of last 14–21 days of 7‑day average
* **Status:**
  * `|r_act| >= 0.9 * |r_req|` and same sign → **On track**
  * `0.5 * |r_req| <= |r_act| < 0.9 * |r_req|` → **Slightly behind**
  * `|r_act| < 0.5 * |r_req|` → **Behind**
  * `|r_act| > 1.5 * |r_req|` → **Aggressive (monitor recovery)**
* Display guidance & safety note (not medical advice)

### 10.5 LLM Prompts (summaries)

* **Alternates:** "Suggest 3 alternates for `<exercise>` targeting `<primary_muscles>` with equipment: `<user.equipment[]>`. Return JSON with `name, reason, equipment`."
* **Tips:** "Provide 3 concise coaching cues and 2 safety tips for `<exercise>`. Keep each under 20 words."
* **Insights:** "Analyze weekly muscle volume trends for `<user>`: list muscles trending down 2 consecutive weeks or >20 sets/week. Output 4–6 advice bullets; encourage recovery focus when applicable."

Each response stored in `llm_cache` keyed by `(type, exerciseId/period/userId, modelVersion)` with TTL (e.g., 30–90 days).

---

## 11) API Design (Next.js Route Handlers)

`/api/auth/*`

* `POST /signup` → `{email, password, name}`
* `POST /login` → `{email, password}` → returns access JWT; sets refresh cookie
* `POST /refresh` → rotates access token
* `POST /logout` → invalidates refresh token

`/api/exercises/*`

* `GET /search?q=` (name/alias)
* `GET /:id`
* `POST /` (admin)
* `PUT /:id` (admin)

`/api/plans/*`

* `GET /` (user's plans)
* `POST /` create
* `GET /:id`
* `PUT /:id`
* `POST /:id/activate`
* `DELETE /:id`

`/api/sessions/*`

* `POST /start` → `{planId, planDayId, date?}`
* `PUT /:id` (update sets/notes/in‑progress)
* `POST /:id/finish` → `{checkIn: true, makeupForDate?}`
* `GET /?from=&to=`

`/api/attendance/*`

* `GET /calendar?month=YYYY-MM` → server returns statuses for all dates (attended, missed, rest, made‑up)
* `POST /checkin` → `{date}` (for manual check‑in without session)
* `POST /makeup` → `{sessionId, missedDate}`

`/api/weighins/*`

* `GET /?from=&to=`
* `POST /` → `{date, weight, note?}`
* `DELETE /:id`

`/api/goals/*`

* `GET /`
* `POST /` → `{targetWeight, targetDate}`
* `PUT /:id`

`/api/stats/*`

* `GET /today-muscles`
* `GET /weekly-heatmap?from=&to=`
* `GET /volume-series?by=exercise|muscle&period=7d|30d|12w`
* `GET /weight-summary` → latest trend + on‑track status

`/api/llm/*`

* `POST /alternates` → `{exerciseId, context}` (uses cache)
* `POST /tips` → `{exerciseId}` (uses cache)
* `POST /insights` → `{range}` (uses cache and rate‑limit)

**All protected routes** use access JWT in `Authorization: Bearer`.

---

## 12) Frontend Architecture & Components

* **App Router structure**
  * `/` → Calendar
  * `/plans` → Plans list
  * `/plans/new` → Plan builder
  * `/plans/:planId` → Plan detail
  * `/plans/:planId/start/:dayId` → Session page
  * `/stats` → Stats dashboard
  * `/profile` → Settings, goals, exports
  * `/auth/login`, `/auth/signup`

* **Shared components**
  * `AttendanceCalendar` (color logic, legend, swipe gestures)
  * `MuscleMap` (SVG with anterior/posterior groups, gradient fills, pinch-to-zoom)
  * `ExerciseCard` (do workout; remix/tips buttons, swipe gestures)
  * `VolumeChart`, `WeightChart`, `MuscleBarChart` (touch-optimized, horizontal swipe)
  * `AlternateList` (chips + reason in bottom sheet)
  * `YouTubeLink` (deep links to YouTube app when available)
  * `BottomSheet` (primary modal pattern)
  * `NumberPad` (custom component for weight/rep entry)

* **State**
  * Session editing in local Zustand store; persisted to API on blur or set-complete
  * React Query for server caching & optimistic updates
  * Service worker for offline data queue

* **PWA Features**
  * Install prompt on first visit
  * Offline indicator when network unavailable
  * Background sync for pending session updates
  * Push notifications for workout reminders (opt-in)

---

## 13) Muscle Map (SVG regions)

Define IDs for fill control:

* Neck/Traps, Delts (front/side/rear), Chest, Lats, Upper/Mid/Lower Back, Biceps, Triceps, Forearms, Abs, Obliques, Glutes, Quads, Hamstrings, Calves, Adductors, Abductors
* `fillValue = normalizedVolume[region]` → map to blue scale; if `weeklySets > 20` apply red overlay or stroke
* Two views: **Front** and **Back** (swipe to toggle or tap toggle button)
* Tap individual muscle for details in bottom sheet

---

## 14) Security & Privacy

* JWT (RS256) access (15 min) + refresh (30 days) in HttpOnly secure cookie; rotate on refresh
* Passwords: bcrypt (12+ rounds)
* Rate limiting (IP + user) for auth and `/api/llm/*`
* Input validation: Zod on all route handlers
* RBAC (admin vs user)
* CORS locked to app origin, HTTPS only, CSP/Helmet headers
* Audit logging for auth events; PII minimal; data export via native share & delete (GDPR-style)

---

## 15) Performance & Reliability

* Indexes: `sessions` by `userId+date`, `attendance` by `userId+date`, `weigh_ins` by `userId+date`, `plans.userId`
* Server cache: React Query + HTTP cache headers on read routes
* LLM cache in Mongo; key hashing to dedupe prompts
* Optional Redis for hot caches & rate limiting (future)
* Image optimization: WebP with fallbacks, lazy loading
* Code splitting per route for faster initial loads
* Service worker caching strategies: Cache-first for assets, Network-first for API
* Preload critical fonts and assets
* Aggressive tree-shaking and bundle optimization

---

## 16) Accessibility & Internationalization

* Touch targets minimum 44x44px (WCAG 2.5.5)
* Keyboard nav support for external keyboard users
* ARIA roles on interactive icons (YouTube, Remix, Tips)
* Color contrast meets WCAG AA; non‑color indicators (✓ icon, outlines)
* Haptic feedback for key interactions (set completion, check-in)
* VoiceOver/TalkBack tested on iOS/Android
* i18n ready: copy through a translation layer; units in kg/lb
* Reduced motion support for users with vestibular disorders

---

## 17) Analytics & Observability

* Sentry for errors with device/OS context
* Simple event logging (check‑ins, workouts completed, alternates used, tips fetched)
* Privacy‑respecting analytics (e.g., PostHog self‑hosted, optional) to learn feature adoption
* Network performance monitoring (request times, cache hit rates)
* Crash reporting with breadcrumbs

---

## 18) Testing Scope

* **Unit:** volume math, weekly sets, on‑track rule, make‑up allocation logic
* **Integration:** auth flow, session save/finish, attendance calendar coloring
* **E2E:** "Create plan → Start workout → Finish → Assign make‑up → See stats & insights"
* **Mobile-specific:** Touch gesture interactions, bottom sheet behaviors, orientation changes
* **PWA:** Offline functionality, service worker updates, install flow
* **Performance:** Lighthouse mobile scores (target: 90+ performance, 100 accessibility)

---

## 19) Seed & Migrations

* Seed `exercises` with 300+ movements; backfill `muscles`
* On first login, guide user to set units, equipment, goal weight & date via onboarding flow
* Provide migration scripts (Node) for schema evolution (Mongoose migrations or MongoDB Change Streams for re‑calc of rollups)

---

## 20) Non‑Functional Requirements

* P95 interactive page load < 1.5s on 4G
* API P95 < 250ms for read endpoints
* Uptime target 99.9% (hosting dependent)
* LLM requests capped at 3/30s per user; cached responses reused
* PWA install size < 5MB (excluding cached content)
* Smooth animations at 60fps (no jank during gestures)
* Battery-efficient: Minimize wake locks and background processing

---

## 21) YouTube Deep Linking

* Button on exercise attempts to open YouTube app first (deep link), falls back to browser:
  ```
  Android: intent://youtube.com/results?search_query=<encoded>#Intent;scheme=https;package=com.google.android.youtube;end;
  iOS: youtube://results?search_query=<encoded>
  Fallback: https://www.youtube.com/results?search_query=<urlencoded(
    exercise_name + ' ' + ('shorts' or 'tutorial') + ' ' + 'deltabolic' )>
  ```
  (Config: default to "shorts"; allow user toggle to "tutorial" in settings.)

---

## 22) Example Payloads

**Exercise log within a session**

```json
{
  "sessionId": "abc123",
  "exercises": [
    {
      "exerciseId": "deadlift",
      "sets": [
        {"reps": 5, "weight": 120},
        {"reps": 5, "weight": 120},
        {"reps": 5, "weight": 120}
      ]
    }
  ]
}
```

**Attendance calendar cell**

```json
{
  "date": "2025-03-10",
  "status": "attended",
  "double": true,
  "madeUpForDate": "2025-03-08"
}
```

---

## 23) Assumed Defaults (configurable)

* Week starts **Monday**
* "Same week" for make‑ups = Mon–Sun window containing today
* Units default **kg**; user can switch to **lb** (conversions done at display time)
* Bodyweight estimate for volume is **enabled** (configurable per exercise)
* Only one active plan; plan schedule controls "scheduled vs rest" on calendar
* **Dark mode** default (system preference respected)
* Haptic feedback enabled by default

---

## 24) Definition of Done (DoD)

* Users can:
  * Sign up/in/out; sessions persist with refresh tokens
  * Build a plan; start and complete workouts; check in
  * See calendar with correct green/red/gray & make‑up assignment
  * Log sets/reps/weights; see volume charts
  * View exercise page with YouTube deep link
  * Fetch alternates & tips via LLM; responses cached
  * See Stats: today & weekly muscle maps; >20 sets flagged in red
  * Record weigh‑ins; set goal; view "on track?" card
* PWA installable on iOS and Android
* Offline mode functional for viewing plans and logging (syncs when online)
* Full test suite passes including mobile viewport tests
* Accessibility checks pass on key pages with screen readers
* Lighthouse mobile scores meet targets (90+ performance, 100 accessibility)
* Basic analytics & error tracking enabled with device context

---

### Notes on Safety

* LLM content is **advisory**, not medical advice. Show a small disclaimer where insights/tips appear
* If LLM is unavailable, fall back to rule‑based tips from the exercise dictionary

---

This specification provides a complete blueprint for building a gym-tracking Progressive Web App optimized for touch interfaces with native app-like interactions.