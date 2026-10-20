import { create } from 'zustand';
import { sessionRepository } from '@/db/repositories/sessionRepository';
import { projectRepository } from '@/db/repositories/projectRepository';
import { scheduleForgotTimerAlert, cancelForgotTimerAlert } from '@/services/notificationService';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000; // 10,800,000 ms
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

interface TimerState {
  activeProjectId: string | null;
  startedAt: number | null;
  accumulatedMs: number;
  elapsedSeconds: number;
  isGuardAlertVisible: boolean;
  isStoppedAtModalOpen: boolean;
  pausedProjectId: string | null;

  init: () => Promise<void>;
  start: (projectId: string) => Promise<void>;
  pause: () => Promise<void>;
  submitStoppedAt: (marker: string) => Promise<void>;
  dismissGuard: (continueWorking: boolean) => Promise<void>;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeProjectId: null,
  startedAt: null,
  accumulatedMs: 0,
  elapsedSeconds: 0,
  isGuardAlertVisible: false,
  isStoppedAtModalOpen: false,
  pausedProjectId: null,

  init: async () => {
    try {
      const active = await sessionRepository.getActive();
      if (!active) {
        set({ activeProjectId: null, startedAt: null, accumulatedMs: 0, elapsedSeconds: 0 });
        return;
      }

      const now = Date.now();
      const totalElapsedMs = active.accumulatedMs + (now - active.startedAt);

      // Forgot-Timer Guard check: if elapsed >= 3 hours + 15 min grace, auto-pause clamped to 3h
      if (totalElapsedMs >= THREE_HOURS_MS + FIFTEEN_MINUTES_MS) {
        console.warn('[TimerGuard] Session exceeded 3h15m while app was closed. Auto-pausing clamped to 3h.');
        cancelForgotTimerAlert(active.projectId).catch(() => {});
        await sessionRepository.pause(active.projectId, undefined, true);
        set({ activeProjectId: null, startedAt: null, accumulatedMs: 0, elapsedSeconds: 0 });
        return;
      }

      // If between 3h and 3h15m, show prompt
      const isGuardAlertVisible = totalElapsedMs >= THREE_HOURS_MS;

      set({
        activeProjectId: active.projectId,
        startedAt: active.startedAt,
        accumulatedMs: active.accumulatedMs,
        elapsedSeconds: Math.floor(totalElapsedMs / 1000),
        isGuardAlertVisible,
      });
    } catch (err) {
      console.error('[TimerStore] Failed to initialize active timer:', err);
    }
  },

  start: async (projectId: string) => {
    try {
      const active = await sessionRepository.start(projectId);
      const proj = await projectRepository.getById(projectId);
      scheduleForgotTimerAlert(projectId, proj?.title ?? 'Active Session').catch(() => {});

      set({
        activeProjectId: projectId,
        startedAt: active.startedAt,
        accumulatedMs: active.accumulatedMs,
        elapsedSeconds: 0,
        isGuardAlertVisible: false,
        isStoppedAtModalOpen: false,
        pausedProjectId: null,
      });
    } catch (err) {
      console.error('[TimerStore] Failed to start session:', err);
    }
  },

  pause: async () => {
    const { activeProjectId, startedAt, accumulatedMs } = get();
    if (!activeProjectId || !startedAt) return;

    // Halt ticking and open "Stopped at?" modal
    set({
      isStoppedAtModalOpen: true,
      pausedProjectId: activeProjectId,
    });
  },

  submitStoppedAt: async (marker: string) => {
    const { pausedProjectId } = get();
    if (!pausedProjectId) return;

    try {
      cancelForgotTimerAlert(pausedProjectId).catch(() => {});
      await sessionRepository.pause(pausedProjectId, marker.trim());
      set({
        activeProjectId: null,
        startedAt: null,
        accumulatedMs: 0,
        elapsedSeconds: 0,
        isStoppedAtModalOpen: false,
        pausedProjectId: null,
        isGuardAlertVisible: false,
      });
    } catch (err) {
      console.error('[TimerStore] Failed to pause session with marker:', err);
    }
  },

  dismissGuard: async (continueWorking: boolean) => {
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    if (continueWorking) {
      // User tapped "Still Working": push threshold forward by resetting startedAt
      const proj = await projectRepository.getById(activeProjectId);
      scheduleForgotTimerAlert(activeProjectId, proj?.title ?? 'Active Session').catch(() => {});

      set({
        isGuardAlertVisible: false,
        startedAt: Date.now(),
        accumulatedMs: get().accumulatedMs + THREE_HOURS_MS,
      });
    } else {
      // User tapped "Pause Now"
      await get().pause();
    }
  },

  tick: () => {
    const { startedAt, accumulatedMs, isGuardAlertVisible } = get();
    if (!startedAt) return;

    const now = Date.now();
    const totalElapsedMs = accumulatedMs + (now - startedAt);
    const elapsedSeconds = Math.floor(totalElapsedMs / 1000);

    // Trigger guard alert if running past 3 hours
    if (!isGuardAlertVisible && totalElapsedMs >= THREE_HOURS_MS) {
      set({ isGuardAlertVisible: true, elapsedSeconds });
    } else {
      set({ elapsedSeconds });
    }
  },
}));
