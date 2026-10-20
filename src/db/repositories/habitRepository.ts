import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../client';
import { habits, habitLogs, habitFreezes, Habit, NewHabit, HabitLog } from '../schema';
import { computeHabitStreak, StreakResult } from '@/rules/streaks';
import * as Crypto from 'expo-crypto';
import { format, getISODay, parseISO } from 'date-fns';

export interface HabitWithStatus extends Habit {
  isCompletedToday: boolean;
  isFrozenToday: boolean;
  currentStreak: number;
  bestStreak: number;
}

export const habitRepository = {
  async getAll(): Promise<Habit[]> {
    return db
      .select()
      .from(habits)
      .where(sql`${habits.archivedAt} IS NULL`)
      .orderBy(desc(habits.createdAt));
  },

  async getById(id: string): Promise<Habit | null> {
    const rows = await db.select().from(habits).where(eq(habits.id, id));
    return rows[0] ?? null;
  },

  async create(data: Omit<NewHabit, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'> & { id?: string }): Promise<Habit> {
    const now = new Date().toISOString();
    const id = data.id ?? Crypto.randomUUID();

    const newHabit: NewHabit = {
      ...data,
      id,
      repeatType: data.repeatType ?? 'daily',
      reminderType: data.reminderType ?? 'nudge',
      color: data.color ?? '#38BDF8',
      icon: data.icon ?? 'flame',
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(habits).values(newHabit);
    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create habit');
    return created;
  },

  async update(id: string, updates: Partial<NewHabit>): Promise<Habit> {
    const now = new Date().toISOString();
    await db
      .update(habits)
      .set({ ...updates, updatedAt: now })
      .where(eq(habits.id, id));

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Habit ${id} not found`);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.delete(habits).where(eq(habits.id, id));
  },

  async getLogs(habitId: string): Promise<HabitLog[]> {
    return db
      .select()
      .from(habitLogs)
      .where(eq(habitLogs.habitId, habitId))
      .orderBy(desc(habitLogs.date));
  },

  async toggleToday(habitId: string, referenceDate: Date = new Date()): Promise<boolean> {
    const dateStr = format(referenceDate, 'yyyy-MM-dd');
    const existing = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, dateStr)));

    if (existing.length > 0 && existing[0]) {
      // Toggle off -> delete log
      await db.delete(habitLogs).where(eq(habitLogs.id, existing[0].id));
      return false;
    } else {
      // Toggle on -> create completed log
      const id = Crypto.randomUUID();
      await db.insert(habitLogs).values({
        id,
        habitId,
        date: dateStr,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
      return true;
    }
  },

  async getHabitStreak(habitId: string, referenceDate: Date = new Date()): Promise<StreakResult> {
    const habit = await this.getById(habitId);
    if (!habit) return { currentStreak: 0, bestStreak: 0 };

    let scheduledDays: number[];
    if (habit.repeatType === 'daily') {
      scheduledDays = [1, 2, 3, 4, 5, 6, 7];
    } else if (habit.repeatType === 'weekdays') {
      scheduledDays = [1, 2, 3, 4, 5];
    } else {
      try {
        scheduledDays = habit.repeatDays ? JSON.parse(habit.repeatDays) : [1, 2, 3, 4, 5, 6, 7];
      } catch {
        scheduledDays = [1, 2, 3, 4, 5, 6, 7];
      }
    }

    const logsList = await this.getLogs(habitId);
    const logsMap = new Map<string, 'completed' | 'frozen' | 'skipped'>();
    for (const log of logsList) {
      logsMap.set(log.date, log.status as 'completed' | 'frozen' | 'skipped');
    }

    return computeHabitStreak(scheduledDays, logsMap, referenceDate);
  },

  async getMonthlyFreezesUsed(referenceDate: Date = new Date()): Promise<number> {
    const yearMonth = format(referenceDate, 'yyyy-MM');
    const rows = await db
      .select()
      .from(habitFreezes)
      .where(eq(habitFreezes.yearMonth, yearMonth));

    return rows[0]?.freezesUsed ?? 0;
  },

  async applyFreeze(habitId: string, targetDate: Date = new Date()): Promise<boolean> {
    const yearMonth = format(targetDate, 'yyyy-MM');
    const used = await this.getMonthlyFreezesUsed(targetDate);

    // Rule: Max 2 freezes per month
    if (used >= 2) {
      return false;
    }

    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const id = Crypto.randomUUID();

    // Insert or update freeze log
    await db.insert(habitLogs).values({
      id,
      habitId,
      date: dateStr,
      status: 'frozen',
      createdAt: new Date().toISOString(),
    });

    // Update habit_freezes count
    const existingFreezeRow = await db
      .select()
      .from(habitFreezes)
      .where(eq(habitFreezes.yearMonth, yearMonth));

    if (existingFreezeRow.length > 0 && existingFreezeRow[0]) {
      await db
        .update(habitFreezes)
        .set({
          freezesUsed: existingFreezeRow[0].freezesUsed + 1,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(habitFreezes.id, existingFreezeRow[0].id));
    } else {
      await db.insert(habitFreezes).values({
        id: Crypto.randomUUID(),
        yearMonth,
        freezesUsed: 1,
        updatedAt: new Date().toISOString(),
      });
    }

    return true;
  },

  async getAllWithStatus(referenceDate: Date = new Date()): Promise<HabitWithStatus[]> {
    const all = await this.getAll();
    const todayStr = format(referenceDate, 'yyyy-MM-dd');

    const result: HabitWithStatus[] = [];
    for (const habit of all) {
      const logs = await this.getLogs(habit.id);
      const todayLog = logs.find((l) => l.date === todayStr);

      const streak = await this.getHabitStreak(habit.id, referenceDate);

      result.push({
        ...habit,
        isCompletedToday: todayLog?.status === 'completed',
        isFrozenToday: todayLog?.status === 'frozen',
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
      });
    }

    return result;
  },
};
