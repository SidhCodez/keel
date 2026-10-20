import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseISO, differenceInMilliseconds, startOfDay, addDays, setHours, setMinutes } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReminderTier = 'nudge' | 'alarm' | 'escalate';

interface HabitReminderInput {
  habitId: string;
  habitName: string;
  reminderTime: string; // "HH:mm"
  reminderType: ReminderTier;
  repeatDays: number[]; // 1=Mon..7=Sun (ISO day)
}

interface DeadlineReminderInput {
  projectId: string;
  projectTitle: string;
  deadline: string; // "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Channel Setup (Android-Only)
// ---------------------------------------------------------------------------

const CHANNELS: Array<{ id: string; name: string; importance: Notifications.AndroidImportance; sound: string | null; vibrate: boolean }> = [
  {
    id: 'keel-nudge',
    name: 'Nudge Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrate: true,
  },
  {
    id: 'keel-alarm',
    name: 'Alarm Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrate: true,
  },
  {
    id: 'keel-escalate',
    name: 'Escalated Alerts',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrate: true,
  },
];

function getChannelId(tier: ReminderTier): string {
  switch (tier) {
    case 'nudge': return 'keel-nudge';
    case 'alarm': return 'keel-alarm';
    case 'escalate': return 'keel-escalate';
    default: return 'keel-nudge';
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Configure notification handler (how notifications appear when app is foreground)
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

/**
 * Request notification permissions and create Android channels.
 * Returns true if permissions were granted.
 */
export async function initializeNotifications(): Promise<boolean> {
  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[NotificationService] Permission not granted');
    return false;
  }

  // Create Android notification channels
  if (Platform.OS === 'android') {
    for (const channel of CHANNELS) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: channel.vibrate ? [0, 250, 250, 250] : [0],
        sound: channel.sound ?? undefined,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: channel.vibrate,
      });
    }
    console.log('[NotificationService] Android channels created: nudge, alarm, escalate');
  }

  return true;
}

// ---------------------------------------------------------------------------
// Habit Reminders
// ---------------------------------------------------------------------------

/**
 * Generates a stable notification identifier for a habit + weekday.
 * This allows us to cancel/reschedule specific reminders.
 */
function habitNotifId(habitId: string, isoDay: number): string {
  return `habit-${habitId}-day-${isoDay}`;
}

/**
 * Schedule daily recurring reminders for a single habit.
 * Creates one notification per scheduled weekday at the specified time.
 */
export async function scheduleHabitReminders(input: HabitReminderInput): Promise<void> {
  const { habitId, habitName, reminderTime, reminderType, repeatDays } = input;

  // Cancel any existing reminders for this habit first
  await cancelHabitReminders(habitId, repeatDays);

  const [hoursStr, minutesStr] = reminderTime.split(':');
  const hours = parseInt(hoursStr ?? '0', 10);
  const minutes = parseInt(minutesStr ?? '0', 10);

  const channelId = getChannelId(reminderType);

  for (const isoDay of repeatDays) {
    // Convert ISO day (1=Mon..7=Sun) to JS day (1=Sun..7=Sat)
    // expo-notifications uses weekday: 1=Sunday, 2=Monday, ..., 7=Saturday
    const expoWeekday = isoDay === 7 ? 1 : isoDay + 1;

    const identifier = habitNotifId(habitId, isoDay);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: '🔔 Habit Reminder',
        body: `Time for "${habitName}"`,
        data: {
          type: 'habit_reminder',
          habitId,
          habitName,
        },
        ...(Platform.OS === 'android' ? { channelId } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: expoWeekday,
        hour: hours,
        minute: minutes,
      },
    });
  }

  console.log(`[NotificationService] Scheduled ${repeatDays.length} habit reminders for "${habitName}"`);
}

/**
 * Cancel all scheduled reminders for a specific habit.
 */
export async function cancelHabitReminders(habitId: string, repeatDays: number[] = [1, 2, 3, 4, 5, 6, 7]): Promise<void> {
  for (const isoDay of repeatDays) {
    try {
      await Notifications.cancelScheduledNotificationAsync(habitNotifId(habitId, isoDay));
    } catch {
      // Silently ignore if notification doesn't exist
    }
  }
}

// ---------------------------------------------------------------------------
// Project Deadline Reminders
// ---------------------------------------------------------------------------

/**
 * Generates stable notification IDs for project deadline reminders.
 * We schedule reminders at: 3 days before, 1 day before, and on the day.
 */
function deadlineNotifId(projectId: string, label: string): string {
  return `deadline-${projectId}-${label}`;
}

