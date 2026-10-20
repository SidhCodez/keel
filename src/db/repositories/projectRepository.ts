import { eq, desc, asc, and, isNotNull, lte } from 'drizzle-orm';
import { db } from '../client';
import { projects, activeSessions, sessions, Project, NewProject } from '../schema';
import { calculateBucket, Bucket } from '@/rules/buckets';
import { calculateDailyTarget } from '@/rules/targets';
import * as Crypto from 'expo-crypto';
import { parseISO, isAfter } from 'date-fns';

export interface ProjectWithMetrics extends Project {
  bucket: Bucket;
  dailyTarget: number | null;
}

export const projectRepository = {
  async getAll(): Promise<Project[]> {
    return db.select().from(projects).orderBy(asc(projects.deadline), desc(projects.updatedAt));
  },

  async getById(id: string): Promise<Project | null> {
    const rows = await db.select().from(projects).where(eq(projects.id, id));
    return rows[0] ?? null;
  },

  async create(data: Omit<NewProject, 'id' | 'createdAt' | 'updatedAt' | 'slipCount' | 'status'> & { id?: string }): Promise<Project> {
    const now = new Date().toISOString();
    const id = data.id ?? Crypto.randomUUID();

    const newProject: NewProject = {
      ...data,
      id,
      status: 'not_started',
      slipCount: 0,
      completedUnits: data.completedUnits ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(projects).values(newProject);
    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create project');
    return created;
  },

  async update(id: string, updates: Partial<NewProject>): Promise<Project> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Project ${id} not found`);

    let slipIncrement = 0;
    // Rule: If deadline is postponed to a later date, increment slipCount
    if (updates.deadline && existing.deadline) {
      const oldDeadline = parseISO(existing.deadline);
      const newDeadline = parseISO(updates.deadline);
      if (isAfter(newDeadline, oldDeadline)) {
        slipIncrement = 1;
      }
    }

    const now = new Date().toISOString();
    const finalUpdates: Partial<NewProject> = {
      ...updates,
      slipCount: (existing.slipCount ?? 0) + slipIncrement + (updates.slipCount ? updates.slipCount : 0),
      updatedAt: now,
    };

    await db.update(projects).set(finalUpdates).where(eq(projects.id, id));
    const updated = await this.getById(id);
    if (!updated) throw new Error('Failed to update project');
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  },

  async getGroupedByBucket(referenceDate: Date = new Date()): Promise<Record<Bucket, ProjectWithMetrics[]>> {
    const all = await this.getAll();
    const buckets: Record<Bucket, ProjectWithMetrics[]> = {
      today: [],
      tomorrow: [],
      this_week: [],
      later: [],
    };

    for (const project of all) {
      if (project.status === 'completed') continue;

      const deadlineDate = project.deadline ? parseISO(project.deadline) : null;
      const bucket = calculateBucket(deadlineDate, referenceDate);
      const dailyTarget = calculateDailyTarget(
        project.totalUnits,
        project.completedUnits,
        deadlineDate,
        referenceDate
      );

      buckets[bucket].push({
        ...project,
        bucket,
        dailyTarget,
      });
    }

    return buckets;
  },

  /**
   * For the North Star 2-Tap Resume Continue Card:
   * Returns currently active project or the most recently worked project with its resume marker.
   */
  async getContinueTarget(): Promise<{ project: Project; isActive: boolean } | null> {
    // 1. Check if there is an active running session
    const active = await db.select().from(activeSessions).limit(1);
    if (active.length > 0 && active[0]) {
      const activeProj = await this.getById(active[0].projectId);
      if (activeProj) {
        return { project: activeProj, isActive: true };
      }
    }

    // 2. Check for most recently ended session
    const latestSessions = await db.select().from(sessions).orderBy(desc(sessions.endedAt)).limit(1);
    if (latestSessions.length > 0 && latestSessions[0]) {
      const lastProj = await this.getById(latestSessions[0].projectId);
      if (lastProj && lastProj.status !== 'completed') {
        return { project: lastProj, isActive: false };
      }
    }

    // 3. Fallback to most recently updated in-progress or not-started project
    const recentProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.status, 'in_progress'))
      .orderBy(desc(projects.updatedAt))
      .limit(1);

    if (recentProjects.length > 0 && recentProjects[0]) {
      return { project: recentProjects[0], isActive: false };
    }

    const anyPending = await db
      .select()
      .from(projects)
      .where(eq(projects.status, 'not_started'))
      .orderBy(desc(projects.updatedAt))
      .limit(1);

    if (anyPending.length > 0 && anyPending[0]) {
      return { project: anyPending[0], isActive: false };
    }

    return null;
  },
};
