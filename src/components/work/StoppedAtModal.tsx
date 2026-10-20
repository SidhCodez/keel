import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Bookmark, Clock, Check } from 'lucide-react-native';
import { colors } from '@/styles/colors';

interface StoppedAtModalProps {
  visible: boolean;
  projectType: 'course' | 'video' | 'documentation' | 'task' | 'brainstorm';
  projectTitle: string;
  currentMarker?: string | null;
  onSubmit: (marker: string) => void;
  onSkip: () => void;
}

export function StoppedAtModal({
  visible,
  projectType,
  projectTitle,
  currentMarker,
  onSubmit,
  onSkip,
}: StoppedAtModalProps) {
  const [marker, setMarker] = useState('');

  useEffect(() => {
    if (visible) {
      setMarker(currentMarker ?? '');
    }
  }, [visible, currentMarker]);

  const getPromptConfig = () => {
    switch (projectType) {
      case 'video':
        return {
          label: 'Video Timestamp',
          placeholder: 'e.g. 14:32 or 01:15:20',
          hint: 'Allows 1-tap deep linking straight to this second.',
        };
      case 'course':
        return {
          label: 'Completed Lesson / Module',
          placeholder: 'e.g. Lesson 14 - Compound Components',
          hint: 'Updates your progress and daily pacing calculation.',
        };
      case 'documentation':
        return {
          label: 'Page or Section',
          placeholder: 'e.g. Page 142 or Chapter 4',
          hint: 'Logs where you left off in the text.',
        };
      case 'task':
      case 'brainstorm':
      default:
        return {
          label: 'Current Stopping Note',
          placeholder: 'e.g. Finished auth middleware, next: tests',
          hint: 'Pick up immediately with zero context loss.',
        };
    }
  };

  const config = getPromptConfig();

  const handleSave = () => {
    onSubmit(marker.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/80 px-4">
        <View className="w-full max-w-sm p-5 rounded-2xl bg-bgCard border border-borderSubtle shadow-2xl">
          <View className="flex-row items-center mb-3">
            <View className="w-9 h-9 rounded-lg bg-sky-950/60 border border-brandPrimary/40 items-center justify-center mr-3">
              <Bookmark size={18} color={colors.brandPrimary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-brandPrimary uppercase tracking-wider">
                Session Paused
              </Text>
              <Text className="text-base font-bold text-textPrimary" numberOfLines={1}>
                {projectTitle}
              </Text>
            </View>
          </View>

          <Text className="text-xs font-medium text-textSecondary mt-1 mb-2">
            Where did you stop? ({config.label})
          </Text>

          <TextInput
            value={marker}
            onChangeText={setMarker}
            placeholder={config.placeholder}
            placeholderTextColor={colors.textMuted}
            autoFocus
            className="w-full px-3.5 py-3 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium mb-2"
          />

          <Text className="text-[11px] text-textMuted mb-5">
            {config.hint}
          </Text>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={onSkip}
              className="flex-1 py-3 rounded-xl bg-bgSubtle border border-borderSubtle items-center justify-center mr-2 active:opacity-80"
            >
              <Text className="text-xs font-semibold text-textSecondary">
                Skip for Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-3 rounded-xl bg-brandPrimary items-center justify-center active:opacity-90"
            >
              <Text className="text-xs font-bold text-black uppercase tracking-wider">
                Save & Pause
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
