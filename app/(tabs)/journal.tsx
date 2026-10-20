import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  BackHandler,
  AppState,
  Alert,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import { Lock, AlertTriangle, Calendar, Check, BookOpen, Clock, ShieldCheck, X } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { useJournalStore } from '@/stores/journalStore';
import { journalRepository } from '@/db/repositories/journalRepository';
import { JournalEntry } from '@/db/schema';
import { format } from 'date-fns';

export default function JournalScreen() {
  const isSunday = new Date().getDay() === 0;
  const [completedEntries, setCompletedEntries] = useState<JournalEntry[]>([]);
  const [hasDoneDailyToday, setHasDoneDailyToday] = useState(false);

  const {
    isLocked,
    sessionType,
    secondsRemaining,
    draftContent,
    wasResetByInterruption,
    isAutosaved,
    startSession,
    updateDraft,
    handleInterruption,
    tick,
    dismissInterruptionBanner,
  } = useJournalStore();

  // Keep screen awake while session is locked
  useKeepAwake();

  const loadHistory = useCallback(async () => {
    try {
      const entries = await journalRepository.getAllEntries();
      setCompletedEntries(entries);

      const doneToday = await journalRepository.hasCompletedToday('daily');
      setHasDoneDailyToday(doneToday);
    } catch (err) {
      console.error('[JournalScreen] Failed to load history:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // 1. BackHandler: Trap back button while locked
  useEffect(() => {
    if (!isLocked) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      ToastAndroid.show('Journal session is locked. Complete the session to exit.', ToastAndroid.SHORT);
      return true; // Prevents back navigation
    });

    return () => backHandler.remove();
  }, [isLocked]);

  // 2. AppState Listener: Reset penalty if leaving active app
  useEffect(() => {
    if (!isLocked) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        handleInterruption();
      }
    });

    return () => subscription.remove();
  }, [isLocked, handleInterruption]);

  // 3. Countdown Ticking Interval
  useEffect(() => {
    if (!isLocked) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, tick]);

  const handleStartDaily = () => {
    Alert.alert(
      'Enter 10-Minute Hard Lock?',
      'Once started, navigation and the back button are blocked. If you leave Keel, the clock resets to 10:00 as a focus penalty. Your draft is continuously autosaved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start 10:00 Session',
          onPress: async () => {
            await startSession('daily');
          },
        },
      ]
    );
  };

  const handleStartWeekly = () => {
    Alert.alert(
      'Begin Sunday Weekly Review?',
      'Initiating 20-minute deep reflection lock. Leaving the app resets the clock. Draft is autosaved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start 20:00 Review',
          onPress: async () => {
            await startSession('weekly');
          },
        },
      ]
    );
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // LOCKED IMMERSIVE WRITING MODE
  // ---------------------------------------------------------------------------
  if (isLocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} className="px-4 py-2">
        {/* Top Lock Status Bar */}
        <View className="flex-row items-center justify-between py-2 border-b border-borderSubtle mb-3">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-red-950/60 border border-brandDanger/40 items-center justify-center mr-2">
              <Lock size={16} color={colors.brandDanger} />
            </View>
            <View>
              <Text className="text-xs font-bold text-brandDanger uppercase tracking-wider">
                {sessionType === 'weekly' ? 'Sunday Review Locked' : 'Daily Journal Locked'}
              </Text>
              <Text className="text-[10px] text-textMuted font-mono">
                {isAutosaved ? 'Autosaved to SQLite ✓' : 'Saving...'}
              </Text>
            </View>
          </View>

          {/* Countdown Clock Display */}
          <View className="px-3.5 py-1.5 rounded-full bg-bgCard border border-borderFocus">
            <Text className="text-xl font-extrabold text-brandPrimary font-mono">
              {formatTimer(secondsRemaining)}
            </Text>
          </View>
        </View>

        {/* Reset Penalty Alert Banner */}
        {wasResetByInterruption && (
          <View className="p-3 mb-3 rounded-xl bg-red-950/40 border border-brandDanger flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <AlertTriangle size={16} color={colors.brandDanger} />
              <Text className="ml-2 text-xs font-bold text-brandDanger">
                Session was interrupted! Timer reset to 10:00 penalty. Draft is safe.
              </Text>
            </View>
            <TouchableOpacity onPress={dismissInterruptionBanner} className="p-1">
              <X size={14} color={colors.brandDanger} />
            </TouchableOpacity>
          </View>
        )}

        {/* Full-Screen Distraction-Free Text Editor */}
        <TextInput
          value={draftContent}
          onChangeText={updateDraft}
          placeholder="Write your honest reflection... What did you accomplish? Where did you slip? What will you do differently tomorrow?"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          className="flex-1 text-textPrimary text-base leading-relaxed font-normal pt-2"
        />

        <View className="py-2 border-t border-borderSubtle/60 flex-row justify-between items-center">
          <Text className="text-[11px] text-textMuted">
            {draftContent.trim().split(/\s+/).filter(Boolean).length} words
          </Text>
          <Text className="text-[11px] text-brandPrimary font-mono">
            Completes automatically when clock reaches 00:00
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // NORMAL DASHBOARD MODE (NOT LOCKED)
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
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
          <View className="flex-row items-center justify-between mb-3">
            <View className="w-12 h-12 rounded-xl bg-sky-950/50 border border-brandPrimary/30 items-center justify-center">
              <Lock size={22} color={colors.brandPrimary} />
            </View>

            {hasDoneDailyToday && (
              <View className="flex-row items-center px-2.5 py-1 rounded-full bg-emerald-950/40 border border-brandSuccess/30">
                <Check size={14} color={colors.brandSuccess} />
                <Text className="ml-1 text-xs font-bold text-brandSuccess">
                  Completed Today
                </Text>
              </View>
            )}
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
            onPress={handleStartDaily}
            className="flex-row items-center justify-center py-3.5 rounded-xl bg-brandPrimary active:opacity-90"
            accessibilityLabel="Start Daily Journal"
          >
            <Lock size={16} color="#000000" />
            <Text className="ml-2 text-sm font-bold text-black uppercase tracking-wider">
              {hasDoneDailyToday ? 'Start Another 10:00 Session' : 'Start 10-Minute Journal'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sunday Weekly Review Card */}
        <View className="mt-4 p-5 rounded-2xl bg-bgCard border border-borderSubtle">
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
            onPress={handleStartWeekly}
            className={`py-3 rounded-xl border items-center justify-center ${
              isSunday
                ? 'bg-bgSubtle border-brandPrimary active:opacity-90'
                : 'bg-bgSubtle/50 border-borderSubtle opacity-50'
            }`}
          >
            <Text className={`text-xs font-semibold ${isSunday ? 'text-brandPrimary' : 'text-textSecondary'}`}>
              {isSunday ? 'Begin Weekly Review (20 min)' : 'Available on Sunday'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reflection History */}
        <View className="mt-6 mb-12">
          <Text className="text-base font-bold text-textPrimary mb-3">
            Past Reflections ({completedEntries.length})
          </Text>

          {completedEntries.length === 0 ? (
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle items-center">
              <Text className="text-xs text-textMuted">
                No reflection entries yet. Complete your first 10-minute session today.
              </Text>
            </View>
          ) : (
            completedEntries.map((entry) => (
              <View
                key={entry.id}
                className="p-4 mb-2.5 rounded-xl bg-bgCard border border-borderSubtle"
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xs font-bold text-brandPrimary font-mono">
                    {entry.date} · {entry.type === 'weekly' ? 'Weekly Review (20m)' : 'Daily Journal (10m)'}
                  </Text>
                  {entry.interruptionsCount > 0 ? (
                    <Text className="text-[10px] text-brandWarning font-semibold">
                      {entry.interruptionsCount} reset penalty
                    </Text>
                  ) : null}
                </View>
                <Text className="text-xs text-textPrimary leading-relaxed" numberOfLines={4}>
                  {entry.content}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
