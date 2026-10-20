import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Play, Pause, Plus, CheckCircle2, Clock, Bookmark, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { projectRepository, ProjectWithMetrics } from '@/db/repositories/projectRepository';
import { habitRepository, HabitWithStatus } from '@/db/repositories/habitRepository';
import { Project } from '@/db/schema';
import { useTimerStore } from '@/stores/timerStore';
import { ProjectFormModal } from '@/components/work/ProjectFormModal';
import { StoppedAtModal } from '@/components/work/StoppedAtModal';

export default function TodayScreen() {
  const router = useRouter();
  const [continueTarget, setContinueTarget] = useState<Project | null>(null);
  const [todayWork, setTodayWork] = useState<ProjectWithMetrics[]>([]);
  const [pendingHabits, setPendingHabits] = useState<HabitWithStatus[]>([]);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  const {
    activeProjectId,
    elapsedSeconds,
    isStoppedAtModalOpen,
    start,
    pause,
    submitStoppedAt,
    init,
    tick,
  } = useTimerStore();

  const loadDashboard = useCallback(async () => {
    try {
      const target = await projectRepository.getContinueTarget();
      setContinueTarget(target?.project ?? null);

      const grouped = await projectRepository.getGroupedByBucket();
      setTodayWork(grouped.today);

      const allHabits = await habitRepository.getAllWithStatus();
      setPendingHabits(allHabits.filter((h) => !h.isCompletedToday));
    } catch (err) {
      console.error('[TodayScreen] Load failed:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      init();
    }, [loadDashboard, init])
  );

  useEffect(() => {
    if (!activeProjectId) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeProjectId, tick]);

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isContinueProjectActive = activeProjectId === continueTarget?.id;

  // The 2-Tap Resume North Star:
  // Tap 1: Click "Resume" on Continue Card -> Opens Link & Starts Session Timer
  const handleResumeContinueTarget = async () => {
    if (!continueTarget) return;

    // Start timer immediately
    await start(continueTarget.id);

    // Open link if attached
    if (continueTarget.link) {
      try {
        const canOpen = await Linking.canOpenURL(continueTarget.link);
        if (canOpen) {
          await Linking.openURL(continueTarget.link);
        }
      } catch (err) {
        console.warn('Could not open continue URL:', err);
      }
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View className="flex-row items-center justify-between pb-3 border-b border-borderSubtle">
          <View>
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
              {todayDateStr}
            </Text>
            <Text className="text-2xl font-bold text-textPrimary tracking-tight">
              Keel
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsQuickCaptureOpen(true)}
            className="w-10 h-10 rounded-full bg-bgCard border border-borderSubtle items-center justify-center active:bg-bgSubtle"
            accessibilityLabel="Quick capture"
          >
            <Plus color={colors.brandPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Continue Hero Card (North Star Benchmark) */}
        {continueTarget ? (
          <View className="mt-4 p-4 rounded-2xl bg-bgCard border-2 border-borderFocus shadow-xl">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-brandPrimary tracking-wider uppercase">
                {isContinueProjectActive ? 'Session Active Now' : 'Continue Where You Left Off'}
              </Text>
              <View className="px-2 py-0.5 rounded bg-blue-950/60 border border-tagCourse/40">
                <Text className="text-[10px] font-bold text-tagCourse uppercase">
                  {continueTarget.type}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push(`/work/${continueTarget.id}` as any)}
              className="mb-2"
            >
              <Text className="text-lg font-bold text-textPrimary" numberOfLines={1}>
                {continueTarget.title}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center mb-4">
              <Clock size={13} color={colors.textSecondary} />
              <Text className="ml-1.5 text-xs text-textSecondary font-mono">
                Stopped at:{' '}
                <Text className="text-textPrimary font-semibold">
                  {continueTarget.resumeMarker || 'Not set yet'}
                </Text>
              </Text>
            </View>

            {isContinueProjectActive ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-extrabold text-brandPrimary font-mono">
                  {formatTimer(elapsedSeconds)}
                </Text>
                <TouchableOpacity
                  onPress={pause}
                  className="px-5 py-2.5 rounded-xl bg-brandWarning flex-row items-center active:opacity-90"
                >
                  <Pause size={16} color="#000000" fill="#000000" />
                  <Text className="ml-1.5 text-xs font-bold text-black uppercase">
                    Pause Session
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleResumeContinueTarget}
                className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-brandPrimary active:opacity-90"
              >
                <Play size={16} color="#000000" fill="#000000" />
                <Text className="ml-2 text-xs font-bold text-black uppercase tracking-wider">
                  Resume (Opens Link & Starts Timer)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="mt-4 p-5 rounded-2xl bg-bgCard border border-borderSubtle items-center">
            <Text className="text-sm font-semibold text-textPrimary mb-1">
              Welcome to Keel
            </Text>
            <Text className="text-xs text-textSecondary text-center mb-3">
              Add your first course, video, or coding project to enable the 2-tap resume cockpit.
            </Text>
            <TouchableOpacity
              onPress={() => setIsQuickCaptureOpen(true)}
              className="px-4 py-2 rounded-lg bg-brandPrimary"
            >
              <Text className="text-xs font-bold text-black uppercase">
                Add Project
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Habits Pending Today Section */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-base font-bold text-textPrimary">
              Habits Pending Today ({pendingHabits.length})
            </Text>
          </View>

          {pendingHabits.length === 0 ? (
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle items-center">
              <Text className="text-xs text-brandSuccess font-semibold">
                ✓ All scheduled habits completed today!
              </Text>
            </View>
          ) : (
            <View className="space-y-2">
              {pendingHabits.map((habit) => (
                <View
                  key={habit.id}
                  className="flex-row items-center justify-between p-3.5 mb-2 rounded-xl bg-bgCard border border-borderSubtle"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <TouchableOpacity
                      onPress={async () => {
                        await habitRepository.toggleToday(habit.id);
                        await loadDashboard();
                      }}
                      className="w-6 h-6 rounded-md border-2 border-borderSubtle mr-3 items-center justify-center bg-bgSubtle active:opacity-80"
                    />
                    <Text className="text-sm font-medium text-textPrimary">
                      {habit.name}
                    </Text>
                  </View>
                  <View className="px-2 py-0.5 rounded-full bg-amber-950/40 border border-brandWarning/30">
                    <Text className="text-[11px] font-semibold text-brandWarning">
                      🔥 {habit.currentStreak}d
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Work Pending Today Section */}
        <View className="mt-6 mb-10">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-base font-bold text-textPrimary">
              Work Pending Today ({todayWork.length})
            </Text>
          </View>

          {todayWork.length === 0 ? (
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle items-center">
              <Text className="text-xs text-textMuted">
                No deadlines due today. Great work!
              </Text>
            </View>
          ) : (
            todayWork.map((project) => (
              <TouchableOpacity
                key={project.id}
                onPress={() => router.push(`/work/${project.id}` as any)}
                className="p-3.5 mb-2.5 rounded-xl bg-bgCard border border-borderSubtle active:bg-bgSubtle"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-tagCourse/40">
                    <Text className="text-[10px] font-semibold text-tagCourse uppercase">
                      {project.type}
                    </Text>
                  </View>
                  {project.dailyTarget !== null && project.dailyTarget > 0 && (
                    <Text className="text-xs text-brandPrimary font-mono">
                      Target: {project.dailyTarget} {project.unitLabel ?? 'units'}/day
                    </Text>
                  )}
                </View>
                <Text className="text-sm font-semibold text-textPrimary mt-1">
                  {project.title}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Quick Capture Project Modal */}
      <ProjectFormModal
        visible={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSubmit={async (data) => {
          await projectRepository.create(data);
          await loadDashboard();
        }}
      />

      {/* "Stopped at?" Modal */}
      {continueTarget && (
        <StoppedAtModal
          visible={isStoppedAtModalOpen}
          projectType={continueTarget.type as any}
          projectTitle={continueTarget.title}
          currentMarker={continueTarget.resumeMarker}
          onSubmit={async (marker) => {
            await submitStoppedAt(marker);
            await loadDashboard();
          }}
          onSkip={async () => {
            await submitStoppedAt(continueTarget.resumeMarker ?? '');
            await loadDashboard();
          }}
        />
      )}
    </SafeAreaView>
  );
}
