import { sql, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { habits, habitLogs, projects, sessions } from '../schema';
import { format, subDays, parseISO } from 'date-fns';

export interface HabitInsightsData {
  weeklyRate: number;
  totalHabits: number;
  topHabitName: string | null;
  topStreak: number;
  heatmapData: { date: string; intensity: number; count: number }[];
}

export interface WorkInsightsData {
  totalFocusSeconds: number;
  completedCount: number;
  onTimeRate: number;
  totalSlips: number;
  typeBreakdown: { type: string; seconds: number; count: number }[];
}

export const insightsRepository = {
  async getHabitInsights(): Promise<HabitInsightsData> {
    const allHabits = await db.select().from(habits);
    const totalHabits = allHabits.length;

    // Past 7 days logs
    const today = new Date();
    const sevenDaysAgoStr = format(subDays(today, 7), 'yyyy-MM-dd');
    const recentLogs = await db
      .select()
      .from(habitLogs)
      .where(sql`${habitLogs.date} >= ${sevenDaysAgoStr}`);

    const completedRecent = recentLogs.filter((l) => l.status === 'completed' || l.status === 'frozen').length;
    const expectedSevenDays = totalHabits * 7 || 1;
    const weeklyRate = Math.min(100, Math.round((completedRecent / expectedSevenDays) * 100));

    // 90-day heatmap data
    const ninetyDaysAgo = subDays(today, 84); // 12 weeks = 84 days
    const allRecentLogs = await db
      .select()
      .from(habitLogs)
      .where(sql`${habitLogs.date} >= ${format(ninetyDaysAgo, 'yyyy-MM-dd')}`);

    const dateCountMap = new Map<string, number>();
    for (const log of allRecentLogs) {
      if (log.status === 'completed' || log.status === 'frozen') {
        dateCountMap.set(log.date, (dateCountMap.get(log.date) ?? 0) + 1);
      }
    }

    const heatmapData: { date: string; intensity: number; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = format(subDays(today, i), 'yyyy-MM-dd');
      const count = dateCountMap.get(d) ?? 0;
      let intensity = 0;
      if (count > 0) {
        const ratio = count / (totalHabits || 1);
        if (ratio >= 0.75) intensity = 3;
        else if (ratio >= 0.4) intensity = 2;
        else intensity = 1;
      }
      heatmapData.push({ date: d, intensity, count });
    }

    return {
      weeklyRate,
      totalHabits,
      topHabitName: allHabits[0]?.name ?? null,
      topStreak: 0,
      heatmapData,
    };
  },

  async getWorkInsights(): Promise<WorkInsightsData> {
    const allSessions = await db.select().from(sessions);
    const totalFocusSeconds = allSessions.reduce((sum, s) => sum + s.durationSeconds, 0);

    const allProjects = await db.select().from(projects);
    const completedProjects = allProjects.filter((p) => p.status === 'completed');
    const totalSlips = allProjects.reduce((sum, p) => sum + (p.slipCount ?? 0), 0);

    let onTimeCount = 0;
    for (const p of completedProjects) {
      if (!p.deadline || !p.completedAt) {
        onTimeCount++;
      } else {
        const deadlineDate = parseISO(p.deadline);
        const compDate = parseISO(p.completedAt);
        if (compDate <= deadlineDate) {
          onTimeCount++;
        }
      }
    }

    const onTimeRate =
      completedProjects.length > 0
        ? Math.round((onTimeCount / completedProjects.length) * 100)
        : 100;

    // Type breakdown
    const typeMap = new Map<string, { seconds: number; count: number }>();
    for (const p of allProjects) {
      typeMap.set(p.type, { seconds: 0, count: 0 });
    }

    for (const s of allSessions) {
      const parent = allProjects.find((p) => p.id === s.projectId);
      if (parent) {
        const entry = typeMap.get(parent.type) ?? { seconds: 0, count: 0 };
        entry.seconds += s.durationSeconds;
        entry.count++;
        typeMap.set(parent.type, entry);
      }
    }

    const typeBreakdown = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      seconds: data.seconds,
      count: data.count,
    }));

    return {
      totalFocusSeconds,
      completedCount: completedProjects.length,
      onTimeRate,
      totalSlips,
      typeBreakdown,
    };
  },
};
