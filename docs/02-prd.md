# 02. Product Requirements Document (PRD): Keel

## 1. Product Summary & Goal

- **App Name**: Keel
- **Tagline**: *Pick up exactly where you stopped, and see honestly where you slipped.*
- **Target Platform**: Android Native (React Native + Expo)
- **Architecture**: Single-user, 100% offline-first, local SQLite storage
- **Core Value**: Unifying project tracking (with precise stopping markers), habit tracking (with streaks and heatmaps), and locked journaling into a distraction-free mobile tool.

---

## 2. In-Scope vs. Out-of-Scope

### 2.1 In-Scope (MVP)
1. **5 Bottom Tabs**: Today, Habits, Work, Journal, Insights.
2. **Work Management**: Projects classified by type (`course`, `video`, `documentation`, `task`, `brainstorm`).
3. **Session Timer & Stopping Markers**: Start/pause timer with a mandatory "Stopped at?" prompt capturing type-specific resume positions.
4. **Project-Scoped Notes & Timestamp Deep-Linking**: Notes exist strictly inside projects; timestamps (e.g., `14:20`) open video links at the exact second.
5. **Auto-Buckets by Deadline**: Deterministic grouping into `Today`, `Tomorrow`, `This Week`, and `Later`. No manual card drag.
6. **Accountability & Slip Tracking**: Push counters tracking when items slip between buckets, and days late tracking upon completion.
7. **Daily Target Calculations**: Auto-calculating units per day needed to finish projects by deadline.
8. **Visual Project Calendar Bar Chart**: Gantt-style timeline bars for all active and completed projects.
9. **Habit Tracking**: Recurrence schedules (daily, weekdays, custom days), streak calculation, best streak, and monthly rest-day freezes (1–2 per month).
10. **Strict Journal Lock**: 10-minute daily locked writing session (screen pinning/back-block, autosave, reset on exit) and Sunday weekly reflection.
11. **Dual Insights**: Separate analytical views for Habits (heatmaps, completion %) and Work (hours logged, slip rate, on-time %).
12. **Tri-Tier Reminders**: Nudge (soft notification), Alarm (persistent audio/dismiss intent), and Escalate (nudge escalated to alarm).
13. **Local JSON Backup & Restore**: Full database export and import to device storage.

### 2.2 Out-of-Scope (Explicitly Excluded)
- User authentication, login screens, or cloud user profiles.
- Remote server databases (Firebase, Supabase sync deferred to post-MVP).
- Collaboration, sharing, team workspaces, or public links.
- Rich-text markdown block editors, nested sub-pages, or relational databases.
- In-app AI chat, summarization, or LLM integrations.
- Home screen widgets (post-MVP consideration).
- Multiple themes or decorative custom styling (standard clean dark-mode OLED theme only).
- Generic Pomodoro cycle counters (replaced by honest start/pause session logging).

---

## 3. Tab-by-Tab Functional Requirements

### 3.1 Tab 1: Today
The central cockpit of the user's day.

```
+-------------------------------------------------------+
|  KEEL                                [Quick Capture +] |
|                                                       |
|  [ CONTINUE WHERE YOU LEFT OFF ]                      |
|  * Advanced React Patterns (Course)                   |
|  * Stopped at: Lesson 14 - Compound Components        |
|  * [ RESUME (Opens Link & Starts Timer) ]             |
|                                                       |
|  -- HABITS PENDING TODAY (3) -----------------------  |
|  [ ] Morning Hydration (1L)                           |
|  [ ] Gym - Push Day                                   |
|  [ ] Read Clean Code (20 mins)                        |
|                                                       |
|  -- WORK PENDING TODAY (2) -------------------------  |
|  [ ] Distributed Systems Paper (Target: 8 pages)      |
|  [ ] Auth Refactor (Deadline: Today)                  |
+-------------------------------------------------------+
```

