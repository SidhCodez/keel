# Keel: Problem & Idea Breakdown

## 1. Problem

Students juggle goals (finish a YouTube course, read a documentation guide, complete a project) across several apps. No single app tells them where they stopped, how long they spent, or how often they slipped.

### Problems faced

1. **No clear tracking of progress.** No visible record of work decided to be finished, whether by deadline or otherwise.
2. **Apps serve different student expectations.** One has statistics, another a heatmap, another only a date-wise timeline. The student's goal is always the same: complete something specific (a course, a video, a guide, a project).
3. **Notion databases come close but fall short.** URL property, time tracking, start/end date formulas work fine, but students expect more built in without building it themselves.
4. **Reminders are weak.** Most apps offer only a notification or a simple alarm. Nothing adapts when you ignore it.
5. **Trello has Kanban but no delay data.** It splits tasks into categories well, but gives no stats on how late or how often tasks were missed.
6. **App-hopping is exhausting.** Switching between Trello, Notion and HabitNow to manage one day feels heavy.

---

## 2. Reference: what existing apps do

| App | Strength | Gap for this user |
|---|---|---|
| **Notion** | Flexible pages, databases, link + date properties | Stores the link but not the *stopping point*. Heavy setup. |
| **Trello** | Visual Kanban buckets | No delay or missed-task statistics |
| **HabitNow** | Habits, streaks, reminders, timers | No content: no video, page, or project context |

---

## 3. Idea

One minimal app combining the three:

- From Notion: **content** (link, description, notes) per item
- From Trello: **buckets** (Today / Tomorrow / This week / Later), automated by deadline
- From HabitNow: **habits, streaks, statistics**

**USP:** Pick up exactly where you stopped, and see honestly where you slipped.

---

## 4. Clean user need breakdown

### What the user needs solved
1. Add a task or course with a title, optional link, optional description.
2. Know **where I stopped** (timestamp for video, page for book/doc, lesson for course) and resume in 2 taps.
3. Track **how long** each project actually took, with start/pause timer.
4. See **today's work** and **today's habits** separately, without opening three apps.
5. Keep **habits** (gym, diet, jogging, basketball) as day-wise routines with streaks.
6. See **deadlines** drive the buckets automatically.
7. See **insights**: habits and work as two separate sections.
8. Build a **journaling discipline**: 10 min daily (locked), weekly on Sunday.
9. Get **smarter reminders** than alarm or notification.

### User flow
1. Open app → **Today** shows Habits pending + Work pending + Continue card.
2. Tap a work item → open link → press **Start**.
3. Finish for the day → press **Pause** → enter "Stopped at" (timestamp / page / lesson).
4. Tick off habits as done.
5. Evening: **Journal** opens, 10-minute locked session. Sunday: weekly journal.
6. Check **Insights** to see time spent, streaks, and slips.

### Principles
- Single user, phone-first
- Minimal: few screens, few taps
- Honest data: forgot-timer guard, slip tracking
- Local-first, no login

---

## 5. Constraints

- A PWA cannot block the home button or force-open itself. The journal lock relies on fullscreen, back-button block, reset-on-leave, and a notification that opens into the locked screen.
- Scope is kept small: no collaboration, rich blocks, AI, widgets or themes.

See `Keel-MVP.md` for the full feature spec and roadmap.
