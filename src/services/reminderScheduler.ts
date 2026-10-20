import { habitRepository } from '@/db/repositories/habitRepository';
import { projectRepository } from '@/db/repositories/projectRepository';
import {
  cancelAllNotifications,
  scheduleHabitReminders,
  scheduleDeadlineReminders,
} from './notificationService';

/**
 * Reschedule all habit and deadline reminders from scratch.
 * Called on app start to handle:
 * - Device reboot (Android kills all scheduled alarms)
 * - Timezone changes
 * - App updates
 *
 * This is the "boot receiver" equivalent for Expo managed workflow.
 */
export async function rescheduleAllReminders(): Promise<void> {
  // Wipe all existing scheduled notifications to avoid duplicates
  await cancelAllNotifications();

  // 1. Reschedule habit reminders
  const allHabits = await habitRepository.getAll();
  let habitCount = 0;

  for (const habit of allHabits) {
    if (!habit.reminderTime) continue;

    let repeatDays: number[];
    if (habit.repeatType === 'daily') {
      repeatDays = [1, 2, 3, 4, 5, 6, 7];
    } else if (habit.repeatType === 'weekdays') {
      repeatDays = [1, 2, 3, 4, 5];
    } else {
      try {
        repeatDays = habit.repeatDays ? JSON.parse(habit.repeatDays) : [1, 2, 3, 4, 5, 6, 7];
      } catch {
        repeatDays = [1, 2, 3, 4, 5, 6, 7];
      }
    }

    await scheduleHabitReminders({
      habitId: habit.id,
      habitName: habit.name,
      reminderTime: habit.reminderTime,
      reminderType: habit.reminderType as 'nudge' | 'alarm' | 'escalate',
      repeatDays,
    });
    habitCount++;
  }

  // 2. Reschedule project deadline reminders
  const allProjects = await projectRepository.getAll();
  let deadlineCount = 0;

  for (const project of allProjects) {
    if (!project.deadline || project.status === 'completed') continue;

    await scheduleDeadlineReminders({
      projectId: project.id,
      projectTitle: project.title,
      deadline: project.deadline,
    });
    deadlineCount++;
  }

  console.log(
    `[ReminderScheduler] Rescheduled: ${habitCount} habits, ${deadlineCount} project deadlines`
  );
}