- **Continue Card (Hero Component)**:
  - Displays the most recently active in-progress project.
  - Shows current resume marker ("Stopped at: ...").
  - Single primary button: triggers external link open (if URL exists) and initiates session timer.
- **Habits Pending Section**:
  - Lists all habits scheduled for the current day that are not yet checked off.
  - 1-tap completion checkmark updates streak immediately with haptic feedback.
- **Work Pending Section**:
  - Displays all projects with deadlines falling on or before today (`Today` or `Overdue`).
  - Displays auto-calculated daily target badge (e.g., "Target: 3 lessons").
- **Quick Capture Action**:
  - Floating or header "+" action: allows entering a single line title to instantly create a project in the `Later` bucket for later refinement.

---

### 3.2 Tab 2: Habits
Dedicated routine tracking ensuring daily discipline.

- **Habit Attributes**:
  - Name (required)
  - Frequency: Daily, Weekdays (Mon-Fri), or Custom Days (e.g., Mon, Wed, Fri)
  - Reminder Time (optional)
  - Color / Icon tag
- **Interactions**:
  - Check-off for current date.
  - Streak computation: current consecutive streak, all-time best streak.
  - Streak Freeze / Rest Day: Users receive up to 2 freeze allowances per calendar month. Tapping "Freeze" preserves streak on missed days (e.g. sickness, travel).
- **Views**:
  - Active routine checklist.
  - Mini-stats header: weekly completion percentage and 30-day mini activity row.

---

### 3.3 Tab 3: Work
The project and learning management hub.

- **Project Entities & Types**:
  1. `course`: Tracks lessons / modules (e.g. "Lesson 12 of 30").
  2. `video`: Tracks video timestamps (e.g. `24:15`).
  3. `documentation`: Tracks pages or chapter sections (e.g. `Page 140` or `Sec 4.2`).
  4. `task`: General coding or execution tasks with status notes.
  5. `brainstorm`: Open exploratory learning items.
- **Project Fields**:
  - `title` (string, required)
  - `type` (enum, required)
  - `link` (URL string, optional)
  - `description` (text, optional)
  - `deadline` (ISO date string, optional)
  - `total_units` (integer, optional, e.g. 45 lessons)
  - `completed_units` (integer, default 0)
  - `status` (`not_started`, `in_progress`, `completed`, auto-derived from sessions)
- **Work Timer & Session Logging**:
  - **Start**: Logs `started_at` timestamp in local SQLite.
  - **Pause**: Halts session, calculates elapsed duration, and displays the **"Stopped at?"** modal.
  - **"Stopped at?" Modal**:
    - Input dynamically adapts to type:
      - Video: Timestamp formatted input (`MM:SS` or `HH:MM:SS`).
      - Documentation: Page number or chapter string.
      - Course: Current lesson number (updates `completed_units`).
      - Task/Brainstorm: Short freeform summary text.
    - Saves into project's `resume_marker` field.
- **Project Notes**:
  - Scoped strictly to the parent project (no disconnected global notes).
  - Each note entry supports an optional timestamp string.
  - **Deep-Link Behavior**: If the parent project has a YouTube link, tapping a `14:20` timestamp opens the YouTube app/browser at `?t=860s`.
- **Auto-Buckets (No Manual Dragging)**:
  - `Today`: Deadline is today or in the past (overdue).
  - `Tomorrow`: Deadline is tomorrow.
  - `This Week`: Deadline is between 2 days away and the end of the current calendar week.
  - `Later`: Deadline is beyond this week or unset.
- **Slip Tracking**:
  - Keel tracks how many times a task shifts from an earlier bucket to a later bucket (via deadline modification or snooze).
  - On completion, Keel records `days_late = completion_date - deadline_date`.
- **Daily Target Calculation**:
  - Formula: $\text{Daily Target} = \lceil \frac{\text{Remaining Units}}{\text{Days Remaining}} \rceil$.
  - Displayed inline on project cards (e.g., "5 lessons/day").
