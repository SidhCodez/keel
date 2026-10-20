import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Plus, CheckCircle2, Clock } from 'lucide-react-native';
import { colors } from '@/styles/colors';

export default function TodayScreen() {
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView className="flex-1 px-4 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between pb-4 border-b border-borderSubtle">
          <View>
            <Text className="text-xs font-medium text-textSecondary uppercase tracking-wider">
              {todayDateStr}
            </Text>
            <Text className="text-2xl font-bold text-textPrimary tracking-tight">
              Keel
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-bgCard border border-borderSubtle items-center justify-center active:bg-bgSubtle"
            accessibilityLabel="Quick capture"
          >
            <Plus color={colors.brandPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Continue Hero Card (The 2-Tap Resume North Star) */}
        <View className="mt-4 p-4 rounded-xl bg-bgCard border border-borderSubtle">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-brandPrimary tracking-wider uppercase">
              Continue Where You Left Off
            </Text>
            <View className="px-2 py-0.5 rounded bg-blue-950/60 border border-tagCourse/40">
              <Text className="text-[10px] font-semibold text-tagCourse uppercase">Course</Text>
            </View>
          </View>

          <Text className="text-lg font-bold text-textPrimary mb-1">
            Advanced System Design
          </Text>

          <View className="flex-row items-center mb-4">
            <Clock size={14} color={colors.textSecondary} />
            <Text className="ml-1.5 text-xs text-textSecondary">
              Stopped at: <Text className="text-textPrimary font-mono font-medium">Lesson 14 - Sharding</Text>
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center py-3 px-4 rounded-lg bg-brandPrimary active:opacity-90"
            accessibilityLabel="Resume working"
          >
            <Play size={16} color="#000000" fill="#000000" />
            <Text className="ml-2 text-sm font-bold text-black">
              Resume (1-Tap Link & Timer)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Habits Pending Today */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-textPrimary">
              Habits Pending Today
            </Text>
            <Text className="text-xs text-textSecondary">3 remaining</Text>
          </View>

          <View className="space-y-2">
            {[
              { id: '1', title: 'Morning Hydration (1L)', streak: 12 },
              { id: '2', title: 'Gym - Push Routine', streak: 4 },
              { id: '3', title: 'Read System Docs (20 min)', streak: 7 },
            ].map((habit) => (
              <View
                key={habit.id}
                className="flex-row items-center justify-between p-3.5 mb-2 rounded-xl bg-bgCard border border-borderSubtle"
              >
                <View className="flex-row items-center flex-1">
                  <TouchableOpacity className="w-6 h-6 rounded-md border-2 border-borderSubtle mr-3 items-center justify-center">
                    {/* Empty checkbox */}
                  </TouchableOpacity>
                  <Text className="text-sm font-medium text-textPrimary">
                    {habit.title}
                  </Text>
                </View>
                <View className="px-2 py-0.5 rounded-full bg-amber-950/40 border border-brandWarning/30">
                  <Text className="text-[11px] font-semibold text-brandWarning">
                    🔥 {habit.streak}d
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Work Pending Today */}
        <View className="mt-6 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-textPrimary">
              Work Pending Today
            </Text>
            <Text className="text-xs text-brandDanger font-medium">1 overdue</Text>
          </View>

          <View className="p-3.5 mb-2.5 rounded-xl bg-bgCard border border-borderSubtle">
            <View className="flex-row items-center justify-between mb-1">
              <View className="px-1.5 py-0.5 rounded bg-red-950/60 border border-brandDanger/40">
                <Text className="text-[10px] font-semibold text-brandDanger uppercase">Overdue (1d)</Text>
              </View>
              <Text className="text-xs text-brandPrimary font-mono">Target: 4 lessons/day</Text>
            </View>
            <Text className="text-sm font-semibold text-textPrimary mt-1">
              Distributed Systems Course
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
