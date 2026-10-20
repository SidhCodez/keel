import { create } from 'zustand';
import { journalRepository } from '@/db/repositories/journalRepository';

interface JournalState {
  isLocked: boolean;
  sessionType: 'daily' | 'weekly';
  totalDurationSeconds: number;
  secondsRemaining: number;
  draftContent: string;
  sessionStartTime: number;
  interruptionsCount: number;
  wasResetByInterruption: boolean;
  isAutosaved: boolean;

  startSession: (type?: 'daily' | 'weekly') => Promise<void>;
  updateDraft: (text: string) => Promise<void>;
  handleInterruption: () => void;
  tick: () => Promise<void>;
  completeSession: () => Promise<void>;
  dismissInterruptionBanner: () => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  isLocked: false,
  sessionType: 'daily',
  totalDurationSeconds: 600, // 10 minutes default
  secondsRemaining: 600,
  draftContent: '',
  sessionStartTime: 0,
  interruptionsCount: 0,
  wasResetByInterruption: false,
  isAutosaved: true,

  startSession: async (type: 'daily' | 'weekly' = 'daily') => {
    const duration = type === 'weekly' ? 1200 : 600;
    const existingDraft = await journalRepository.getDraft(type);

    set({
      isLocked: true,
      sessionType: type,
      totalDurationSeconds: duration,
      secondsRemaining: duration,
      draftContent: existingDraft,
      sessionStartTime: Date.now(),
      interruptionsCount: 0,
      wasResetByInterruption: false,
      isAutosaved: true,
    });
  },

  updateDraft: async (text: string) => {
    const { sessionType } = get();
    set({ draftContent: text, isAutosaved: false });

    // Autosave immediately to SQLite
    await journalRepository.saveDraft(sessionType, text);
    set({ isAutosaved: true });
  },

  handleInterruption: () => {
    const { isLocked, totalDurationSeconds, interruptionsCount } = get();
    if (!isLocked) return;

    console.warn('[JournalLock] App backgrounded! Resetting session timer to 10:00 as penalty.');
    set({
      secondsRemaining: totalDurationSeconds,
      interruptionsCount: interruptionsCount + 1,
      wasResetByInterruption: true,
    });
  },

  dismissInterruptionBanner: () => {
    set({ wasResetByInterruption: false });
  },

  tick: async () => {
    const { isLocked, secondsRemaining, completeSession } = get();
    if (!isLocked) return;

    if (secondsRemaining <= 1) {
      await completeSession();
    } else {
      set({ secondsRemaining: secondsRemaining - 1 });
    }
  },

  completeSession: async () => {
    const { sessionType, draftContent, sessionStartTime, totalDurationSeconds, interruptionsCount } = get();

    try {
      await journalRepository.saveEntry(
        sessionType,
        draftContent.trim() || '(Completed silent reflection)',
        sessionStartTime,
        totalDurationSeconds,
        interruptionsCount
      );

      set({
        isLocked: false,
        secondsRemaining: totalDurationSeconds,
        draftContent: '',
        wasResetByInterruption: false,
      });
    } catch (err) {
      console.error('[JournalStore] Failed to complete session:', err);
      set({ isLocked: false });
    }
  },
}));
