import { eq, and, desc } from 'drizzle-orm';
import { db } from '../client';
import { journalEntries, journalDrafts, JournalEntry, JournalDraft, NewJournalEntry } from '../schema';
import * as Crypto from 'expo-crypto';
import { format } from 'date-fns';

export const journalRepository = {
  async getDraft(type: 'daily' | 'weekly' = 'daily'): Promise<string> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const rows = await db
      .select()
      .from(journalDrafts)
      .where(and(eq(journalDrafts.id, type), eq(journalDrafts.date, today)));

    return rows[0]?.content ?? '';
  },

  async saveDraft(type: 'daily' | 'weekly', content: string): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = Date.now();

    const existing = await db
      .select()
      .from(journalDrafts)
      .where(eq(journalDrafts.id, type));

    if (existing.length > 0 && existing[0]) {
      await db
        .update(journalDrafts)
        .set({
          content,
          date: today,
          lastSavedAt: now,
        })
        .where(eq(journalDrafts.id, type));
    } else {
      await db.insert(journalDrafts).values({
        id: type,
        date: today,
        content,
        elapsedSeconds: 0,
        lastSavedAt: now,
      });
    }
  },

  async clearDraft(type: 'daily' | 'weekly'): Promise<void> {
    await db.delete(journalDrafts).where(eq(journalDrafts.id, type));
  },

  async saveEntry(
    type: 'daily' | 'weekly',
    content: string,
    startTime: number,
    durationSeconds: number,
    interruptionsCount: number
  ): Promise<JournalEntry> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const id = Crypto.randomUUID();
    const now = Date.now();

    const entry: NewJournalEntry = {
      id,
      type,
      date: today,
      startTime,
      finishTime: now,
      durationSeconds,
      content,
      interruptionsCount,
      createdAt: new Date().toISOString(),
    };

    await db.insert(journalEntries).values(entry);
    await this.clearDraft(type);

    const created = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    if (!created[0]) throw new Error('Failed to create journal entry');
    return created[0];
  },

  async hasCompletedToday(type: 'daily' | 'weekly' = 'daily'): Promise<boolean> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const rows = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.type, type), eq(journalEntries.date, today)));

    return rows.length > 0;
  },

  async getAllEntries(): Promise<JournalEntry[]> {
    return db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));
  },
};
