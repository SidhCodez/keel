import { eq, asc } from 'drizzle-orm';
import { db } from '../client';
import { notes, Note, NewNote } from '../schema';
import { parseTimestampStringToSeconds } from '@/rules/youtube';
import * as Crypto from 'expo-crypto';

export const noteRepository = {
  async getForProject(projectId: string): Promise<Note[]> {
    return db
      .select()
      .from(notes)
      .where(eq(notes.projectId, projectId))
      .orderBy(asc(notes.createdAt));
  },

  async create(projectId: string, content: string, timestampStr?: string): Promise<Note> {
    const now = new Date().toISOString();
    const id = Crypto.randomUUID();
    const timestampSeconds = timestampStr ? parseTimestampStringToSeconds(timestampStr) : null;

    const newNote: NewNote = {
      id,
      projectId,
      content,
      timestampStr: timestampStr ?? null,
      timestampSeconds,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(notes).values(newNote);
    const created = await db.select().from(notes).where(eq(notes.id, id));
    if (!created[0]) throw new Error('Failed to create note');
    return created[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  },
};
