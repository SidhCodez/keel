# 07. Application Architecture & Folder Structure: Keel

## 1. Architectural Overview & Design Patterns

Keel follows a modular, unidirectional data flow architecture designed for high testability and strict offline reliability.

```mermaid
flowchart TD
    subgraph Presentation_Layer [Presentation Layer (React Native + NativeWind)]
        Screens[Expo Router Screens / Tabs]
        Components[Reusable UI Atoms & Modals]
    end

    subgraph State_Layer [State Management (Zustand)]
        TimerStore[TimerStore (Active Session)]
        JournalStore[JournalStore (Lock State & Draft)]
        UIStore[UIStore (Modals & Active Filters)]
    end

    subgraph Logic_Layer [Pure Business Rules (TypeScript)]
        BucketRules[Bucket Allocation Engine]
        StreakRules[Streak & Freeze Evaluator]
        TargetRules[Daily Target Calculator]
        SlipRules[Slip & Delay Tracker]
    end

    subgraph Service_Layer [Platform & Hardware Services]
        NotifService[Notification & Alarm Service]
        DeviceService[KeepAwake & LockTask Service]
        BackupService[JSON Export / Import Service]
    end

    subgraph Persistence_Layer [Data Access Layer]
        Drizzle[Drizzle ORM Queries]
        SQLite[(Local SQLite: keel.db)]
    end

    Screens --> TimerStore
    Screens --> JournalStore
    Screens --> UIStore
    TimerStore --> Logic_Layer
    TimerStore --> Drizzle
    JournalStore --> DeviceService
    JournalStore --> Drizzle
    Screens --> Logic_Layer
    Screens --> Drizzle
    Drizzle --> SQLite
    NotifService --> Screens
```

---

## 2. Directory & File Organization

The project adheres to the standard Expo Router file convention with clean internal domain grouping:

```
keel/
├── app/                              # Expo Router file-based routes
│   ├── (tabs)/                       # Bottom tabs navigator group
│   │   ├── _layout.tsx               # 5-tab layout definition
│   │   ├── index.tsx                 # Redirects to /today
│   │   ├── today.tsx                 # Tab 1: Today cockpit
│   │   ├── habits.tsx                # Tab 2: Habit routines
│   │   ├── work/                     # Tab 3: Work & projects
│   │   │   ├── index.tsx             # Buckets & Calendar views
│   │   │   └── [id].tsx              # Project detail & session timer
│   │   ├── journal.tsx               # Tab 4: 10-min locked journal
│   │   └── insights.tsx              # Tab 5: Habits & Work insights
│   ├── modal/
│   │   ├── quick-capture.tsx         # Fast 1-line item capture
│   │   ├── stopped-at.tsx            # Resume marker capture
│   │   └── habit-form.tsx            # Add / edit habit sheet
│   └── _layout.tsx                   # Root layout, DB provider, themes
├── src/
│   ├── components/                   # UI presentation components
│   │   ├── common/                   # Buttons, Badges, Checkboxes, Inputs
│   │   ├── today/                    # ContinueCard, PendingHabitList
│   │   ├── habits/                   # HabitCard, StreakFlame, FreezeBadge
│   │   ├── work/                     # BucketSection, ProjectCard, TimerWidget
│   │   ├── journal/                  # LockCountdown, DistractionFreeEditor
│   │   └── charts/                   # Pure SVG Heatmap, CalendarTimelineBar
│   ├── db/                           # Database & ORM
│   │   ├── client.ts                 # expo-sqlite initialization & PRAGMAs
│   │   ├── schema.ts                 # Drizzle table definitions
│   │   ├── migrations/               # SQL migration files
│   │   └── repositories/             # Typed DB access methods
│   │       ├── habitRepository.ts
│   │       ├── projectRepository.ts
│   │       ├── sessionRepository.ts
│   │       └── journalRepository.ts
│   ├── rules/                        # PURE business logic functions (100% testable)
│   │   ├── buckets.ts                # Date diff to bucket mapper
│   │   ├── streaks.ts                # Habit streak & freeze calculations
│   │   ├── targets.ts                # Daily quota formula
│   │   ├── slips.ts                  # Slip count & days late evaluator
│   │   └── youtube.ts                # Timestamp URL parser & deep-linker
│   ├── services/                     # Device hardware & OS capabilities
│   │   ├── notifications.ts          # Nudge, Alarm, Escalate handlers
│   │   ├── screenLock.ts             # BackHandler, KeepAwake, LockTask
│   │   └── backup.ts                 # JSON file export / import / Zod parse
│   ├── stores/                       # Zustand client state stores
│   │   ├── timerStore.ts             # Active session state & guard
│   │   ├── journalStore.ts           # Lock timer & draft synchronization
│   │   └── uiStore.ts                # Active view mode, sheets
│   ├── styles/                       # Design tokens & Tailwind theme
│   │   └── colors.ts
│   └── types/                        # Global TypeScript interfaces
├── docs/                             # Comprehensive project documentation
├── AGENTS.md                         # Rules and context for AI coding agents
├── app.json                          # Expo configuration & Android permissions
├── package.json
├── tailwind.config.js                # NativeWind configuration
└── tsconfig.json
```

---

## 3. State Management Strategy (Zustand Stores)

### 3.1 Timer Store (`timerStore.ts`)
Manages the active running session without reliance on UI re-render intervals:
```typescript
interface TimerState {
  activeProjectId: string | null;
  startedAt: number | null; // Epoch ms
  elapsedMs: number;
  isGuardAlertVisible: boolean;
  
  start: (projectId: string) => Promise<void>;
  pause: () => Promise<{ durationSeconds: number }>;
  tick: () => void; // Synchronizes elapsedMs with Date.now() - startedAt
  dismissGuard: (continueWorking: boolean) => void;
}
```

### 3.2 Journal Store (`journalStore.ts`)
Controls the strict 10-minute locked environment:
```typescript
interface JournalState {
  isLocked: boolean;
  secondsRemaining: number; // Starts at 600
  draftContent: string;
  interruptionPenaltyCount: number;

  startSession: (type: 'daily' | 'weekly') => void;
  updateDraft: (text: string) => void;
  handleInterruption: () => void; // Resets secondsRemaining to 600
  completeSession: () => Promise<void>;
}
```

---

## 4. Lifecycle & Real-Time Synchronization

1. **Midnight Boundary Transition**:
   - The app mounts a `MidnightWatcher` hook that calculates milliseconds until the next local `00:00:00`.
   - Upon trigger, it invalidates cached bucket queries, reallocates Tomorrow items to Today, and schedules the next midnight tick.
2. **AppState Lifecycle Observer**:
   - Listens to React Native `AppState` changes (`active` ↔ `background`).
   - When returning to `active`:
     - Recalculates live timer duration from `Date.now() - startedAt`.
     - Checks if the timer exceeded the 3-hour forgot-timer threshold while backgrounded and clamps accordingly.
     - Checks if a journal lock session was breached.
3. **Database Transactions**:
   - Multi-step operations (e.g. pausing a timer, saving a session record, and updating the project's `resume_marker` and `status`) are executed within an atomic SQLite transaction via `db.transaction()`.
