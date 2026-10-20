import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { AlertCircle, Clock, Check } from 'lucide-react-native';
import { colors } from '@/styles/colors';

interface ForgotTimerGuardModalProps {
  visible: boolean;
  projectTitle: string;
  onKeepGoing: () => void;
  onPauseNow: () => void;
}

export function ForgotTimerGuardModal({
  visible,
  projectTitle,
  onKeepGoing,
  onPauseNow,
}: ForgotTimerGuardModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/85 px-4">
        <View className="w-full max-w-sm p-5 rounded-2xl bg-bgCard border-2 border-brandWarning shadow-2xl">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-amber-950/60 border border-brandWarning/50 items-center justify-center mr-3">
              <Clock size={20} color={colors.brandWarning} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-brandWarning uppercase tracking-wider">
                Forgot-Timer Guard
              </Text>
              <Text className="text-base font-bold text-textPrimary" numberOfLines={1}>
                {projectTitle}
              </Text>
            </View>
          </View>

          <Text className="text-sm font-semibold text-textPrimary mb-1">
            Timer has been running for 3 hours.
          </Text>

          <Text className="text-xs text-textSecondary leading-relaxed mb-5">
            Keel protects your metrics from accidental runaway timers. Are you still actively working? If unacknowledged, the timer will automatically pause and clamp to 3 hours.
          </Text>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={onPauseNow}
              className="flex-1 py-3 rounded-xl bg-bgSubtle border border-borderSubtle items-center justify-center mr-2 active:opacity-80"
            >
              <Text className="text-xs font-semibold text-textPrimary">
                Pause Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onKeepGoing}
              className="flex-1 py-3 rounded-xl bg-brandWarning items-center justify-center active:opacity-90"
            >
              <Text className="text-xs font-bold text-black uppercase tracking-wider">
                Still Working (+1h)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
