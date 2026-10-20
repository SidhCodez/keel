import { eq, desc } from 'drizzle-orm';
import { db } from '../client';
import { sessions, activeSessions, projects, Session, ActiveSession, NewSession } from '../schema';
import * as Crypto from 'expo-crypto';

export const sessionRepository = {
  async getActive(): Promise<ActiveSession | null> {
    const rows = await db.select().from(activeSessions).limit(1);
    return rows[0] ?? null;
  },

  async start(projectId: string): Promise<ActiveSession> {
    // If an active session already exists, finish or remove it first
    const existing = await this.getActive();
    if (existing) {
      if (existing.projectId === projectId) {
        return existing;
      }
      // Auto-pause the previous active project
      await this.pause(existing.projectId, undefined, false);
    }

    const now = Date.now();
    const id = Crypto.randomUUID();

    const activeRow: ActiveSession = {
      id,
      projectId,
      startedAt: now,
      accumulatedMs: 0,
      updatedAt: now,
    };

    await db.insert(activeSessions).values(activeRow);

    // Update project status to in_progress
    await db
      .update(projects)
      .set({ status: 'in_progress', updatedAt: new Date().toISOString() })
      .where(eq(projects.id, projectId));

    return activeRow;
  },

  async pause(
    projectId: string,
    stoppedAtMarker?: string,
    autoPausedByGuard: boolean = false
  ): Promise<Session | null> {
    const active = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.projectId, projectId));

    if (active.length === 0 || !active[0]) {
      return null;
    }

    const current = active[0];
    const now = Date.now();
    const totalElapsedMs = current.accumulatedMs + (now - current.startedAt);
    const durationSeconds = Math.max(1, Math.round(totalElapsedMs / 1000));

    // Delete active session record
    await db.delete(activeSessions).where(eq(activeSessions.id, current.id));

    // Create completed session record
    const sessionId = Crypto.randomUUID();
    const newSession: NewSession = {
      id: sessionId,
      projectId,
      startedAt: current.startedAt,
      endedAt: now,
      durationSeconds,
      stoppedAtMarker: stoppedAtMarker ?? null,
      autoPausedByGuard,
      createdAt: new Date().toISOString(),
    };

    await db.insert(sessions).values(newSession);

    // Update project resume marker if provided
    if (stoppedAtMarker !== undefined) {
      await db
        .update(projects)
        .set({
          resumeMarker: stoppedAtMarker,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(projects.id, projectId));
    }

    const created = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    return created[0] ?? null;
  },

  async getForProject(projectId: string): Promise<Session[]> {
    return db
      .select()
      .from(sessions)
      .where(eq(sessions.projectId, projectId))
      .orderBy(desc(sessions.startedAt));
  },

  async getTotalSeconds(projectId: string): Promise<number> {
    const list = await this.getForProject(projectId);
    return list.reduce((sum, s) => sum + s.durationSeconds, 0);
  },
};
