import { KeelBackupSchema } from '@/rules/backupSchema';

describe('KeelBackupSchema (Zod Validation)', () => {
  it('TC-BAK-01: validates a valid Keel JSON backup structure', () => {
    const validBackup = {
      version: 1,
      appName: 'Keel',
      exportedAt: '2026-10-21T00:00:00.000Z',
      data: {
        habits: [
          {
            id: 'h1',
            name: 'Morning Workout',
            repeatType: 'daily',
            repeatDays: '[1,2,3,4,5,6,7]',
            reminderTime: '07:00',
            reminderType: 'alarm',
            color: '#38BDF8',
            icon: 'flame',
            archivedAt: null,
            createdAt: '2026-10-21T00:00:00.000Z',
            updatedAt: '2026-10-21T00:00:00.000Z',
          },
        ],
        habitLogs: [
          {
            id: 'hl1',
            habitId: 'h1',
            date: '2026-10-21',
            status: 'completed',
            createdAt: '2026-10-21T00:00:00.000Z',
          },
        ],
        habitFreezes: [
          {
            id: 'hf1',
            yearMonth: '2026-10',
            freezesUsed: 1,
            updatedAt: '2026-10-21T00:00:00.000Z',
          },
        ],
        projects: [
          {
            id: 'p1',
            title: 'TypeScript Masterclass',
            type: 'course',
            link: 'https://example.com',
            description: 'Advanced type gymnastics',
            deadline: '2026-10-25',
            totalUnits: 20,
            completedUnits: 5,
            unitLabel: 'lessons',
            resumeMarker: 'Lesson 6',
            status: 'in_progress',
            slipCount: 1,
            createdAt: '2026-10-21T00:00:00.000Z',
            updatedAt: '2026-10-21T00:00:00.000Z',
            completedAt: null,
          },
        ],
        sessions: [
          {
            id: 's1',
            projectId: 'p1',
            startedAt: 1700000000000,
            endedAt: 1700001800000,
            durationSeconds: 1800,
            stoppedAtMarker: 'Lesson 6',
            autoPausedByGuard: false,
            createdAt: '2026-10-21T00:00:00.000Z',
          },
        ],
        notes: [
          {
            id: 'n1',
            projectId: 'p1',
            timestampStr: '12:40',
            timestampSeconds: 760,
            content: 'Conditional types logic here',
            createdAt: '2026-10-21T00:00:00.000Z',
            updatedAt: '2026-10-21T00:00:00.000Z',
          },
        ],
        journalEntries: [
          {
            id: 'j1',
            type: 'daily',
            date: '2026-10-21',
            startTime: 1700000000000,
            finishTime: 1700000600000,
            durationSeconds: 600,
            content: 'Great focus today, completed module 5.',
            interruptionsCount: 0,
            createdAt: '2026-10-21T00:00:00.000Z',
          },
        ],
        journalDrafts: [],
        appSettings: [],
      },
    };

    const result = KeelBackupSchema.safeParse(validBackup);
    expect(result.success).toBe(true);
  });

  it('TC-BAK-02: rejects invalid appName or wrong version', () => {
    const invalidBackup = {
      version: 2, // Unsupported version
      appName: 'FakeApp',
      exportedAt: '2026-10-21T00:00:00.000Z',
      data: {
        habits: [],
        habitLogs: [],
        habitFreezes: [],
        projects: [],
        sessions: [],
        notes: [],
        journalEntries: [],
        journalDrafts: [],
        appSettings: [],
      },
    };

    const result = KeelBackupSchema.safeParse(invalidBackup);
    expect(result.success).toBe(false);
  });

  it('TC-BAK-03: rejects corrupted project missing title or invalid type', () => {
    const corruptBackup = {
      version: 1,
      appName: 'Keel',
      exportedAt: '2026-10-21T00:00:00.000Z',
      data: {
        habits: [],
        habitLogs: [],
        habitFreezes: [],
        projects: [
          {
            id: 'p1',
            title: '', // Empty title
            type: 'invalid_type', // Invalid enum
            status: 'in_progress',
            slipCount: 0,
            completedUnits: 0,
            createdAt: '2026-10-21',
            updatedAt: '2026-10-21',
          },
        ],
        sessions: [],
        notes: [],
        journalEntries: [],
        journalDrafts: [],
        appSettings: [],
      },
    };

    const result = KeelBackupSchema.safeParse(corruptBackup);
    expect(result.success).toBe(false);
  });
});
