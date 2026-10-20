import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, AlertTriangle, Calendar, ShieldCheck } from 'lucide-react-native';
import { colors } from '@/styles/colors';

export default function JournalScreen() {
  const isSunday = new Date().getDay() === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView className="flex-1 px-4 pt-2">
        {/* Header */}
        <View className="pb-3 border-b border-borderSubtle">
          <Text className="text-2xl font-bold text-textPrimary tracking-tight">
            Distraction-Free Journal
          </Text>
          <Text className="text-xs text-textSecondary mt-1">
            Strict locked reflection clock for honest daily discipline.
          </Text>
        </View>

        {/* Daily 10-Minute Lock Card */}
        <View className="mt-5 p-5 rounded-2xl bg-bgCard border border-borderSubtle">
          <View className="w-12 h-12 rounded-xl bg-sky-950/50 border border-brandPrimary/30 items-center justify-center mb-4">
            <Lock size={22} color={colors.brandPrimary} />
          </View>

          <Text className="text-xl font-bold text-textPrimary mb-1">
            Daily Reflection
          </Text>
          <Text className="text-xs text-brandPrimary font-mono mb-4">
            Duration: Exactly 10 minutes (600s)
          </Text>

          {/* Hard Lock Rule Warning */}
          <View className="p-3.5 mb-5 rounded-xl bg-amber-950/30 border border-brandWarning/40 flex-row items-start">
            <AlertTriangle size={18} color={colors.brandWarning} style={{ marginTop: 2 }} />
            <View className="ml-2.5 flex-1">
              <Text className="text-xs font-bold text-brandWarning mb-0.5">
                Strict Focus Constraint
              </Text>
              <Text className="text-[11px] text-textSecondary leading-relaxed">
                Once started, the hardware back button is blocked and screen stays awake. If you leave Keel before 10 minutes elapse, the timer resets to 10:00. Your writing draft is continuously autosaved.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center py-3.5 rounded-xl bg-brandPrimary active:opacity-90"
            accessibilityLabel="Start Daily Journal"
          >
            <Lock size={16} color="#000000" />
            <Text className="ml-2 text-sm font-bold text-black uppercase tracking-wider">
              Start 10-Minute Journal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sunday Weekly Review Card */}
        <View className="mt-4 p-5 rounded-2xl bg-bgCard border border-borderSubtle mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Calendar size={18} color={colors.textSecondary} />
              <Text className="ml-2 text-base font-bold text-textPrimary">
                Sunday Weekly Review
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded bg-bgSubtle border border-borderSubtle">
              <Text className="text-[10px] font-semibold text-textSecondary uppercase">
                {isSunday ? 'Available Today' : 'Unlocks Sunday'}
              </Text>
            </View>
          </View>

          <Text className="text-xs text-textSecondary mb-4">
            20-minute deep reflection analyzing the past 7 days of work, habit consistency, and slips.
          </Text>

          <TouchableOpacity
            disabled={!isSunday}
            className={`py-3 rounded-xl border items-center justify-center ${
              isSunday
                ? 'bg-bgSubtle border-brandPrimary'
                : 'bg-bgSubtle/50 border-borderSubtle opacity-50'
            }`}
          >
            <Text className="text-xs font-semibold text-textSecondary">
              {isSunday ? 'Begin Weekly Review (20 min)' : 'Available on Sunday'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
