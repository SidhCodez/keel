# Keel: MVP Spec

**Single-user, phone-first PWA. Habits + Work + Journal in one minimal app.**

**USP:** Pick up exactly where you stopped, and see honestly where you slipped.

---

## 1. Navigation (bottom bar, 5 tabs)

| Tab | Job |
|---|---|
| **Today** | Two sections: *Habits pending* and *Work pending*. "Continue where you left off" card on top. Quick capture. |
| **Habits** | Recurring routines (gym, diet, jogging, basketball, any activity) |
| **Work** | Projects: courses, videos, documentation, tasks, brainstorms |
| **Journal** | Daily (10 min, locked) and Weekly (Sunday) |
| **Insights** | Two separate sections: Habits and Work |

---

## 2. Today tab

- Section 1: **Habits pending today**
- Section 2: **Work pending today** (items whose deadline puts them in Today)
- **Continue card**: last in-progress project with its resume marker, one tap to open the link
- **Quick capture**: one-line add, fill details later
- Each work item shows its **daily target** (see 3.7)

---

## 3. Work tab

Everything is a **Project**. Types: course, video, documentation, task, brainstorm.

### 3.1 Fields
| Field | Required |
|---|---|
| Title | yes |
| Type | yes |
| Link | optional |
| Description | optional |
| Deadline | optional |
| Status: Not started / In progress / Done | auto |

### 3.2 Timer
- **Start** begins a work session. **Pause** ends it for the day.
- On Pause, app asks **"Stopped at?"**, input depends on type:
  - Video: timestamp (12:40)
  - Documentation / book: page or section
  - Course: lesson number
  - Project / task: short note
- Total time logged across all sessions.

### 3.3 Notes (inside project only)
- Notes live only under their project. No global notes.
- Optional timestamp per note, e.g. `12:40 – explains hooks`.

### 3.4 Auto-buckets from deadline
Today / Tomorrow / This week / Later. No manual dragging. Deadline decides.

### 3.5 Slip tracking
- Times pushed to a later bucket
- Days late on completion

### 3.6 Calendar view
- Each project shown as a bar from **start date to finish date**
- Color-coded tags (course / video / project / doc)
- Tap a bar: time spent, sessions, days late

### 3.7 Daily target auto-calc
Course with 20 lessons, 5 days to deadline → "4 lessons/day". Same for pages and videos.

### 3.8 Timestamp deep-link
Tap a note like `12:40` → opens the YouTube video at that time.

### 3.9 Forgot-timer guard
Timer running 3 hours → "Still working?" prompt. No reply → auto-pause. Keeps stats honest.

---

## 4. Habits tab

- Add: name, repeat (daily / weekdays / custom), reminder time
- Daily check-off
- Streak and best streak
- **Rest day / streak freeze**: 1-2 per month, so sickness or travel doesn't kill a streak
- Day-wise routine view
- Stats: weekly %, monthly heatmap, missed days

---

## 5. Journal tab

### Daily journal
- **10 minutes, hard lock.** Once started, cannot exit until the timer ends.
- Fullscreen, back button blocked, draft autosaved.
- If user leaves mid-session: session **resets**.

### Weekly journal
- **Sunday only**, starts automatically via notification that opens the locked screen.
- Length: TBD (suggested 20 min).

> **Technical limit:** a PWA cannot block the home button or app switching, and cannot force-open itself. The lock is enforced by fullscreen + back-button block + reset-on-leave + a notification that opens straight into the journal.

---

## 6. Insights tab

### Habits
Streaks, completion %, heatmap, best and worst habits.

### Work
Time per project, time per day/week, on-time %, days late, completed vs planned, average time per course.

---

## 7. Reminders (3 types)

| Type | Behavior |
|---|---|
| **Nudge** | Soft notification |
| **Alarm** | Rings until dismissed |
| **Escalate** | Soft, then firmer, then alarm if ignored |

Snooze moves the item to a later bucket, not just +10 minutes.

---

## 8. Data model

- `Habit` + `HabitLog`
- `Project` + `Session` (start, end) + `Note` (text, timestamp) + `Marker` (resume position)
- `Journal` (type, text, duration, date)

---

## 9. Stack

PWA, vanilla JS or React, local-first (IndexedDB), optional Supabase backup. No login (single user).

---

## 10. Roadmap (~7 weeks)

| Week | Output |
|---|---|
| 1 | Wireframes: Today, Project page, Journal lock, Insights |
| 2 | Work tab: projects, deadlines, buckets, resume marker, notes, daily target |
| 3 | Timer, sessions, forgot-timer guard, calendar bars |
| 4 | Habits: repeats, streaks, check-offs, streak freeze |
| 5 | Journal: daily lock, weekly Sunday |
| 6 | Insights: both sections, slip stats |
| 7 | Reminders (3 types), PWA install, polish |

---

## 11. After MVP

- Sunday weekly review (auto summary after weekly journal)
- Habit linked to project (habit auto-checks when work timer hits target)
- Journal template: one win, one slip, one plan for tomorrow
- Course checklist with progress %
- Global search across notes and timestamps
- Backup / export (JSON)

## 12. Not building

Collaboration, nested pages, rich blocks, databases/relations, AI, widgets, themes, Pomodoro, sharing.

---

## 13. Success check

Add a YouTube course, close the app, return next day, reach the exact stopping point in **2 taps**.

## 14. Open decisions

- Weekly journal length and Sunday start time
- Streak freeze: confirm yes/no and how many per month
