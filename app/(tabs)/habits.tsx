import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Flame, Snowflake, Check } from 'lucide-react-native';
import { colors } from '@/styles/colors';

export default function HabitsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView className="flex-1 px-4 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between pb-3 border-b border-borderSubtle">
          <Text className="text-2xl font-bold text-textPrimary tracking-tight">
            Habits & Routines
          </Text>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-bgCard border border-borderSubtle items-center justify-center active:bg-bgSubtle"
            accessibilityLabel="Add Habit"
          >
            <Plus color={colors.brandPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Freeze Allowance Bar */}
        <View className="mt-4 p-3.5 rounded-xl bg-bgCard border border-borderSubtle flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Snowflake size={18} color={colors.brandPrimary} />
            <Text className="ml-2 text-xs font-semibold text-textPrimary">
              Monthly Rest Freezes
            </Text>
          </View>
          <View className="px-2.5 py-1 rounded-full bg-sky-950/40 border border-brandPrimary/30">
            <Text className="text-xs font-bold text-brandPrimary">
              2 of 2 Available
            </Text>
          </View>
        </View>

        {/* Habit Checklist */}
        <View className="mt-5 space-y-2.5">
          {[
            { id: '1', name: 'Morning Hydration (1L)', freq: 'Daily', streak: 12, best: 24, done: false },
            { id: '2', name: 'Gym - Strength Training', freq: 'Weekdays', streak: 4, best: 19, done: false },
            { id: '3', name: 'Technical Reading (20 min)', freq: 'Daily', streak: 7, best: 14, done: false },
            { id: '4', name: 'Open Source Contribution', freq: 'Mon, Wed, Fri', streak: 3, best: 8, done: true },
          ].map((habit) => (
            <View
              key={habit.id}
              className="p-4 mb-2.5 rounded-xl bg-bgCard border border-borderSubtle"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <TouchableOpacity
                    className={`w-7 h-7 rounded-lg mr-3.5 items-center justify-center border-2 ${
                      habit.done
                        ? 'bg-brandSuccess border-brandSuccess'
                        : 'border-borderSubtle bg-bgSubtle'
                    }`}
                  >
                    {habit.done && <Check size={16} color="#000000" strokeWidth={3} />}
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-semibold ${
                        habit.done ? 'line-through text-textMuted' : 'text-textPrimary'
                      }`}
                    >
                      {habit.name}
                    </Text>
                    <Text className="text-[11px] text-textSecondary mt-0.5">
                      {habit.freq}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <View className="flex-row items-center px-2 py-0.5 rounded-md bg-amber-950/40 border border-brandWarning/30">
                    <Flame size={12} color={colors.brandWarning} />
                    <Text className="ml-1 text-xs font-bold text-brandWarning">
                      {habit.streak}d
                    </Text>
                  </View>
                  <Text className="text-[10px] text-textMuted mt-1">
                    Best: {habit.best}d
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
