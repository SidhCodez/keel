import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Plus, Flame, Snowflake, Check, Trash2, Clock } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { habitRepository, HabitWithStatus } from '@/db/repositories/habitRepository';
import { HabitFormModal } from '@/components/habits/HabitFormModal';
import { NewHabit } from '@/db/schema';
import { subDays } from 'date-fns';

export default function HabitsScreen() {
  const [habitsList, setHabitsList] = useState<HabitWithStatus[]>([]);
  const [freezesUsed, setFreezesUsed] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const list = await habitRepository.getAllWithStatus();
      setHabitsList(list);

      const used = await habitRepository.getMonthlyFreezesUsed();
      setFreezesUsed(used);
    } catch (err) {
      console.error('[HabitsScreen] Load failed:', err);
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

  const handleToggleHabit = async (habitId: string) => {
    try {
      await habitRepository.toggleToday(habitId);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  const handleApplyFreeze = async (habitId: string, habitName: string) => {
    if (freezesUsed >= 2) {
      Alert.alert('No Freezes Remaining', 'You have used your 2 monthly rest day freezes. Freezes reset on the 1st of next month.');
      return;
    }

    Alert.alert(
      'Apply Rest-Day Freeze?',
      `Protect your streak on "${habitName}" for yesterday? You have ${2 - freezesUsed} freeze(s) remaining this month.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Freeze (❄️)',
          onPress: async () => {
            const yesterday = subDays(new Date(), 1);
            const success = await habitRepository.applyFreeze(habitId, yesterday);
            if (success) {
              Alert.alert('Streak Protected', 'Yesterday has been frozen and your streak is preserved!');
              await loadData();
            } else {
              Alert.alert('Freeze Failed', 'Could not apply freeze. Check monthly allowance.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteHabit = (habitId: string, name: string) => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await habitRepository.delete(habitId);
          await loadData();
        },
      },
    ]);
  };

  const handleCreateHabit = async (data: Omit<NewHabit, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>) => {
    await habitRepository.create(data);
    await loadData();
  };

  const freezesRemaining = Math.max(0, 2 - freezesUsed);

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
            Habits & Routines
          </Text>
          <TouchableOpacity
            onPress={() => setIsFormOpen(true)}
            className="w-10 h-10 rounded-full bg-bgCard border border-borderSubtle items-center justify-center active:bg-bgSubtle"
            accessibilityLabel="Add Habit"
          >
            <Plus color={colors.brandPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Monthly Freeze Allowance Bar */}
        <View className="mt-4 p-4 rounded-xl bg-bgCard border border-borderSubtle flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-8 h-8 rounded-lg bg-sky-950/60 border border-brandPrimary/30 items-center justify-center mr-2.5">
              <Snowflake size={16} color={colors.brandPrimary} />
            </View>
            <View>
              <Text className="text-xs font-bold text-textPrimary">
                Monthly Streak Freezes
              </Text>
              <Text className="text-[10px] text-textMuted">
                Protects streak when sick or traveling.
              </Text>
            </View>
          </View>
          <View className="px-2.5 py-1 rounded-full bg-sky-950/40 border border-brandPrimary/30">
            <Text className="text-xs font-bold text-brandPrimary">
              {freezesRemaining} of 2 Left
            </Text>
          </View>
        </View>

        {/* Habit Checklist */}
        <View className="mt-5 space-y-2.5 mb-12">
          {habitsList.length === 0 ? (
            <View className="p-6 rounded-2xl bg-bgCard border border-borderSubtle items-center">
              <Text className="text-sm font-semibold text-textPrimary mb-1">
                No Habits Tracked Yet
              </Text>
              <Text className="text-xs text-textSecondary text-center mb-4 leading-relaxed">
                Build unstoppable momentum. Create daily or weekday routines for gym, reading, hydration, or coding practice.
              </Text>
              <TouchableOpacity
                onPress={() => setIsFormOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-brandPrimary"
              >
                <Text className="text-xs font-bold text-black uppercase">
                  Add First Habit
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            habitsList.map((habit) => (
              <View
                key={habit.id}
                className="p-4 mb-2.5 rounded-xl bg-bgCard border border-borderSubtle"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-2">
                    <TouchableOpacity
                      onPress={() => handleToggleHabit(habit.id)}
                      className={`w-7 h-7 rounded-lg mr-3 items-center justify-center border-2 ${
                        habit.isCompletedToday
                          ? 'bg-brandSuccess border-brandSuccess'
                          : habit.isFrozenToday
                          ? 'bg-sky-900 border-brandPrimary'
                          : 'border-borderSubtle bg-bgSubtle'
                      } active:opacity-80`}
                    >
                      {habit.isCompletedToday && <Check size={16} color="#000000" strokeWidth={3} />}
                      {habit.isFrozenToday && <Snowflake size={14} color={colors.brandPrimary} />}
                    </TouchableOpacity>

                    <View className="flex-1">
                      <Text
                        className={`text-sm font-semibold ${
                          habit.isCompletedToday
                            ? 'line-through text-textMuted'
                            : habit.isFrozenToday
                            ? 'text-brandPrimary'
                            : 'text-textPrimary'
                        }`}
                      >
                        {habit.name}
                      </Text>

                      <View className="flex-row items-center mt-1">
                        <Text className="text-[10px] text-textMuted capitalize">
                          {habit.repeatType}
                        </Text>
                        {habit.reminderTime && (
                          <View className="flex-row items-center ml-2">
                            <Clock size={10} color={colors.textMuted} />
                            <Text className="ml-0.5 text-[10px] text-textMuted">
                              {habit.reminderTime} ({habit.reminderType})
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View className="items-end">
                    <View className="flex-row items-center px-2 py-0.5 rounded-md bg-amber-950/40 border border-brandWarning/30">
                      <Flame size={12} color={colors.brandWarning} />
                      <Text className="ml-1 text-xs font-bold text-brandWarning">
                        {habit.currentStreak}d
                      </Text>
                    </View>
                    <Text className="text-[10px] text-textMuted mt-1">
                      Best: {habit.bestStreak}d
                    </Text>
                  </View>
                </View>

                {/* Bottom Actions: Freeze Yesterday & Delete */}
                <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-borderSubtle/60">
                  <TouchableOpacity
                    onPress={() => handleApplyFreeze(habit.id, habit.name)}
                    className="flex-row items-center"
                  >
                    <Snowflake size={12} color={colors.brandPrimary} />
                    <Text className="ml-1 text-[11px] text-brandPrimary font-medium">
                      Freeze Yesterday (❄️)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteHabit(habit.id, habit.name)}
                    className="p-1 opacity-50 active:opacity-100"
                  >
                    <Trash2 size={13} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add / Edit Habit Modal */}
      <HabitFormModal
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateHabit}
      />
    </SafeAreaView>
  );
}
