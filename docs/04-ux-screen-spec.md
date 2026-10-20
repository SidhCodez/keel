# 04. UX Screen Specifications & Design System: Keel

## 1. Design System & Tokens

Keel utilizes a distraction-free, high-contrast, OLED-optimized dark theme designed for single-handed mobile efficiency. All touch targets meet or exceed Android's 48x48 dp accessibility standard.

### 1.1 Color Palette

```
Surface & Backgrounds:
  --bg-primary:      #000000  (Pure OLED Black)
  --bg-card:         #121214  (Deep charcoal for elevated cards)
  --bg-subtle:       #1C1C20  (Secondary surfaces, input backgrounds)
  --border-subtle:   #27272A  (Zinc-800 borders, hair-line dividers)
  --border-focus:    #38BDF8  (Sky-400 focus highlight)

Typography:
  --text-primary:    #FFFFFF  (Pure white for titles and primary labels)
  --text-secondary:  #A1A1AA  (Zinc-400 for metadata, timestamps, subtitles)
  --text-muted:      #71717A  (Zinc-500 for inactive tabs, placeholders)

Brand & Accents:
  --brand-primary:   #38BDF8  (Sky blue - primary CTA and focus actions)
  --brand-success:   #22C55E  (Green - habit completions, on-time indicators)
  --brand-warning:   #F59E0B  (Amber - upcoming deadlines, streak freezes)
  --brand-danger:    #EF4444  (Red - overdue badges, slip counts, journal alert)

Project Type Tags:
  --tag-course:      #3B82F6  (Blue)
  --tag-video:       #EF4444  (Red / YouTube)
  --tag-doc:         #10B981  (Emerald green)
  --tag-task:        #F59E0B  (Amber)
  --tag-brainstorm:  #8B5CF6  (Purple)
```

### 1.2 Typography
- **Font Family**: System default (Roboto on Android) with tabular numbers enabled for timers and dates.
- **Display**: 28sp, Bold, Line Height 34sp
- **Heading 1**: 22sp, SemiBold, Line Height 28sp
- **Heading 2**: 18sp, Medium, Line Height 24sp
- **Body Regular**: 15sp, Regular, Line Height 22sp
- **Caption / Mono**: 13sp, Medium, Tabular Numerals (for `12:40`, counters, targets)

---

## 2. Global Navigation Architecture

Keel uses a fixed bottom tab bar with 5 destinations. The bottom bar is persistently visible across primary views, but **strictly hidden** when the Journal Lock screen is active.

```
+-------------------------------------------------------+
|  [Today]   [Habits]   [Work]   [Journal]   [Insights] |
+-------------------------------------------------------+
```

---

## 3. Screen Specifications

### 3.1 Tab 1: Today Screen (`/today`)

#### Visual Hierarchy
1. **Header Bar**:
   - Left: Date string (e.g. `Tue, Oct 20`) + App title ("Keel").
   - Right: Quick Capture button (`+`).
2. **Continue Where You Left Off (Hero Card)**:
   - Elevated card (`#121214`) with a glowing left border matching the project type tag.
   - Project title & Type Badge.
   - "Stopped at: [Resume Marker]" in bold monospace.
   - Primary Action Button: "Resume Work" (one tap opens URL if attached and starts session timer).
3. **Section: Habits Pending Today**:
   - Header with count: `Habits (3 pending)`.
   - List items: Large touch checkbox (48x48dp), habit title, frequency hint, current streak badge (`🔥 12`).
   - Tapping checkbox triggers micro-vibration and strikes through item.
4. **Section: Work Pending Today**:
   - Header with count: `Work (2 items)`.
   - Cards display: Title, Deadline status (e.g. `Due Today` or `Overdue by 2d`), Daily Target badge (`3 lessons/day`).
   - Tap card opens Project Detail Sheet.

#### Empty States
- When all habits are completed: Displays celebratory banner: *"All habits checked for today! Great rhythm."*
- When no work is due today: Displays: *"No work due today. Check the Work tab to pull from 'Tomorrow' or 'This Week'."*

---

### 3.2 Tab 2: Habits Screen (`/habits`)

#### Layout & Interactions
1. **Top Metric Bar**:
   - Monthly Streak Freezes remaining: `❄️ 2 / 2 freezes available this month`.
   - Weekly consistency bar: Mini 7-day pill indicator showing completed days.
2. **Habit List (Grouped by Time of Day or Custom Order)**:
   - Card layout:
     - Checkbox on left.
     - Title and reminder time (`⏰ 07:30 AM`).
     - Current streak pill (`🔥 8 days`) and best streak indicator (`Best: 24`).
     - Overflow menu (`...`): Edit, Delete, Freeze missed day.
3. **Floating Action Button (FAB)**:
   - Positioned bottom-right: `+ Add Habit`.
4. **Add / Edit Habit Modal**:
   - Form fields:
     - Name (text input)
     - Repeat mode selector (Pills: `Daily`, `Weekdays`, `Custom Days`).
     - If Custom Days selected: Day picker row (`M`, `T`, `W`, `T`, `F`, `S`, `S`).
     - Reminder time picker with reminder type selector (`Nudge`, `Alarm`, `Escalate`).

---

### 3.3 Tab 3: Work Screen (`/work`)

#### View Mode Switcher
Header contains a segmented toggle:
- `[ Buckets View | Calendar View ]`

