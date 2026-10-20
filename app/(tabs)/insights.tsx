import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Flame, Clock, AlertCircle, CheckCircle2, TrendingUp, Layers } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { insightsRepository, HabitInsightsData, WorkInsightsData } from '@/db/repositories/insightsRepository';

export default function InsightsScreen() {
  const [section, setSection] = useState<'habits' | 'work'>('habits');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [habitData, setHabitData] = useState<HabitInsightsData>({
    weeklyRate: 0,
    totalHabits: 0,
    topHabitName: null,
    topStreak: 0,
    heatmapData: [],
  });

  const [workData, setWorkData] = useState<WorkInsightsData>({
    totalFocusSeconds: 0,
    completedCount: 0,
    onTimeRate: 100,
    totalSlips: 0,
    typeBreakdown: [],
  });

  const loadData = useCallback(async () => {
    try {
      const hData = await insightsRepository.getHabitInsights();
      setHabitData(hData);

      const wData = await insightsRepository.getWorkInsights();
      setWorkData(wData);
    } catch (err) {
      console.error('[InsightsScreen] Load failed:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const formatHours = (seconds: number) => {
    const hours = (seconds / 3600).toFixed(1);
    return `${hours}h`;
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
        <View className="pb-3 border-b border-borderSubtle">
          <Text className="text-2xl font-bold text-textPrimary tracking-tight">
            Honest Insights
          </Text>
          <Text className="text-xs text-textSecondary mt-1">
            Separated accountability metrics for habits and projects.
          </Text>
        </View>

        {/* Section Segmented Control */}
        <View className="flex-row my-4 p-1 rounded-xl bg-bgCard border border-borderSubtle">
          <TouchableOpacity
            onPress={() => setSection('habits')}
            className={`flex-1 py-2 rounded-lg items-center justify-center ${
              section === 'habits' ? 'bg-bgSubtle border border-borderFocus' : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                section === 'habits' ? 'text-brandPrimary' : 'text-textMuted'
              }`}
            >
              Habits Insights
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSection('work')}
            className={`flex-1 py-2 rounded-lg items-center justify-center ${
              section === 'work' ? 'bg-bgSubtle border border-borderFocus' : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                section === 'work' ? 'text-brandPrimary' : 'text-textMuted'
              }`}
            >
              Work & Slips
            </Text>
          </TouchableOpacity>
        </View>

        {section === 'habits' ? (
          /* Habits Analytics */
          <View className="space-y-4 mb-12">
            <View className="flex-row space-x-3">
              <View className="flex-1 p-4 rounded-xl bg-bgCard border border-borderSubtle mr-2">
                <Text className="text-xs text-textSecondary mb-1">Consistency</Text>
                <Text className="text-2xl font-bold text-brandSuccess">{habitData.weeklyRate}%</Text>
                <Text className="text-[10px] text-textMuted mt-1">Past 7 days</Text>
              </View>

              <View className="flex-1 p-4 rounded-xl bg-bgCard border border-borderSubtle">
                <Text className="text-xs text-textSecondary mb-1">Active Routines</Text>
                <Text className="text-2xl font-bold text-brandWarning font-mono">
                  {habitData.totalHabits}
                </Text>
                <Text className="text-[10px] text-textMuted mt-1">Tracked locally</Text>
              </View>
            </View>

            {/* 12-Week (84-Day) Habit Heatmap */}
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle mt-3">
              <Text className="text-sm font-bold text-textPrimary mb-1">
                84-Day Rhythm Heatmap
              </Text>
              <Text className="text-xs text-textSecondary mb-3">
                Daily completion density across all scheduled routines.
              </Text>

              {habitData.heatmapData.length === 0 ? (
                <Text className="text-xs text-textMuted py-4">No habit history logged yet.</Text>
              ) : (
                <View className="flex-row justify-between py-2">
                  {Array.from({ length: 12 }).map((_, colIdx) => (
                    <View key={colIdx} className="space-y-1">
                      {Array.from({ length: 7 }).map((_, rowIdx) => {
                        const itemIdx = colIdx * 7 + rowIdx;
                        const cell = habitData.heatmapData[itemIdx];
                        const intensity = cell?.intensity ?? 0;
                        const cellColor =
                          intensity === 0
                            ? '#1C1C20'
                            : intensity === 1
                            ? '#14532D'
                            : intensity === 2
                            ? '#16A34A'
                            : '#22C55E';

                        return (
                          <View
                            key={rowIdx}
                            style={{
                              width: 17,
                              height: 17,
                              borderRadius: 3.5,
                              backgroundColor: cellColor,
                              marginBottom: 4,
                            }}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}

              <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-borderSubtle/60">
                <Text className="text-[10px] text-textMuted">Less active</Text>
                <View className="flex-row space-x-1 items-center">
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#1C1C20', marginRight: 4 }} />
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#14532D', marginRight: 4 }} />
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#16A34A', marginRight: 4 }} />
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#22C55E' }} />
                </View>
                <Text className="text-[10px] text-textMuted">Fully checked</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Work Analytics */
          <View className="space-y-4 mb-12">
            <View className="flex-row space-x-3">
              <View className="flex-1 p-4 rounded-xl bg-bgCard border border-borderSubtle mr-2">
                <Text className="text-xs text-textSecondary mb-1">Focus Time</Text>
                <Text className="text-2xl font-bold text-brandPrimary font-mono">
                  {formatHours(workData.totalFocusSeconds)}
                </Text>
                <Text className="text-[10px] text-textMuted mt-1">Total across projects</Text>
              </View>

              <View className="flex-1 p-4 rounded-xl bg-bgCard border border-borderSubtle">
                <Text className="text-xs text-textSecondary mb-1">On-Time Rate</Text>
                <Text className="text-2xl font-bold text-brandSuccess">
                  {workData.onTimeRate}%
                </Text>
                <Text className="text-[10px] text-textMuted mt-1">
                  {workData.completedCount} completed
                </Text>
              </View>
            </View>

            {/* Slip Accountability Card */}
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle mt-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-bold text-textPrimary">
                  Slip & Procrastination Count
                </Text>
                <View className="px-2.5 py-0.5 rounded-full bg-red-950/40 border border-brandDanger/40">
                  <Text className="text-xs font-bold text-brandDanger">
                    {workData.totalSlips} Slips
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-textSecondary leading-relaxed">
                Keel honestly logs every time a project deadline is postponed or snoozed.
              </Text>
            </View>

            {/* Time Distribution By Project Type */}
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle mt-3">
              <Text className="text-sm font-bold text-textPrimary mb-3">
                Focus Time by Project Type
              </Text>
              {workData.typeBreakdown.length === 0 ? (
                <Text className="text-xs text-textMuted">No sessions recorded yet.</Text>
              ) : (
                workData.typeBreakdown.map((item) => (
                  <View key={item.type} className="flex-row items-center justify-between py-2 border-b border-borderSubtle/50">
                    <Text className="text-xs font-bold text-textPrimary capitalize">
                      {item.type}
                    </Text>
                    <Text className="text-xs font-mono font-semibold text-brandPrimary">
                      {formatHours(item.seconds)} ({item.count} sessions)
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
