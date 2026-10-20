# AI Agent Build Prompt: Keel Android App

## 🎯 Mission
Build **Keel** — a 100% offline-first, local-only Android productivity app (React Native + Expo) that unifies work tracking (with precise stopping markers), habit tracking (streaks + heatmaps), and a 10-minute hard-lock journal. **Zero budget. Zero cloud. Zero auth.**

**USP:** *"Pick up exactly where you stopped, and see honestly where you slipped."*

**North Star Benchmark:** Cold launch → Today screen → Tap "Resume" on Continue Card → Link opens + timer starts. **≤ 2 taps.**

---

## 📚 Complete Documentation Context (Read These First)

All specs are in `/docs`. Read in this order:

| # | File | Purpose |
|---|------|---------|
| 1 | `AGENTS.md` (repo root) | **Non-negotiable engineering rules** — read first, obey always |
| 2 | `docs/01-problem-analysis.md` | Problem, vision, competitive audit |
| 3 | `docs/02-prd.md` | Full product requirements (5 tabs, all features) |
| 4 | `docs/03-rules-edge-cases.md` | **Pure business logic specs** — every function here must be implemented as testable pure TS |
| 5 | `docs/04-ux-screen-spec.md` | Design tokens, color palette, screen specs, component specs |
| 6 | `docs/05-trd.md` | Tech stack, architecture, performance budgets |
| 7 | `docs/06-data-schema.md` | Drizzle ORM schema, SQL queries, Zod backup schema |
| 8 | `docs/07-app-architecture.md` | Folder structure, Zustand stores, data flow |
| 9 | `docs/08-android-platform-spec.md` | Permissions, exact alarms, screen pinning Kotlin module |
| 10 | `docs/09-test-acceptance-plan.md` | Test specs (100% pure fn coverage) + acceptance criteria |
| 11 | `docs/10-milestones.md` | 8-phase execution plan |

---

## ⚙️ Tech Stack (Locked In)

| Layer | Technology | Version Constraint |
|-------|------------|-------------------|
| Framework | Expo + React Native + TypeScript | Latest stable SDK (51+) |
| Routing | Expo Router v3+ | File-based under `/app` |
| Database | `expo-sqlite` (next) | WAL mode, FK enabled |
| ORM | Drizzle ORM | Typed schema, auto-migrations |
| State | Zustand | 3 stores: timer, journal, UI |
| Styling | NativeWind v4 (Tailwind) | Dark OLED theme (`#000000` base) |
| Dates | `date-fns` | Tree-shakeable only |
| Validation | Zod | Runtime + backup schema |
| Charts | `react-native-svg` | Custom SVG heatmap + Gantt |
| Notifications | `expo-notifications` | 3 channels: nudge, alarm, escalate |
| Alarms | Native Android | `SCHEDULE_EXACT_ALARM` + custom Kotlin audio channel |
| Screen Pinning | Custom Kotlin module | `startLockTask()` via config plugin |
| Keep Awake | `expo-keep-awake` | Journal sessions |
| Backup | `expo-file-system` + `expo-sharing` | JSON export/import |
| Testing | Jest + React Native Testing Library | Pure fns: 100% coverage |
| Build | Local Gradle | `cd android && ./gradlew assembleRelease` |

---

## 🚫 Hard Constraints (From AGENTS.md — Violations = Reject)

1. **NO cloud databases** — No Firebase, Supabase, AWS, Mongo
2. **NO in-app AI** — No OpenAI, Anthropic, Gemini keys
3. **NO user auth** — No login, passwords, OAuth, sessions
4. **NO drag-and-drop Kanban** — Buckets are auto-calculated from deadline only
5. **NO `any` types** — TypeScript strict mode enforced
6. **Timers MUST be timestamp-based** — Store `started_at` + `accumulated_ms` in SQLite; never `setInterval` counters
7. **Journal hard lock** — 10 min (600s), back button blocked, screen kept awake, reset-on-leave penalty (timer → 10:00, draft autosaved)
8. **Pure functions for all business logic** — `/src/rules/` only; zero side effects; 100% test coverage
9. **2-Tap Resume** — Never exceed 2 taps from cold launch to resume working

---

## 🏁 Starting Point: Milestone 1 (Foundation & DB)

### Deliverables
- [ ] Scaffold Expo TypeScript project with Expo Router v3
- [ ] Configure NativeWind v4 + design tokens from `docs/04-ux-screen-spec.md` §1.1–1.2
- [ ] Set up `expo-sqlite` client with PRAGMAs (WAL, FK=ON, synchronous=NORMAL)
- [ ] Implement Drizzle schema from `docs/06-data-schema.md` §2
- [ ] Generate & run SQLite migrations for all tables
- [ ] Build 5-tab navigation scaffold (`/today`, `/habits`, `/work`, `/journal`, `/insights`)
- [ ] Root layout: DB provider, theme provider, global styles

### Done Criteria
App builds and runs on Android emulator; bottom tab bar switches between placeholder screens with smooth 60fps transitions.

---

## 🧱 Implementation Order (Within Milestone 1)

### Step 1: Project Scaffold
```bash
npx create-expo-app@latest keel --template blank-typescript
cd keel
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npx expo install nativewind@^4.0.0 tailwindcss@^3.4.0
# Configure NativeWind per docs
```