/**
 * Schedule deadline reminders for a project.
 * Creates notifications at: 3 days before (nudge), 1 day before (alarm), and on the day (escalate).
 */
export async function scheduleDeadlineReminders(input: DeadlineReminderInput): Promise<void> {
  const { projectId, projectTitle, deadline } = input;

  // Cancel existing deadline reminders first
  await cancelDeadlineReminders(projectId);

  const deadlineDate = parseISO(deadline);
  const now = new Date();

  const reminders: Array<{ label: string; date: Date; tier: ReminderTier; title: string; body: string }> = [
    {
      label: '3d',
      date: startOfDay(addDays(deadlineDate, -3)),
      tier: 'nudge',
      title: '📋 Deadline in 3 Days',
      body: `"${projectTitle}" is due in 3 days. Stay on track.`,
    },
    {
      label: '1d',
      date: startOfDay(addDays(deadlineDate, -1)),
      tier: 'alarm',
      title: '⚠️ Deadline Tomorrow',
      body: `"${projectTitle}" is due tomorrow! Finish up.`,
    },
    {
      label: 'due',
      date: setMinutes(setHours(deadlineDate, 9), 0), // 9 AM on due date
      tier: 'escalate',
      title: '🚨 Deadline Today',
      body: `"${projectTitle}" is due TODAY. Submit now or mark as slip.`,
    },
  ];

  for (const reminder of reminders) {
    const msUntil = differenceInMilliseconds(reminder.date, now);
    if (msUntil <= 0) continue; // Skip reminders in the past

    const secondsUntil = Math.ceil(msUntil / 1000);
    const channelId = getChannelId(reminder.tier);
    const identifier = deadlineNotifId(projectId, reminder.label);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: {
          type: 'deadline_reminder',
          projectId,
          projectTitle,
          label: reminder.label,
        },
        ...(Platform.OS === 'android' ? { channelId } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
        repeats: false,
      },
    });
  }

  console.log(`[NotificationService] Scheduled deadline reminders for "${projectTitle}"`);
}

/**
 * Cancel all deadline reminders for a specific project.
 */
export async function cancelDeadlineReminders(projectId: string): Promise<void> {
  const labels = ['3d', '1d', 'due'];
  for (const label of labels) {
    try {
      await Notifications.cancelScheduledNotificationAsync(deadlineNotifId(projectId, label));
    } catch {
      // Silently ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Snooze Support
// ---------------------------------------------------------------------------

/**
 * Schedule a snooze reminder that fires after `delayMinutes`.
 * Returns the notification identifier for tracking.
 */
export async function scheduleSnooze(
  projectId: string,
  projectTitle: string,
  delayMinutes: number = 30,
): Promise<string> {
  const identifier = `snooze-${projectId}-${Date.now()}`;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: '⏰ Snooze Reminder',
      body: `Back to "${projectTitle}" — snoozed ${delayMinutes} min ago. Slip counted.`,
      data: {
        type: 'snooze_reminder',
        projectId,
        projectTitle,
      },
      ...(Platform.OS === 'android' ? { channelId: 'keel-alarm' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
      repeats: false,
    },
  });

  console.log(`[NotificationService] Snooze scheduled: ${delayMinutes}min for "${projectTitle}"`);
  return identifier;
}

// ---------------------------------------------------------------------------
// Forgot-Timer Notification
// ---------------------------------------------------------------------------

/**
 * Schedule a "forgot timer" notification that fires if the session runs too long.
 * Used as a backup in case the in-app guard is not seen.
 */
export async function scheduleForgotTimerAlert(projectId: string, projectTitle: string): Promise<string> {
  const identifier = `forgot-timer-${projectId}`;

  // Cancel any existing forgot-timer notification
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Ignore
  }

  // Fire after 3 hours (10800 seconds)
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: '🛑 Timer Running 3+ Hours',
      body: `"${projectTitle}" session has been running for 3 hours. Did you forget to pause?`,
      data: {
        type: 'forgot_timer',
        projectId,
      },
      ...(Platform.OS === 'android' ? { channelId: 'keel-escalate' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10800, // 3 hours
      repeats: false,
    },
  });

  return identifier;
}

/**
 * Cancel forgot-timer notification when session is paused.
 */
export async function cancelForgotTimerAlert(projectId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`forgot-timer-${projectId}`);
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Bulk Reschedule (for boot/app restart)
// ---------------------------------------------------------------------------

/**
 * Cancel all scheduled notifications. Used before bulk reschedule.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[NotificationService] All scheduled notifications cancelled');
}

/**
 * Get count of currently scheduled notifications.
 */
export async function getScheduledCount(): Promise<number> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.length;
}
