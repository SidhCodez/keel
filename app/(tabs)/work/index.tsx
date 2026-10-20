import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Clock, Calendar as CalendarIcon, Layers, Play, Pause, Bookmark, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { projectRepository, ProjectWithMetrics } from '@/db/repositories/projectRepository';
import { Bucket } from '@/rules/buckets';
import { useTimerStore } from '@/stores/timerStore';
import { ProjectFormModal } from '@/components/work/ProjectFormModal';
import { StoppedAtModal } from '@/components/work/StoppedAtModal';
import { ForgotTimerGuardModal } from '@/components/work/ForgotTimerGuardModal';
import { Project, NewProject } from '@/db/schema';

export default function WorkScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'buckets' | 'calendar'>('buckets');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [buckets, setBuckets] = useState<Record<Bucket, ProjectWithMetrics[]>>({
    today: [],
    tomorrow: [],
    this_week: [],
    later: [],
  });

  const {
    activeProjectId,
    elapsedSeconds,
    isGuardAlertVisible,
    isStoppedAtModalOpen,
    pausedProjectId,
    init,
    pause,
    submitStoppedAt,
    dismissGuard,
    tick,
  } = useTimerStore();

  const loadProjects = useCallback(async () => {
    try {
      const grouped = await projectRepository.getGroupedByBucket();
      setBuckets(grouped);
    } catch (err) {
      console.error('[WorkScreen] Failed to load projects:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
      init();
    }, [loadProjects, init])
  );

  // Timer interval
  useEffect(() => {
    if (!activeProjectId) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeProjectId, tick]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProjects();
    await init();
    setIsRefreshing(false);
  };

  const handleCreateProject = async (data: Omit<NewProject, 'id' | 'createdAt' | 'updatedAt' | 'slipCount' | 'status'>) => {
    await projectRepository.create(data);
    await loadProjects();
  };

  const activeProject = Object.values(buckets)
    .flat()
    .find((p) => p.id === (activeProjectId ?? pausedProjectId));

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return colors.tagCourse;
      case 'video': return colors.tagVideo;
      case 'documentation': return colors.tagDoc;
      case 'brainstorm': return colors.tagBrainstorm;
      default: return colors.tagTask;
    }
  };

  const renderProjectCard = (project: ProjectWithMetrics) => {
    const typeColor = getTypeColor(project.type);
    const isThisActive = activeProjectId === project.id;

    return (
      <TouchableOpacity
        key={project.id}
        onPress={() => router.push(`/work/${project.id}` as any)}
        className={`p-4 mb-2.5 rounded-xl bg-bgCard border ${
          isThisActive ? 'border-brandPrimary' : 'border-borderSubtle'
        } active:bg-bgSubtle`}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: `${typeColor}20`, borderColor: `${typeColor}50` }}
              className="px-2 py-0.5 rounded border"
            >
              <Text style={{ color: typeColor }} className="text-[10px] font-bold uppercase">
                {project.type}
              </Text>
            </View>

            {project.slipCount > 0 && (
              <View className="ml-2 px-1.5 py-0.5 rounded bg-red-950/50 border border-brandDanger/30 flex-row items-center">
                <AlertTriangle size={10} color={colors.brandDanger} />
                <Text className="ml-1 text-[10px] font-bold text-brandDanger">
                  {project.slipCount}x slip
                </Text>
              </View>
            )}
          </View>

          {project.dailyTarget !== null && project.dailyTarget > 0 && (
            <Text className="text-xs text-brandPrimary font-mono font-semibold">
              Target: {project.dailyTarget} {project.unitLabel ?? 'units'}/day
            </Text>
          )}
        </View>

        <Text className="text-base font-bold text-textPrimary mb-1">
          {project.title}
        </Text>

        {project.resumeMarker ? (
          <View className="flex-row items-center mt-1.5">
            <Bookmark size={12} color={colors.brandPrimary} />
            <Text className="ml-1.5 text-xs text-textSecondary font-mono" numberOfLines={1}>
              Stopped at: <Text className="text-textPrimary font-semibold">{project.resumeMarker}</Text>
            </Text>
          </View>
        ) : null}

        {project.deadline ? (
          <Text className="text-[11px] text-textMuted mt-2">
            Deadline: {project.deadline}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView
        className="flex-1 px-4 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.brandPrimary} />
        }
      >
        {/* Header Bar */}
        <View className="flex-row items-center justify-between pb-3 border-b border-borderSubtle">
          <Text className="text-2xl font-bold text-textPrimary tracking-tight">
            Work & Projects
          </Text>
          <TouchableOpacity
            onPress={() => setIsFormOpen(true)}
            className="w-10 h-10 rounded-full bg-bgCard border border-borderSubtle items-center justify-center active:bg-bgSubtle"
            accessibilityLabel="New Project"
          >
            <Plus color={colors.brandPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* View Mode Toggle */}
        <View className="flex-row my-4 p-1 rounded-xl bg-bgCard border border-borderSubtle">
          <TouchableOpacity
            onPress={() => setViewMode('buckets')}
            className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
              viewMode === 'buckets' ? 'bg-bgSubtle border border-borderFocus' : ''
            }`}
          >
            <Layers size={14} color={viewMode === 'buckets' ? colors.brandPrimary : colors.textMuted} />
            <Text
              className={`ml-1.5 text-xs font-semibold ${
                viewMode === 'buckets' ? 'text-brandPrimary' : 'text-textMuted'
              }`}
            >
              Buckets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('calendar')}
            className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
              viewMode === 'calendar' ? 'bg-bgSubtle border border-borderFocus' : ''
            }`}
          >
            <CalendarIcon size={14} color={viewMode === 'calendar' ? colors.brandPrimary : colors.textMuted} />
            <Text
              className={`ml-1.5 text-xs font-semibold ${
                viewMode === 'calendar' ? 'text-brandPrimary' : 'text-textMuted'
              }`}
            >
              Calendar Bars
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'buckets' ? (
          /* Auto-Buckets View */
          <View className="space-y-5 mb-24">
            {/* Bucket 1: Today & Overdue */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-bold text-brandDanger uppercase tracking-wider">
                  Today & Overdue ({buckets.today.length})
                </Text>
              </View>
              {buckets.today.length === 0 ? (
                <View className="p-3.5 rounded-xl bg-bgCard border border-borderSubtle">
                  <Text className="text-xs text-textMuted">No work items due today.</Text>
                </View>
              ) : (
                buckets.today.map(renderProjectCard)
              )}
            </View>

            {/* Bucket 2: Tomorrow */}
            <View className="mt-4">
              <Text className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2">
                Tomorrow ({buckets.tomorrow.length})
              </Text>
              {buckets.tomorrow.length === 0 ? (
                <View className="p-3.5 rounded-xl bg-bgCard border border-borderSubtle">
                  <Text className="text-xs text-textMuted">Nothing due tomorrow.</Text>
                </View>
              ) : (
                buckets.tomorrow.map(renderProjectCard)
              )}
            </View>

            {/* Bucket 3: This Week */}
            <View className="mt-4">
              <Text className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2">
                This Week ({buckets.this_week.length})
              </Text>
              {buckets.this_week.length === 0 ? (
                <View className="p-3.5 rounded-xl bg-bgCard border border-borderSubtle">
                  <Text className="text-xs text-textMuted">No additional deadlines this week.</Text>
                </View>
              ) : (
                buckets.this_week.map(renderProjectCard)
              )}
            </View>

            {/* Bucket 4: Later */}
            <View className="mt-4">
              <Text className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2">
                Later (Backlog: {buckets.later.length})
              </Text>
              {buckets.later.length === 0 ? (
                <View className="p-3.5 rounded-xl bg-bgCard border border-borderSubtle">
                  <Text className="text-xs text-textMuted">No backlog items.</Text>
                </View>
              ) : (
                buckets.later.map(renderProjectCard)
              )}
            </View>
          </View>
        ) : (
          /* Calendar View Mode */
          <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle mb-24">
            <Text className="text-sm font-bold text-textPrimary mb-2">
              Timeline Bars
            </Text>
            <Text className="text-xs text-textSecondary mb-4">
              Visual project spans and completion dates.
            </Text>

            {Object.values(buckets).flat().length === 0 ? (
              <Text className="text-xs text-textMuted">No projects to display.</Text>
            ) : (
              Object.values(buckets).flat().map((p) => {
                const color = getTypeColor(p.type);
                return (
                  <View key={p.id} className="mb-3">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-semibold text-textPrimary">{p.title}</Text>
                      <Text className="text-[10px] text-textMuted">{p.deadline ?? 'No deadline'}</Text>
                    </View>
                    <View className="w-full h-3 rounded-full bg-bgSubtle overflow-hidden">
                      <View
                        style={{
                          width: `${Math.min(100, Math.max(15, (p.completedUnits / (p.totalUnits || 1)) * 100))}%`,
                          backgroundColor: color,
                        }}
                        className="h-full rounded-full"
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky Active Session Banner (Survives App Kill) */}
      {activeProjectId && activeProject && (
        <View className="absolute bottom-2 left-4 right-4 p-3.5 rounded-2xl bg-bgCard border-2 border-brandPrimary flex-row items-center justify-between shadow-2xl">
          <TouchableOpacity
            onPress={() => router.push(`/work/${activeProjectId}` as any)}
            className="flex-1 mr-3"
          >
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-brandPrimary animate-pulse mr-2" />
              <Text className="text-xs font-bold text-brandPrimary uppercase tracking-wider">
                Timer Running
              </Text>
            </View>
            <Text className="text-sm font-bold text-textPrimary" numberOfLines={1}>
              {activeProject.title}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Text className="text-base font-extrabold text-textPrimary font-mono mr-3">
              {formatTimer(elapsedSeconds)}
            </Text>
            <TouchableOpacity
              onPress={pause}
              className="w-10 h-10 rounded-xl bg-brandWarning items-center justify-center active:opacity-90"
            >
              <Pause size={18} color="#000000" fill="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Create / Edit Project Modal */}
      <ProjectFormModal
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* "Stopped at?" Modal */}
      {activeProject && (
        <StoppedAtModal
          visible={isStoppedAtModalOpen}
          projectType={activeProject.type as any}
          projectTitle={activeProject.title}
          currentMarker={activeProject.resumeMarker}
          onSubmit={async (marker) => {
            await submitStoppedAt(marker);
            await loadProjects();
          }}
          onSkip={async () => {
            await submitStoppedAt(activeProject.resumeMarker ?? '');
            await loadProjects();
          }}
        />
      )}

      {/* 3-Hour Forgot-Timer Guard Modal */}
      {activeProject && (
        <ForgotTimerGuardModal
          visible={isGuardAlertVisible}
          projectTitle={activeProject.title}
          onKeepGoing={() => dismissGuard(true)}
          onPauseNow={() => dismissGuard(false)}
        />
      )}
    </SafeAreaView>
  );
}
