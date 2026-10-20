# 03. Business Rules & Edge Cases: Keel

This document outlines the strict deterministic business logic, calculation formulas, state transitions, and edge cases for Keel. All logic described here must be implemented as testable, pure TypeScript functions where possible.

---

## 1. Auto-Bucket Allocation Logic

Work items are dynamically grouped into four buckets based on their `deadline` field and current local time. Users cannot manually drag items between buckets; changing an item's deadline or snoozing automatically recalibrates its bucket.

### 1.1 Bucket Definitions

Let:
- $T_{\text{today}}$ be the user's current local calendar date (at `00:00:00.000`).
- $D$ be the project's deadline calendar date (at `00:00:00.000`).
- $\Delta_{\text{days}} = \text{differenceInCalendarDays}(D, T_{\text{today}})$.

```
   Overdue / Past         Today          Tomorrow         This Week                 Later
<----------------------|-----------|------------------|----------------|--------------------------->
   Delta < 0              Delta = 0       Delta = 1         2 <= Delta       Delta > days_to_sunday OR
   [TODAY (OVERDUE)]       [TODAY]        [TOMORROW]       <= days_to_sun    no deadline
```

### 1.2 Bucket Assignment Algorithm

```typescript
export type Bucket = 'today' | 'tomorrow' | 'this_week' | 'later';

export function calculateBucket(deadline: Date | null, referenceDate: Date = new Date()): Bucket {
  if (!deadline) {
    return 'later';
  }

  const today = startOfDay(referenceDate);
  const targetDate = startOfDay(deadline);
  const deltaDays = differenceInCalendarDays(targetDate, today);

  if (deltaDays <= 0) {
    // If deadline is today or in the past (overdue), it belongs in Today
    return 'today';
  }

  if (deltaDays === 1) {
    return 'tomorrow';
  }

  // Calculate days remaining until Sunday of current week (assuming week ends Sunday)
  const daysUntilEndOfWeek = differenceInCalendarDays(endOfWeek(today, { weekStartsOn: 1 }), today);

  if (deltaDays <= daysUntilEndOfWeek) {
    return 'this_week';
  }

  return 'later';
}
```

### 1.3 Edge Cases: Buckets
1. **Midnight Rollover**:
   - When local time passes `00:00:00`, items in `Tomorrow` automatically shift to `Today`. Items in `This Week` that are now 1 day away shift to `Tomorrow`.
   - *Implementation Rule*: UI listens to app foreground events (`AppState = 'active'`) and a local timer set to trigger at the next midnight boundary to recalculate bucket derivations.
2. **Overdue Projects**:
   - Projects with $\Delta_{\text{days}} < 0$ remain pinned to the top of `Today` with a visually distinctive "Overdue (N days)" badge. They never silently vanish.
3. **No Deadline Set**:
   - Any project without a set deadline is placed into the `Later` bucket by default.

---

## 2. Daily Target Auto-Calculation

For structured learning projects (`course`, `documentation`, `video`), Keel computes the daily quota required to meet the deadline on time.

### 2.1 Formula

Let:
- $U_{\text{total}}$ = Total units (lessons, pages, minutes).
- $U_{\text{completed}}$ = Completed units logged so far.
- $U_{\text{remaining}} = \max(0, U_{\text{total}} - U_{\text{completed}})$.
- $\Delta_{\text{days}} = \text{differenceInCalendarDays}(D, T_{\text{today}})$.

$$\text{Daily Target} = \begin{cases} 
0 & \text{if } U_{\text{remaining}} = 0 \\
U_{\text{remaining}} & \text{if } \Delta_{\text{days}} \le 0 \\
\left\lceil \frac{U_{\text{remaining}}}{\Delta_{\text{days}} + 1} \right\rceil & \text{if } \Delta_{\text{days}} \ge 1 
\end{cases}$$

*(Note: Adding $+1$ ensures the current day is included in the available working days).*

### 2.2 Edge Cases: Daily Targets
1. **Due Today ($\Delta_{\text{days}} = 0$)**:
   - The daily target equals all remaining units ($U_{\text{remaining}}$).
2. **Overdue ($\Delta_{\text{days}} < 0$)**:
   - Displays: *"Overdue: all remaining units [N]"*.
3. **Undefined Total Units ($U_{\text{total}} = \text{null}$)**:
   - Daily target badge is hidden. No arbitrary fallback number is shown.
4. **Completed Units Exceed Total Units ($U_{\text{completed}} \ge U_{\text{total}}$)**:
   - Target is 0; item triggers a prompt asking if user wishes to mark the project as `Completed`.

---

## 3. Slip Tracking & Delay Accountability

Keel enforces honest accounting of deferred work.

### 3.1 Slip Counter Trigger Rules
An item's `slip_count` increments by $+1$ if and only if:
1. The user manually extends the deadline to a later date.
2. The user uses the **Smart Snooze** action ("Move to Tomorrow" or "Move to Later").
3. The calendar date crosses midnight while the item remained in `Today` without being completed or worked on.

### 3.2 Days Late Formula
Upon marking a project status as `completed`:
$$\text{Days Late} = \max(0, \text{differenceInCalendarDays}(T_{\text{completion}}, D))$$

- If completed on or before deadline: $\text{Days Late} = 0$.
- If completed 4 days after deadline: $\text{Days Late} = 4$.
- If no deadline was ever set: $\text{Days Late} = 0$.

---

## 4. Habit Streaks & Rest-Day Freeze Logic

