# 09. Test & Acceptance Plan: Keel

## 1. Testing Philosophy & Quality Strategy

To maintain high confidence without unnecessary testing overhead, Keel's test strategy is divided into three tiers:
1. **Tier 1: Pure Function Unit Tests (100% Coverage Target)**: All deterministic domain logic (buckets, streaks, targets, slips, deep-links) is isolated as pure functions and tested exhaustively with Jest.
2. **Tier 2: Database & Repository Integration Tests**: Verifying SQLite migrations, transaction rollbacks, and foreign key cascades.
3. **Tier 3: User Acceptance & Device Verification**: End-to-end acceptance scenarios verifying Android hardware behaviors (alarms, screen pinning, app background resets).

---

## 2. Unit Test Specifications (`/src/rules/__tests__`)

### 2.1 Bucket Allocation (`buckets.test.ts`)
| Test Case ID | Input Condition | Expected Output |
| :--- | :--- | :--- |
| `TC-BKT-01` | Deadline is earlier than today's calendar date | `'today'` (flagged as overdue) |
| `TC-BKT-02` | Deadline equals today's calendar date | `'today'` |
| `TC-BKT-03` | Deadline is exactly 1 calendar day ahead | `'tomorrow'` |
| `TC-BKT-04` | Deadline is 3 days ahead, falling before Sunday | `'this_week'` |
| `TC-BKT-05` | Deadline is beyond the coming Sunday | `'later'` |
| `TC-BKT-06` | Deadline is `null` / undefined | `'later'` |

### 2.2 Daily Target Quota (`targets.test.ts`)
| Test Case ID | Total Units | Completed | Days Left | Expected Target |
| :--- | :--- | :--- | :--- | :--- |
| `TC-TGT-01` | 30 lessons | 0 | 5 days | $\lceil 30 / 6 \rceil = 5\text{ lessons/day}$ |
| `TC-TGT-02` | 20 pages | 15 | 1 day (tomorrow) | $\lceil 5 / 2 \rceil = 3\text{ pages/day}$ |
| `TC-TGT-03` | 100 pages | 40 | 0 days (today) | $60\text{ pages/day}$ |
| `TC-TGT-04` | 50 lessons | 50 | 3 days | $0$ (prompts completion) |
| `TC-TGT-05` | `null` | 0 | 5 days | `null` (badge hidden) |

### 2.3 Habit Streaks & Monthly Freezes (`streaks.test.ts`)
| Test Case ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| `TC-STR-01` | Completed 5 consecutive daily habits | Current streak = 5, Best streak = 5 |
| `TC-STR-02` | Weekday habit completed Mon-Fri, evaluated on Saturday | Streak preserved at 5 (weekend ignored) |
| `TC-STR-03` | Missed yesterday, streak freeze applied (1 of 2 used) | Streak preserved, remaining freezes = 1 |
| `TC-STR-04` | User attempts 3rd freeze in the same calendar month | Operation rejected (exceeds monthly allowance) |
| `TC-STR-05` | New month arrives (`00:00:00` on the 1st) | Freeze allowance automatically resets to 2 |

### 2.4 Slip Tracking & Delays (`slips.test.ts`)
| Test Case ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| `TC-SLP-01` | Project deadline moved from Today to Next Week | `slip_count` increments from 0 to 1 |
| `TC-SLP-02` | Project completed 3 days after deadline | `days_late = 3` |
| `TC-SLP-03` | Project completed 2 days before deadline | `days_late = 0` |
| `TC-SLP-04` | Project without deadline is completed | `days_late = 0` |

### 2.5 YouTube Deep-Linking (`youtube.test.ts`)
| Test Case ID | Raw Timestamp | Video URL | Expected URL |
| :--- | :--- | :--- | :--- |
| `TC-YT-01` | `"12:40"` | `https://youtu.be/xyz` | `vnd.youtube://xyz?t=760` |
| `TC-YT-02` | `"01:05:20"` | `https://youtube.com/watch?v=abc` | `vnd.youtube://abc?t=3920` |
| `TC-YT-03` | Invalid format (`"abc"`) | `https://youtu.be/xyz` | Fallback without timestamp |

---

## 3. Database Integration Test Cases

1. **Foreign Key Cascade Integrity**:
   - Deleting a `Project` must automatically delete all associated records in `sessions`, `active_sessions`, and `notes`.
   - Deleting a `Habit` must automatically delete all corresponding entries in `habit_logs`.
2. **Atomic Session Persistence**:
   - Pausing a session must write the session record and remove the `active_sessions` row within a single database transaction.
3. **Backup & Restore Round-Trip**:
   - Export SQLite database to JSON → Parse with Zod schema → Clear database → Import JSON → Verify 100% record identity.

---

## 4. User Acceptance Criteria ("Done" Definition)

### 4.1 North Star Acceptance Check
- [ ] **2-Tap Resume Verification**:
  1. Open Keel from cold start.
  2. The topmost card on the Today screen displays the last active project and stopping marker.
  3. Tap **Resume**: Link opens in YouTube/browser and session timer begins. Total taps: **Exactly 1 to 2**.

### 4.2 Today Tab Acceptance
- [ ] Pending habits list shows today's scheduled habits only.
- [ ] Checking off a habit immediately increments streak with tactile haptic feedback.
- [ ] Work pending section displays daily target badge and deadline urgency.

### 4.3 Work & Timer Acceptance
- [ ] Tapping **Start** begins timer tracking based on system epoch timestamps.
- [ ] Killing the app process and reopening restores the exact elapsed timer count without loss.
- [ ] Tapping **Pause** opens the type-specific "Stopped at?" prompt.
- [ ] Entering a marker updates the project card and saves to the session log.
- [ ] Simulating a 3-hour timer fires the Forgot-Timer alert; ignoring for 15 minutes auto-pauses at 3h.

### 4.4 Journal Hard Lock Acceptance
- [ ] Tapping "Start Daily Journal" triggers warning and initiates 10-minute countdown.
- [ ] Android hardware back button is intercepted and prevents exit.
- [ ] Swapping to another app or pressing Home triggers the reset penalty (timer resets to 10:00 on return).
- [ ] Text content is completely preserved via autosave despite timer reset.
- [ ] Reaching 00:00 marks entry as complete and unlocks navigation.

### 4.5 Insights & Analytics Acceptance
- [ ] Habits tab displays 90-day GitHub-style SVG heatmap with accurate color intensity.
- [ ] Work tab displays total hours logged and on-time completion percentage.
- [ ] Slip counters and days late are accurately rendered on project calendar bars.
