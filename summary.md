# Keel: Full Project Context (Handoff Summary)

Purpose of this file: give another AI complete context on the project, the decisions made, and what is still open. Read this first, then `Keel-MVP.md` and `Keel-problem-breakdown.md`.

**Note:** `Keel-MVP.md` section 9 (Stack) still says "PWA". That is outdated. The decision since then is **React Native (Expo), Android only**. See section 4 below, which overrides it.

---

## 1. What this is

**Keel** is a minimal, single-user, Android-only productivity app. It merges three tools the user currently juggles:

- **Notion**: content per item (link, description, notes)
- **Trello**: Today / Tomorrow / This week / Later buckets (made automatic from deadlines)
- **HabitNow**: habits, streaks, statistics, reminders, timers

**Why:** switching between three apps to manage one day is exhausting. The user wants one app that is bare-minimum and smart.

**USP:** *Pick up exactly where you stopped, and see honestly where you slipped.*

**Name:** Keel (the part of a boat that keeps it steady, meaning discipline). Chosen over Cairn, Waymark, Stint, Furrow, Ember, Lodestar, Tarn. Domain, app-store and trademark availability have **not** been checked.

**Builder:** the user, a student and frontend developer comfortable with React. Building solo, for personal use first. Everything must be on free tools.

---

## 2. The problem (source: user's `problem breakdown.md`)

1. No clear tracking of progress on work that was decided to be finished, by deadline or otherwise.
2. Student expectations differ: one app has statistics, another a heatmap, another only a date-wise timeline. The real goal is always to complete something specific: a YouTube course, a documentation guide, a project.
3. Notion databases (URL property, time tracking, start/end date formulas) are fine but students expect more built in.
4. Reminders are the biggest drawback. Most apps offer only a notification or a simple alarm.
5. Trello's Kanban is great for categorizing, but there is no tracking of delay or missed work.
6. Navigating across Notion, Trello and HabitNow feels heavy.

Gaps per app:
| App | Gap |
|---|---|
| Notion | Stores the link but not the *stopping point*. Heavy setup. |
| Trello | No delay or missed statistics |
| HabitNow | Streaks but no content (video, page, project context) |

---

## 3. Product spec (agreed)

### Navigation: 5 bottom tabs
| Tab | Job |
|---|---|
| **Today** | Two sections: **Habits pending** and **Work pending**. "Continue where you left off" card on top. Quick capture. |
| **Habits** | Recurring routines (gym, diet, jogging, basketball, any activity) |
| **Work** | Projects: courses, videos, documentation, tasks, brainstorms |
| **Journal** | Daily (10 min, locked) and Weekly (Sunday) |
| **Insights** | Two **separate** sections: Habits and Work |

The user explicitly wants habits and work kept as different things: habits are day-wise routines; work/courses have timelines, statistics, calendar, time taken, timestamps.

### Today tab
- Habits pending today, and Work pending today (deadline puts them in Today)
- Continue card: last in-progress project with resume marker, one tap to open link
- Quick capture: one line, fill details later
- Each work item shows its daily target

### Work tab
Everything is a **Project**. Types: course, video, documentation, task, brainstorm. Notes exist **only inside a project**, never globally.

- **Fields:** title (required), type (required), link, description, deadline, status (Not started / In progress / Done, auto)
- **Timer:** **Start** when beginning work, **Pause** when done for the day. On Pause the app asks **"Stopped at?"**, with input depending on type: video = timestamp, documentation/book = page or section, course = lesson number, project/task = short note. Total time is summed across sessions.
- **Notes inside project**, with optional timestamp per note (e.g. `12:40 – explains hooks`)
- **Auto-buckets from deadline:** Today / Tomorrow / This week / Later. No manual dragging.
- **Slip tracking:** count of times pushed to a later bucket; days late on completion
- **Calendar view:** each project is a bar from start date to finish date, color-coded by type tag. Tap a bar for time spent, sessions, days late. The user wants this to show clearly how long each project or video took.
- **Daily target auto-calc:** 20 lessons with 5 days left means "4 lessons/day"
- **Timestamp deep-link:** tapping a note like `12:40` opens the YouTube video at that time
- **Forgot-timer guard:** timer running 3 hours triggers "Still working?"; no reply means auto-pause

### Habits tab
- Add: name, repeat (daily / weekdays / custom), reminder time
- Daily check-off, streak, best streak
- Rest day / streak freeze: 1-2 per month (suggested, not yet confirmed by user)
- Day-wise routine view
- Stats: weekly %, monthly heatmap, missed days