### Step 2: Design Tokens (`src/styles/colors.ts`)
Copy exact palette from `docs/04-ux-screen-spec.md` §1.1:
```ts
export const colors = {
  bgPrimary: '#000000',
  bgCard: '#121214',
  bgSubtle: '#1C1C20',
  borderSubtle: '#27272A',
  borderFocus: '#38BDF8',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  brandPrimary: '#38BDF8',
  brandSuccess: '#22C55E',
  brandWarning: '#F59E0B',
  brandDanger: '#EF4444',
  tagCourse: '#3B82F6',
  tagVideo: '#EF4444',
  tagDoc: '#10B981',
  tagTask: '#F59E0B',
  tagBrainstorm: '#8B5CF6',
};
```

### Step 3: Database Client (`src/db/client.ts`)
```ts
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

export const sqlite = openDatabaseSync('keel.db', {
  enableChangeListener: true,
});

export const db = drizzle(sqlite);

// Enforce PRAGMAs immediately
sqlite.execSync(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
`);
```

### Step 4: Drizzle Schema (`src/db/schema.ts`)
Copy **exactly** from `docs/06-data-schema.md` §2.1–2.3. All tables: `habits`, `habit_logs`, `habit_freezes`, `projects`, `sessions`, `active_sessions`, `notes`, `journal_entries`, `journal_drafts`, `app_settings`.

### Step 5: Migrations
```bash
npx drizzle-kit generate --config=drizzle.config.ts
npx drizzle-kit migrate --config=drizzle.config.ts
```
Verify tables exist: `sqlite.execSync('SELECT name FROM sqlite_master WHERE type="table"')`

### Step 6: Expo Router 5-Tab Layout
```
app/
├── _layout.tsx          # Root: providers, theme
├── (tabs)/
│   ├── _layout.tsx      # 5-tab config
│   ├── index.tsx        # Redirect → /today
│   ├── today.tsx        # Placeholder
│   ├── habits.tsx       # Placeholder
│   ├── work/
│   │   └── index.tsx    # Placeholder
│   ├── journal.tsx      # Placeholder
│   └── insights.tsx     # Placeholder
├── modal/               # Empty for now
```

### Step 7: Verify Build
```bash
npx expo run:android
# Must launch on emulator/device, show 5 tabs, switch smoothly
```

---

## ✅ Definition of Done for This Prompt

The agent has successfully completed Milestone 1 when:

1. `npx expo run:android` produces a working app on Android
2. Bottom tab bar shows 5 tabs: Today, Habits, Work, Journal, Insights
3. Tabs switch at 60fps with no visual glitches
4. `keel.db` exists with all 10 tables + indexes + FKs
5. Design tokens match `docs/04-ux-screen-spec.md` exactly
6. TypeScript compiles with zero errors (`npx tsc --noEmit`)
7. No `any` types anywhere in the codebase

---

## 🔑 Key Files to Create/Modify in M1

| File | Source of Truth |
|------|-----------------|
| `app.json` | `docs/08-android-platform-spec.md` §2 (permissions, plugins) |
| `tailwind.config.js` | NativeWind v4 config + `colors.ts` |
| `tsconfig.json` | Strict mode, path aliases (`@/*`, `src/*`) |
| `drizzle.config.ts` | Output to `src/db/migrations`, dialect sqlite |
| `src/db/client.ts` | `docs/05-trd.md` §4.1 + PRAGMAs |
| `src/db/schema.ts` | `docs/06-data-schema.md` §2 (copy verbatim) |
| `src/styles/colors.ts` | `docs/04-ux-screen-spec.md` §1.1 |
| `app/_layout.tsx` | Providers: DB, Theme, NativeWind |
| `app/(tabs)/_layout.tsx` | 5 tabs, icons, labels |
| `package.json` | All deps from `docs/05-trd.md` §2 + `docs/08-android-platform-spec.md` |

---

## 🧪 Test This First (Before Moving to M2)

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npx eslint . --ext .ts,.tsx

# 3. Database verification
# In app code, run once:
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
const tables = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table'`);
console.log(tables.map(t => t.name).sort());
// Must show all 10 tables

# 4. Android build
npx expo run:android --variant=release
# Must produce working APK
```

---

## 📋 Next Milestone Preview (Do Not Start Yet)

**Milestone 2: Work Management, Timer & 2-Tap Resume**
- Project CRUD (`projectRepository.ts`)
- Pure rules: `calculateBucket()`, `calculateDailyTarget()` (`docs/03-rules-edge-cases.md` §1–2)
- Work screen: Buckets view (4 sections)
- Session timer widget: epoch-based, survives kill (`active_sessions` table)
- "Stopped at?" modal: type-aware inputs
- Project notes + YouTube deep-link (`docs/03-rules-edge-cases.md` §7)
- Forgot-timer guard (3hr → alert → 15min grace → auto-pause clamp)

---

## 🤖 Agent Instructions

1. **Read all 11 docs first** — do not start coding until you've read them
2. **Follow AGENTS.md rules strictly** — they are architectural laws
3. **Implement Milestone 1 completely** — verify every done criterion
4. **Commit after each step** — clean git history
5. **Stop and report** when M1 is done — do not proceed to M2 without confirmation

---

## 💡 Pro Tips for the Agent

- **NativeWind v4** uses CSS variables — define colors in `:root` in `global.css`, not `tailwind.config.js`
- **Expo Router v3** tabs: use `href` prop on `<Tab>` for deep linking later
- **Drizzle + expo-sqlite**: use `db.insert(table).values(...).run()` for writes, `db.select().from(table).all()` for reads
- **Migrations**: run `npx drizzle-kit studio` to inspect DB visually during dev
- **Android permissions**: add to `app.json` **before** `npx expo run:android` or prebuild
- **TypeScript strict**: enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`

---

**Ready to build. Start with Milestone 1. Report completion with verification logs.**