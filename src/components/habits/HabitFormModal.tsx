import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { X, Flame, Clock, Bell, AlertCircle } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { Habit, NewHabit } from '@/db/schema';

interface HabitFormModalProps {
  visible: boolean;
  habitToEdit?: Habit | null;
  onClose: () => void;
  onSubmit: (data: Omit<NewHabit, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
  { day: 7, label: 'S' },
];

const REMINDER_TYPES = [
  { type: 'nudge', label: 'Nudge', desc: 'Soft notification' },
  { type: 'alarm', label: 'Alarm', desc: 'Rings until dismissed' },
  { type: 'escalate', label: 'Escalate', desc: 'Nudge → Firm → Alarm' },
] as const;

export function HabitFormModal({
  visible,
  habitToEdit,
  onClose,
  onSubmit,
}: HabitFormModalProps) {
  const [name, setName] = useState('');
  const [repeatType, setRepeatType] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [reminderTime, setReminderTime] = useState('');
  const [reminderType, setReminderType] = useState<'nudge' | 'alarm' | 'escalate'>('nudge');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setRepeatType(habitToEdit.repeatType as any);
      setReminderTime(habitToEdit.reminderTime ?? '');
      setReminderType(habitToEdit.reminderType as any);
      try {
        setCustomDays(habitToEdit.repeatDays ? JSON.parse(habitToEdit.repeatDays) : [1, 2, 3, 4, 5, 6, 7]);
      } catch {
        setCustomDays([1, 2, 3, 4, 5, 6, 7]);
      }
    } else {
      setName('');
      setRepeatType('daily');
      setCustomDays([1, 2, 3, 4, 5, 6, 7]);
      setReminderTime('');
      setReminderType('nudge');
    }
  }, [habitToEdit, visible]);

  const toggleDay = (day: number) => {
    if (customDays.includes(day)) {
      if (customDays.length > 1) {
        setCustomDays(customDays.filter((d) => d !== day));
      }
    } else {
      setCustomDays([...customDays, day].sort());
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        repeatType,
        repeatDays: repeatType === 'custom' ? JSON.stringify(customDays) : null,
        reminderTime: reminderTime.trim() || null,
        reminderType,
        color: '#38BDF8',
        icon: 'flame',
      });
      onClose();
    } catch (err) {
      console.error('[HabitFormModal] Error saving habit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/75">
        <View className="bg-bgCard border-t border-borderSubtle rounded-t-3xl max-h-[90%] p-5 pb-8">
          <View className="flex-row items-center justify-between pb-3 border-b border-borderSubtle mb-4">
            <Text className="text-lg font-bold text-textPrimary">
              {habitToEdit ? 'Edit Habit' : 'New Daily Routine'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Habit Name */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Habit Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Gym - Strength Training"
              placeholderTextColor={colors.textMuted}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium mb-4"
            />

            {/* Repeat Frequency */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Repeat Mode
            </Text>
            <View className="flex-row mb-3">
              {(['daily', 'weekdays', 'custom'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setRepeatType(mode)}
                  className={`flex-1 py-2 rounded-xl border mr-2 items-center justify-center ${
                    repeatType === mode
                      ? 'bg-bgSubtle border-brandPrimary'
                      : 'border-borderSubtle bg-bgPrimary'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold capitalize ${
                      repeatType === mode ? 'text-brandPrimary' : 'text-textSecondary'
                    }`}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Day Selector if 'custom' */}
            {repeatType === 'custom' && (
              <View className="flex-row justify-between mb-4 px-1">
                {DAYS_OF_WEEK.map((item) => {
                  const selected = customDays.includes(item.day);
                  return (
                    <TouchableOpacity
                      key={item.day}
                      onPress={() => toggleDay(item.day)}
                      className={`w-10 h-10 rounded-xl items-center justify-center border ${
                        selected
                          ? 'bg-brandPrimary border-brandPrimary'
                          : 'bg-bgSubtle border-borderSubtle'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selected ? 'text-black' : 'text-textSecondary'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Reminder Time */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Reminder Time (Optional, HH:MM)
            </Text>
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="e.g. 07:30"
              placeholderTextColor={colors.textMuted}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium mb-4"
            />

            {/* Reminder Tier */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Reminder Intensity
            </Text>
            <View className="space-y-2 mb-6">
              {REMINDER_TYPES.map((tier) => (
                <TouchableOpacity
                  key={tier.type}
                  onPress={() => setReminderType(tier.type)}
                  className={`p-3 rounded-xl border mb-2 flex-row items-center justify-between ${
                    reminderType === tier.type
                      ? 'bg-bgSubtle border-brandPrimary'
                      : 'bg-bgPrimary border-borderSubtle'
                  }`}
                >
                  <View>
                    <Text
                      className={`text-xs font-bold uppercase ${
                        reminderType === tier.type ? 'text-brandPrimary' : 'text-textPrimary'
                      }`}
                    >
                      {tier.label}
                    </Text>
                    <Text className="text-[11px] text-textMuted mt-0.5">
                      {tier.desc}
                    </Text>
                  </View>
                  <View
                    className={`w-4 h-4 rounded-full border items-center justify-center ${
                      reminderType === tier.type
                        ? 'border-brandPrimary bg-brandPrimary'
                        : 'border-borderSubtle'
                    }`}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !name.trim()}
              className={`w-full py-3.5 rounded-xl bg-brandPrimary items-center justify-center ${
                isSubmitting || !name.trim() ? 'opacity-50' : 'active:opacity-90'
              }`}
            >
              <Text className="text-sm font-bold text-black uppercase tracking-wider">
                {habitToEdit ? 'Save Habit' : 'Create Routine'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