### 4.1 Frequency Types
1. **Daily**: Expected every calendar day.
2. **Weekdays**: Expected Monday through Friday.
3. **Custom Days**: Expected on specific days of the week (e.g., `[1, 3, 5]` for Mon/Wed/Fri).

### 4.2 Streak Calculation Algorithm
- Streak represents consecutive *scheduled* days that were either completed (`COMPLETED`) or protected by a streak freeze (`FROZEN`).
- Non-scheduled days (e.g. weekends for a weekday habit) do **not** break a streak and do not increment the count.

```typescript
export function computeHabitStreak(
  scheduledDaysOfWeek: number[], // e.g. [1,2,3,4,5]
  logs: Map<string, 'COMPLETED' | 'FROZEN'>, // key: 'YYYY-MM-DD'
  currentDate: Date = new Date()
): { currentStreak: number; bestStreak: number } {
  // Step backwards from yesterday (or today if already completed today)
  // Check continuity of COMPLETED or FROZEN on all scheduled dates
  // Return current contiguous streak and historical max contiguous streak
}
```

### 4.3 Rest-Day Freeze (Streak Freeze) Rules
1. **Allowance**: Each user is allocated exactly **2 streak freezes per calendar month**.
2. **Monthly Reset**: Freeze allowance resets to 2 at `00:00:00` on the 1st of each month. Freezes do not roll over or accumulate.
3. **Consumption Window**: A user can freeze a missed habit for **Yesterday** or **Today**. Freezes cannot be applied to dates older than 48 hours.
4. **Limit per Habit**: A habit cannot be frozen more than 2 consecutive scheduled days (to prevent false multi-week streaks).

---

## 5. Session Timer & Forgot-Timer Guard

### 5.1 Timestamp-Based Persistence
To survive app termination, battery optimization, or operating system kills:
- **Never store a running countdown/countup timer as an in-memory `setInterval` variable.**
- When user taps **Start**:
  - `started_at` = `Date.now()` (epoch milliseconds).
  - Saved immediately to local SQLite in `active_sessions`.
- When user views the screen:
  - Elapsed time = `accumulated_time + (Date.now() - started_at)`.
- When user taps **Pause**:
  - Session duration = `accumulated_time + (Date.now() - started_at)`.
  - Open "Stopped at?" dialog.
  - Reset `started_at = null`, save finished session record to `sessions` table.

### 5.2 Forgot-Timer Guard (3-Hour Rule)
- **Threshold**: 3 continuous hours ($10,800,000\text{ ms}$).
- **Mechanism**:
  - At 3 hours, a local high-priority notification fires: *"Timer running for 3 hours on [Project]. Still working?"*.
  - A 15-minute grace period countdown begins.
  - If the user responds: they can tap "Keep going" (extends threshold by 1 hour) or "Pause now".
  - If no response after 15 minutes:
    - The timer is automatically paused by the background service.
    - Duration is clamped exactly to the 3-hour mark ($180\text{ min}$) to prevent corrupting time metrics.
    - An event note `auto_paused_by_guard: true` is saved in the session.

---

## 6. Journal Hard Lock Rules

### 6.1 Strict 10-Minute Lock
- **Duration**: Exactly $600$ seconds.
- **Entry Trigger**: User explicitly taps "Start Daily Journal". A confirmation dialog warns:
  > *"You are entering a 10-minute locked session. Leaving the app resets the clock. Draft is autosaved."*

### 6.2 Lock Enforcement Hierarchy
1. **Hardware / Gesture Back Button**:
   - `BackHandler.addEventListener('hardwareBackPress', () => true)` blocks back navigation.
2. **Screen Always On**:
   - `expo-keep-awake` prevents phone display from timing out or locking during the 10 minutes.
3. **Screen Pinning (`startLockTask`)**:
   - Native Android screen pinning prompt locks Keel into kiosk mode, disabling Home, Overview/Recents, and Status Bar gestures.
4. **The Reset-on-Leave Backstop**:
   - If the user forcibly switches apps, takes an incoming phone call, or forces the app to the background:
     - React Native `AppState` transitions from `active` to `background`/`inactive`.
     - **Action**: The 10-minute session timer **immediately resets back to 600 seconds**.
     - **Autosave Safety**: Text entered is preserved in SQLite `journal_drafts` so writing is never lost. The penalty is purely temporal: the student must restart and complete a full, uninterrupted 10-minute block.

### 6.3 Weekly Sunday Journal
- Unlocks on Sunday at `00:00:00` local time and remains accessible until Monday `04:00:00`.
- Session length: 20 minutes ($1,200$ seconds).
- Shares identical hard lock and reset-on-leave mechanics as the daily journal.

---

## 7. YouTube Deep-Link Parsing & Format Rules

Notes within projects support timestamp annotations that parse into deep-links.

### 7.1 Accepted Formats
- `MM:SS` (e.g. `12:40` → $12 \times 60 + 40 = 760\text{ seconds}$).
- `HH:MM:SS` (e.g. `01:15:30` → $3600 + 15 \times 60 + 30 = 4530\text{ seconds}$).

### 7.2 URL Construction
If the parent project's link matches YouTube (`youtube.com/watch?v=...` or `youtu.be/...`):
- Keel appends or replaces the query parameter `t=<seconds>s`.
- Example: `https://youtu.be/dQw4w9WgXcQ?t=760s`.
- Invokes `Linking.openURL(url)` which natively opens the YouTube Android application directly at that timestamp.