#### 3.3.1 Buckets View Mode
Four vertical expandable accordions or section lists:
1. **Today & Overdue**: Urgent red/amber accents.
2. **Tomorrow**: Neutral gray headers.
3. **This Week**: Grouped by days remaining until Sunday.
4. **Later**: Backlog of long-term projects or items without deadlines.

#### 3.3.2 Project Card Component
- Type tag pill (e.g. `[COURSE]`, `[VIDEO]`, `[DOC]`).
- Title.
- Resume marker badge: `📌 Stopped at: Lesson 14`.
- Progress indicator: `14 / 30 lessons (46%)`.
- Daily target chip: `Target: 3/day`.
- Slip indicator (if slipped > 0): `⚠️ Slipped 2x`.

#### 3.3.3 Project Detail View (`/work/[id]`)
- **Header**: Title, Edit button, Link button (with external icon to open in browser/YouTube).
- **Session Control Bar**:
  - Live session timer display: `00:42:15`.
  - Prominent Start / Pause button.
- **"Stopped at?" Modal (Triggered on Pause)**:
  - Appears automatically upon tapping "Pause".
  - Type-aware input prompt:
    - If `video`: Label = *"Enter video timestamp (e.g. 14:32)"*.
    - If `course`: Label = *"Current lesson number (e.g. Lesson 15)"*.
    - If `documentation`: Label = *"Current page or chapter (e.g. p. 84)"*.
    - If `task`/`brainstorm`: Label = *"Where did you leave off?"*.
  - "Save & Finish Session" button.
- **Notes Section**:
  - List of notes chronologically with optional timestamp chips.
  - Tapping a timestamp chip (e.g. `12:40`) triggers deep link opening parent video at `&t=760s`.
  - "+ Add Note" input with inline timestamp toggle.

#### 3.3.4 Calendar View Mode
- Horizontal Gantt-style timeline.
- Y-axis: Project titles.
- X-axis: Days of the current month.
- Bars represent active project spans (`started_at` to `deadline` or `completion_date`).
- Color-coded by project type tag.
- Tapping a bar renders a bottom summary sheet: total hours logged, sessions count, days late.

---

### 3.4 Tab 4: Journal Screen (`/journal`)

#### 3.4.1 Inactive / Entry State
- Minimalist centered card:
  - Daily Reflection (10 minutes).
  - High-impact warning banner:
    > ⚠️ **Strict Focus Mode**: *Once initiated, Keel enters a 10-minute lock. Switching away or exiting resets the timer to 10:00. Your text draft is continuously autosaved.*
  - Prominent CTA: `[ START 10-MINUTE JOURNAL ]`.
  - On Sundays: An additional card unlocks for `[ START SUNDAY WEEKLY REVIEW (20 MIN) ]`.

#### 3.4.2 Active Locked Journal State
- Fullscreen immersive mode (Status bar and bottom navigation completely hidden).
- Top: Prominent circular countdown clock: `09:42 remaining`.
- Middle: Distraction-free full-screen auto-expanding text editor.
- Top-right: Subtle status indicator: `Autosaved just now`.
- Hardware Back button: Displays native toast: *"Session locked. Complete 10 minutes to exit."*
- App backgrounded/switched: On resume, a red banner appears: *"Session was interrupted. Timer reset to 10:00. Draft preserved."*
- When timer reaches `00:00`: Confetti animation, lock disengages, entry is saved to history, and user is returned to the dashboard.

---

### 3.5 Tab 5: Insights Screen (`/insights`)

Segmented Header: `[ Habits Insights | Work Insights ]`

#### 3.5.1 Habits Insights
1. **Consistency Summary**: Current overall completion rate (e.g. `84% this week`).
2. **GitHub-Style Contribution Heatmap**:
   - 12-week grid (7 rows for Mon-Sun).
   - Cell color intensity mapped to percentage of scheduled habits completed that day:
     - 0%: `#1C1C20`
     - 1-33%: `#14532D`
     - 34-66%: `#16A34A`
     - 67-100%: `#22C55E`
3. **Streak Leaderboard**:
   - Habit rankings by current streak and historical best.
4. **Slip & Miss Breakdown**:
   - Identifies which habits have the highest miss rate to highlight areas needing adjustment.

#### 3.5.2 Work Insights
1. **Total Hours Invested**:
   - Daily/weekly bar chart of logged focus hours.
2. **Distribution by Type**:
   - Visual breakdown of time spent on Courses vs. Docs vs. Code Projects vs. Videos.
3. **Accountability & Slip Metrics**:
   - Total bucket push events logged.
   - On-time completion rate: `78% on-time`.
   - Average days late per completed project.
4. **Course Efficiency**:
   - Average total hours spent to complete a full course or documentation guide.

---

## 4. Modal & Sheet Specifications

1. **Quick Capture Sheet**:
   - Text input focused immediately on open.
   - Minimal options: Title (required), Type selector (defaults to `Task`), optional Deadline.
2. **Smart Snooze Dialog**:
   - Triggered when snoozing a project reminder.
   - Options:
     - *"Move to Tomorrow"* (increments slip count by 1).
     - *"Move to Next Week"* (increments slip count by 1).
     - *"Postpone 1 Hour"* (temporary alarm reschedule, no slip).
3. **Forgot-Timer Prompt Modal**:
   - High-contrast alert dialog: *"Timer running for 3 hours on [Project]. Still working?"*.
   - Countdown ring (15 minutes).
   - Actions: `[ Still Working (+1 hr) ]` | `[ Pause Session Now ]`.
