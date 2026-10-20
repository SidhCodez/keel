import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Clock, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { colors } from '@/styles/colors';

export default function InsightsScreen() {
  const [section, setSection] = useState<'habits' | 'work'>('habits');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView className="flex-1 px-4 pt-2">
        {/* Header */}
        <View className="pb-3 border-b border-borderSubtle">
          <Text className="text-2xl font-bold text-textPrimary tracking-tight">
            Honest Insights
          </Text>
          <Text className="text-xs text-textSecondary mt-1">
            Separate accountability metrics for routines and projects.
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
          <View className="space-y-4 mb-8">
            {/* Top Metric Cards */}
            <View className="flex-row space-x-3">
              <View className="flex-1 p-4 rounded-xl bg-bgCard border border-borderSubtle mr-2">
                <Text className="text-xs text-textSecondary mb-1">Consistency</Text>
                <Text className="text-2xl font-bold text-brandSuccess">86%</Text>
                <Text className="text-[10px] text-textMuted mt-1">Past 7 days</Text>
              </View>

              <View className="flex-1 p-4 rounded-xl bg-bgCard border border-borderSubtle">
                <Text className="text-xs text-textSecondary mb-1">Top Streak</Text>
                <Text className="text-2xl font-bold text-brandWarning">12 Days</Text>
                <Text className="text-[10px] text-textMuted mt-1">Hydration Habit</Text>
              </View>
            </View>

            {/* 90-Day Contribution Heatmap Preview */}
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle mt-3">
              <Text className="text-sm font-bold text-textPrimary mb-1">
                90-Day Habit Rhythm
              </Text>
              <Text className="text-xs text-textSecondary mb-3">
                Daily completion density across all active routines.
              </Text>

              {/* Heatmap Grid Simulation (7 rows x 12 columns) */}
              <View className="flex-row justify-between py-2">
                {Array.from({ length: 12 }).map((_, colIdx) => (
                  <View key={colIdx} className="space-y-1">
                    {Array.from({ length: 7 }).map((_, rowIdx) => {
                      const intensity = (colIdx * 7 + rowIdx) % 4;
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
                            width: 16,
                            height: 16,
                            borderRadius: 3,
                            backgroundColor: cellColor,
                            marginBottom: 4,
                          }}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* Work Analytics */
          <View className="space-y-4 mb-8">
            <View className="flex-row space-x-3">
              <View className="flex-1 p-4 rounded-xl bg-bgCard border border-borderSubtle mr-2">
                <Text className="text-xs text-textSecondary mb-1">Focus Logged</Text>
                <Text className="text-2xl font-bold text-brandPrimary font-mono">18.4h</Text>
                <Text className="text-[10px] text-textMuted mt-1">This week</Text>
              </View>

              <View className="flex-1 p-4 rounded-xl bg-bgCard border border-borderSubtle">
                <Text className="text-xs text-textSecondary mb-1">On-Time Rate</Text>
                <Text className="text-2xl font-bold text-brandSuccess">80%</Text>
                <Text className="text-[10px] text-textMuted mt-1">4 of 5 on time</Text>
              </View>
            </View>

            {/* Slip Accountability Card */}
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle mt-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-bold text-textPrimary">
                  Slip & Delay Tracking
                </Text>
                <View className="px-2 py-0.5 rounded-full bg-red-950/40 border border-brandDanger/30">
                  <Text className="text-xs font-bold text-brandDanger">2 Slips</Text>
                </View>
              </View>
              <Text className="text-xs text-textSecondary leading-relaxed">
                Keel honestly logs every time a project deadline is postponed or snoozed. Average delay on slipped items: <Text className="text-brandDanger font-semibold">1.5 days</Text>.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