- **Calendar View**:
  - Horizontal timeline / Gantt bars showing active projects spanning `start_date` to `deadline` or `completion_date`.
  - Color-coded by project type tag.
  - Tapping a bar presents a summary card: total time logged, number of sessions, slip count, days late.
- **Forgot-Timer Guard**:
  - If a timer runs continuously for 3 hours, a prominent notification and alert prompt triggers: *"Still working on [Project]?"*.
  - If no user response is received within 15 minutes, the timer auto-pauses, recording the end time as the 3-hour mark, preventing accidental 20-hour session records.

---

### 3.4 Tab 4: Journal
Enforcing focused, distraction-free written reflection.

- **Daily Journal (10-Minute Hard Lock)**:
  - Duration: Exactly 10 minutes (600 seconds).
  - Hard constraint: Once started, the timer cannot be paused or casually dismissed.
  - OS-Level Restraints:
    - Android back-button disabled.
    - Keep screen awake enabled (`expo-keep-awake`).
    - Screen pinning (`startLockTask`) triggered on native build.
  - **Reset-on-Leave Penalty**:
    - If the user backgrounds the app, switches tasks, or leaves before 600 seconds elapse, the session is **aborted and the timer resets to 10:00**.
    - The draft text is autosaved to SQLite so writing is never lost, but the user must complete a full continuous 10-minute block to earn a completed journal entry.
- **Weekly Journal (Sunday Reflection)**:
  - Automatically unlocked on Sundays.
  - Duration: 20 minutes (configurable).
  - Focuses on reviewing the past 7 days of work, habit consistency, and slips.

---

### 3.5 Tab 5: Insights
Comprehensive, honest analytics separated cleanly into two domains.

- **Segmented Control**: [ Habits Insights | Work Insights ]
- **Habits Insights**:
  - Current streak and all-time longest streak per habit.
  - 90-day GitHub-style contribution heatmap (color intensity mapped to habit completion ratio).
  - Overall weekly completion percentage.
  - Best performing habits vs. worst slipping habits.
- **Work Insights**:
  - Total focused hours logged (daily, weekly, all-time).
  - Distribution breakdown by project type (pie/donut or stacked bar).
  - On-time completion rate (% finished on or before deadline).
  - Slip metrics: total bucket push count across all projects.
  - Days late histogram / average delay per completed project.
  - Average time invested to finish a course or book.

---

## 4. Reminders & Notification Architecture

### 4.1 Tri-Tier Reminder Types
Users configure habits or projects with one of three reminder tiers:

1. **Nudge (Low Friction)**:
   - Standard Android notification with subtle sound and vibration.
   - Ideal for routine habits (e.g., water, stretch).
2. **Alarm (High Urgency)**:
   - Full exact alarm utilizing Android's `USE_EXACT_ALARM` / `SCHEDULE_EXACT_ALARM`.
   - Plays persistent audio and vibrates continuously until explicitly dismissed by the user.
   - Ideal for strict morning routines or hard project deadlines.
3. **Escalate (Adaptive)**:
   - Stage 1: Sends a gentle Nudge notification at the scheduled time.
   - Stage 2: If unacknowledged after 15 minutes, sends a high-priority vibration notification.
   - Stage 3: If still unacknowledged after an additional 15 minutes, triggers a full ringing Alarm.

### 4.2 Smart Snooze Semantics
- In standard apps, "Snooze" delays an alarm by 10 minutes.
- In Keel, snoozing a project reminder can be chosen as **"Move to Tomorrow"** or **"Move to Next Bucket"**, immediately logging an explicit slip event to preserve behavioral accountability.

---

## 5. Non-Functional Requirements & Constraints

1. **Performance**: Cold start under 1.5 seconds; 60fps scrolling across all list views.
2. **Storage Footprint**: SQLite database and bundle size under 35 MB total APK size.
3. **Battery Optimization**: Timer operates via start/stop timestamps; no wake locks or polling loops while app is idle or in background.
4. **Data Privacy**: Zero telemetric tracking; 100% of user data remains on the physical device.