### Journal tab
- **Daily: 10 minutes, hard lock.** The user was emphatic: once started, the user cannot exit until the timer ends. "A strict clock on this student." If the user leaves mid-session, the session **resets**.
- **Weekly: Sunday only**, starts automatically. Length not decided (suggested 20 min).
- Draft autosaves.

### Insights tab
- **Habits:** streaks, completion %, heatmap, best and worst habits
- **Work:** time per project, time per day/week, on-time %, days late, completed vs planned, average time per course

### Reminders: 3 types
| Type | Behavior |
|---|---|
| Nudge | Soft notification |
| Alarm | Rings until dismissed |
| Escalate | Soft, then firmer, then alarm if ignored |

Snooze moves the item to a later bucket, not just +10 minutes.

### Data model
- `Habit` + `HabitLog`
- `Project` + `Session` (start, end) + `Note` (text, optional timestamp) + `Marker` (resume position)
- `Journal` (type, text, duration, date)

### After MVP
Sunday weekly review (auto summary), habit linked to project (auto-check when work timer hits target), journal template (one win, one slip, one plan), course checklist with progress %, global search, backup/export JSON.

### Explicitly not building
Collaboration, nested pages, rich blocks, databases/relations, AI, widgets, themes, Pomodoro, sharing.

### Success check
Add a YouTube course, close the app, return next day, reach the exact stopping point in **2 taps**.

---

## 4. Platform and stack decision (latest, overrides earlier PWA plan)

**Decision pending final confirmation, recommended: React Native with Expo, Android only.**

History: the user first asked for a mobile-first PWA, then asked whether a real Android app (React Native) would be easier, then said the app is **only for Android users**. A comparison concluded native wins because alarms and the journal lock are core features that a PWA cannot do well.

| Need | PWA | React Native |
|---|---|---|
| Alarm rings until dismissed | no | yes (exact alarms, `notifee`) |
| Reliable timed reminders | flaky | yes |
| Escalate reminder | weak | yes |
| Journal lock | fullscreen + reset-on-leave only | screen pinning, near-true lock |
| Background timer | tab can die | foreground service possible |

**Recommended free stack**
| Part | Tool |
|---|---|
| App | React Native + Expo + TypeScript |
| Navigation | Expo Router (bottom tabs) |
| Data | `expo-sqlite` (local, no server) |
| Notifications / alarms | `expo-notifications` + `notifee` |
| Charts | `react-native-svg` (heatmap, bars) |
| Build | Android Studio local build, or EAS free tier |
| Backup | JSON export/import to file |

- **No server database needed.** Single user, all data local. Optional cloud sync later via Supabase free tier.
- Cost: zero. APK can be sideloaded. Play Store publishing costs a one-time $25 and is not needed.
- **Fallback:** Capacitor (wrap a React web app into an APK) if React Native feels slow; native alarms still work, journal lock is weaker.

**Caveats to respect**
- Journal lock: Android screen pinning blocks home and recents, but the OS shows a one-time confirm prompt. No app can block everything; reset-on-leave remains the backstop.
- Expo Go cannot run alarm or native modules. Use a **development build**.
- Store the timer as start/stop timestamps, not a running counter, so stats survive the app being killed.

---

## 5. Roadmap (~7 weeks, adapt to React Native)

| Week | Output |
|---|---|
| 1 | Wireframes: Today, Project page, Journal lock, Insights. Expo project setup. |
| 2 | Work tab: projects, deadlines, buckets, resume marker, notes, daily target |
| 3 | Timer, sessions, forgot-timer guard, calendar bars |
| 4 | Habits: repeats, streaks, check-offs, streak freeze |
| 5 | Journal: daily 10-min lock, weekly Sunday |
| 6 | Insights: both sections, slip stats |
| 7 | Reminders (3 types), APK build, polish |

---

## 6. Open decisions

1. Weekly journal length, and Sunday start time
2. Streak freezes: yes or no, and how many per month
3. Final confirmation of React Native + Expo (vs Capacitor)
4. Name availability check for "Keel" (domain, app stores, existing products)

## 7. Immediate next steps

1. Update `Keel-MVP.md` section 9 (Stack) and roadmap to React Native.
2. Create mobile wireframes: **Today, Project page (with timer and "Stopped at?"), Journal lock screen, Insights.**
3. Then scaffold the Expo project.

---

## 8. How the user likes to work (for the next AI)

