# AGENTS.md: Developer & AI Agent Guidelines for Keel

> **Read this file before writing or modifying any code in the Keel repository.**
> This file establishes the architectural laws, constraints, and non-negotiables for all autonomous coding agents and developers working on Keel.

---

## 1. Project Identity & Philosophy

- **Product Name**: Keel
- **Tagline / USP**: *"Pick up exactly where you stopped, and see honestly where you slipped."*
- **Target Platform**: Android Only (React Native + Expo)
- **Target Audience**: Students, self-directed learners, and indie developers.
- **Budget**: Exactly ₹0. Zero paid subscriptions, zero paid APIs, zero cloud server databases.

### Core Philosophy
1. **Bare-Minimum & Smart**: Every screen does one job. No complex nested pages, no relational databases for the user to configure, no markdown block editor overhead.
2. **Honest Metrics**: Procrastination is tracked as slips. Timers running past 3 hours trigger guards. Vanity metrics are disallowed.
3. **Habits and Work Are Kept Distinct**: Habits are day-wise routines with streaks and heatmaps. Work items are projects with deadlines, stopping markers, notes, and timers.
4. **Local-First Sovereignty**: 100% of data is stored locally on the Android device via `expo-sqlite`. Export/import via JSON.

---

## 2. Technology Stack & Architectural Constraints

All code must strictly align with the following approved free stack:

| Component | Technology | Strict Constraint |
| :--- | :--- | :--- |
| **Framework** | Expo (React Native) + TypeScript | Strict mode enabled. No `any` types. |
| **Routing** | Expo Router v3+ | File-based routing under `/app`. |
| **Database** | `expo-sqlite` (next) | Local on-device SQLite. WAL mode and foreign keys enabled. |
| **ORM** | Drizzle ORM | Typed schema in `src/db/schema.ts`. Automated migrations. |
| **State** | Zustand | Lightweight client stores (`timerStore`, `journalStore`, `uiStore`). |
| **Styling** | NativeWind v4 (Tailwind CSS) | Clean dark OLED theme (`#000000` base). No random inline colors. |
| **Dates** | `date-fns` | Tree-shakeable date math. Never use Moment.js. |
| **Validation** | Zod | Runtime validation for inputs and backup schemas. |
| **Visuals** | `react-native-svg` | Pure custom SVG components. No heavy charting libraries. |
| **Alarms & Notifs** | `expo-notifications` + Native Channel | Android exact alarms and notification channels. |
| **Testing** | Jest + React Native Testing Library | Pure rule functions must have 100% test coverage. |

### ❌ Explicitly Prohibited
- **NO Cloud Databases**: No Firebase, Supabase, AWS, or Mongo.
- **NO In-App AI**: No OpenAI, Anthropic, or Gemini API keys inside the client app.
- **NO User Authentication**: No login screens, passwords, OAuth, or sessions. Single-user on-device only.
- **NO Drag-and-Drop Kanban**: Buckets are calculated automatically by deadline. Never implement manual card dragging.

---

## 3. Non-Negotiable Engineering Rules

### Rule 1: Pure Functions for Business Logic
All critical domain calculations must live as pure TypeScript functions in `/src/rules/` with zero side effects:
- `calculateBucket(deadline, referenceDate)`
- `calculateDailyTarget(totalUnits, completedUnits, deadline, referenceDate)`
- `computeHabitStreak(scheduledDays, logs, referenceDate)`
- `computeSlipMetrics(project, completionDate)`
- `parseYouTubeTimestamp(url, timestampStr)`

Every function in `src/rules/` must have a corresponding test suite in `src/rules/__tests__/`.

### Rule 2: Timers Must Be Timestamp-Based (Survive App Kill)
- **Never** store a live timer as a variable running in `setInterval` or `setTimeout`.
- Store `started_at` (epoch timestamp) and `accumulated_ms` in SQLite (`active_sessions`).
- If Android kills the app process or the device restarts, the active timer must seamlessly restore its exact elapsed state.
- **Forgot-Timer Guard**: Continuous active sessions $\ge 3\text{ hours}$ must trigger an alert prompt and auto-pause if unacknowledged after 15 minutes.

### Rule 3: The 2-Tap Resume North Star
The app's primary benchmark is:
> *Open the app → View the top "Continue" card → Tap "Resume" → Open link and start session timer.*
This flow must **never** take more than 2 user taps from cold launch.

### Rule 4: Strict Journal Hard Lock
- Daily journal sessions run for exactly 10 minutes ($600\text{ seconds}$).
- Back button is intercepted and blocked via `BackHandler`.
- Screen display sleep is prevented via `expo-keep-awake`.
- **The Reset Penalty**: If the user leaves the app (`AppState !== 'active'`) before the 600 seconds elapse, the timer **immediately resets to 10:00**. The entered text is continuously autosaved to SQLite so writing is never destroyed, but the student must complete a full uninterrupted 10-minute session.

### Rule 5: Auto-Buckets & Slip Accountability
- Projects belong to one of four buckets: `Today`, `Tomorrow`, `This Week`, `Later`.
- Overdue items remain pinned at the top of `Today`.
- Any snooze action or deadline postponement must increment `slip_count` by $+1$.

---

## 4. Repository Structure & Conventions

```
app/                          # Expo Router routes (Tabs, Modals)
  (tabs)/
    today.tsx                 # Tab 1: Today cockpit & continue card
    habits.tsx                # Tab 2: Habit routines & streaks
    work/                     # Tab 3: Projects, buckets & detail
    journal.tsx               # Tab 4: 10-min locked journal
    insights.tsx              # Tab 5: Habits & Work insights
src/
  components/                 # Reusable UI components
  db/                         # SQLite client, Drizzle schema, migrations, repositories
  rules/                      # Pure business logic (100% testable)
  services/                   # Android notifications, alarms, keep-awake, JSON backup
  stores/                     # Zustand stores
  styles/                     # Design tokens & theme colors
  types/                      # TypeScript definitions
docs/                         # Project specifications (01-prd to 10-milestones)
```

---

## 5. Tone & Working Style with the User

- **Terse, Crisp, and Functional**: Prioritize clean working code and working output over excessive prose or cheerleading.
- **Honest About Constraints**: Clearly state what Android native APIs can and cannot do.
- **Impeccable Design Quality**: Follow the dark OLED palette (`#000000`, zinc borders, vibrant project type accents). Keep touch targets $\ge 48\times 48\text{ dp}$.
