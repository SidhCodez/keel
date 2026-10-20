import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Clock, ExternalLink, Calendar as CalendarIcon, Layers } from 'lucide-react-native';
import { colors } from '@/styles/colors';

export default function WorkScreen() {
  const [viewMode, setViewMode] = useState<'buckets' | 'calendar'>('buckets');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView className="flex-1 px-4 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between pb-3 border-b border-borderSubtle">
          <Text className="text-2xl font-bold text-textPrimary tracking-tight">
            Work & Projects
          </Text>
          <TouchableOpacity
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

        {/* Auto-Buckets List */}
        <View className="space-y-5 mb-8">
          {/* Bucket 1: Today & Overdue */}
          <View>
            <View className="flex-row items-center justify-between mb-2.5">
              <Text className="text-sm font-bold text-brandDanger uppercase tracking-wider">
                Today & Overdue (1)
              </Text>
            </View>

            <View className="p-4 mb-2 rounded-xl bg-bgCard border border-borderSubtle">
              <View className="flex-row items-center justify-between mb-2">
                <View className="px-2 py-0.5 rounded bg-blue-950/60 border border-tagCourse/40">
                  <Text className="text-[10px] font-semibold text-tagCourse uppercase">Course</Text>
                </View>
                <Text className="text-xs text-brandPrimary font-mono">Target: 3 lessons/day</Text>
              </View>
              <Text className="text-base font-bold text-textPrimary">
                Advanced System Design
              </Text>
              <View className="flex-row items-center mt-2.5">
                <Clock size={13} color={colors.textSecondary} />
                <Text className="ml-1.5 text-xs text-textSecondary font-mono">
                  Stopped at: Lesson 14
                </Text>
              </View>
            </View>
          </View>

          {/* Bucket 2: Tomorrow */}
          <View className="mt-4">
            <Text className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2.5">
              Tomorrow (1)
            </Text>
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle">
              <View className="flex-row items-center justify-between mb-2">
                <View className="px-2 py-0.5 rounded bg-emerald-950/60 border border-tagDoc/40">
                  <Text className="text-[10px] font-semibold text-tagDoc uppercase">Doc</Text>
                </View>
                <Text className="text-xs text-textSecondary font-mono">Due Tomorrow</Text>
              </View>
              <Text className="text-base font-bold text-textPrimary">
                SQLite WAL & Vacuum Architecture
              </Text>
            </View>
          </View>

          {/* Bucket 3: This Week */}
          <View className="mt-4">
            <Text className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2.5">
              This Week (2)
            </Text>
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle">
              <View className="flex-row items-center justify-between mb-2">
                <View className="px-2 py-0.5 rounded bg-red-950/60 border border-tagVideo/40">
                  <Text className="text-[10px] font-semibold text-tagVideo uppercase">Video</Text>
                </View>
                <Text className="text-xs text-textSecondary font-mono">Due Friday</Text>
              </View>
              <Text className="text-base font-bold text-textPrimary">
                React Native Architecture Deep Dive
              </Text>
            </View>
          </View>

          {/* Bucket 4: Later */}
          <View className="mt-4">
            <Text className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2.5">
              Later (Backlog)
            </Text>
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle">
              <Text className="text-sm text-textSecondary">
                Items without immediate deadlines or placed in long-term backlog.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