- Wants **minimal** features and a **minimal user flow**; any user should understand it instantly.
- Prefers terse replies and working output over explanation. Uses a `/caveman` terse-mode command. Casual, informal typing with many typos; read for intent.
- Cares about high design quality and accessibility (uses an `/impeccable` command to signal this). Mobile-first, clean UI.
- Approves plans iteratively: propose a plan, let the user approve or modify, then build.
- Wants honesty about technical limits (for example, what a PWA or Android app cannot do) rather than overpromising.
- Everything must be free.

## 9. Files in this project

| File | Contents |
|---|---|
| `problem breakdown.md` | User's original problem notes and reference-app feature lists |
| `Keel-problem-breakdown.md` | Cleaned problem, idea, user need breakdown and user flow |
| `Keel-MVP.md` | Full MVP feature spec and roadmap (stack section outdated, see section 4) |
| `summary.md` | This file |
## Docs to prepare

Put all in `docs/`. Final list, nothing extra.

|#|File|Status|
|---|---|---|
|1|`01-problem-analysis.md`|✅ Done|
|2|`02-prd.md`|✅ Done|
|3|`03-rules-edge-cases.md`|✅ Done|
|4|`04-ux-screen-spec.md`|✅ Done|
|5|`05-trd.md`|✅ Done|
|6|`06-data-schema.md`|✅ Done|
|7|`07-app-architecture.md`|✅ Done|
|8|`08-android-platform-spec.md`|✅ Done|
|9|`09-test-acceptance-plan.md`|✅ Done|
|10|`10-milestones.md`|✅ Done|
|11|`AGENTS.md` (repo root)|✅ Done|
|–|`summary.md`|✅ Done (cold-start context)|

Skipped on purpose: API spec, auth, auth flow, security testing. No server, no login.

## Free stack (₹0, no subscriptions)

**App needs no database server and no AI model.** All data on phone.

|Layer|Pick|Note|
|---|---|---|
|Framework|**Expo + React Native + TypeScript**|Latest stable SDK. Pin versions at setup|
|Navigation|**Expo Router**|Bottom tabs, 5 screens|
|Database|**expo-sqlite**|On-device, free|
|ORM / migrations|**Drizzle ORM**|Typed schema, migrations, works with expo-sqlite|
|State|**Zustand**|Tiny. Timer, UI state|
|Styling|**NativeWind** (Tailwind for RN) + design tokens|Fast, consistent|
|Animation / gestures|`react-native-reanimated`, `gesture-handler`|Ship with Expo|
|Dates|**date-fns**|Buckets, streaks, "days late"|
|Validation|**zod**|Form and import checks|
|Charts / heatmap / calendar bars|**react-native-svg** (custom)|Light, full control|
|Reminders|**expo-notifications**|Nudge, escalate|
|True alarm (rings until dismissed)|Native module, **verify in doc 08**|Check `notifee` maintenance status before choosing. May need small custom Kotlin module|
|Journal lock|`BackHandler` + `AppState` reset + **screen pinning**|Pinning has no official Expo API. Needs small custom module (`startLockTask`). Fallback: reset-on-leave|
|Keep screen on|`expo-keep-awake`|Journal session|
|YouTube timestamp link|`Linking` + `&t=` URL|No API key|
|Link title fetch|YouTube **oEmbed** (no key)|Optional|
|Backup / restore|`expo-file-system` + `expo-sharing` + `expo-document-picker`|JSON export/import|
|Tests|**Jest + jest-expo**, React Native Testing Library|Rules as pure functions, easy to test|
|E2E (optional)|**Maestro**|Open source, free|
|Quality|ESLint, Prettier, `tsc`||
|Build APK|**Local**: `npx expo run:android` + Android Studio|Free, no queue. EAS free tier is limited, use only as backup|
|CI (optional)|GitHub Actions|Free on public repos|
|Source control|GitHub free||
|Wireframes|Figma free||

## Not using

Firebase, paid APIs, in-app AI, cloud DB, auth provider, Sentry (add later, free tier).

## Later, optional

Cloud sync via **Supabase free tier**. Note: free projects pause after inactivity. JSON backup stays the safety net.

## Risks to settle in doc 08 first

1. True alarm: which library works on current Android.
2. Screen pinning: custom module effort.
3. Timer survives app kill: store timestamps, not counters.

## Building with AI, no subscription

App needs none. For coding help, free tiers of AI assistants work. Keep `AGENTS.md` and docs tight so small context windows still work.

Next: say **go**, I draft `02-prd.md` then `03-rules-edge-cases.md`. Still open: weekly journal length, streak freezes.