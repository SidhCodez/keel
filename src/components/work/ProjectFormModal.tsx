import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { X, Plus, Layers, Calendar, Link as LinkIcon, BookOpen } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { Project, NewProject } from '@/db/schema';

type ProjectType = 'course' | 'video' | 'documentation' | 'task' | 'brainstorm';

interface ProjectFormModalProps {
  visible: boolean;
  projectToEdit?: Project | null;
  onClose: () => void;
  onSubmit: (data: Omit<NewProject, 'id' | 'createdAt' | 'updatedAt' | 'slipCount' | 'status'>) => Promise<void>;
}

const TYPE_OPTIONS: { type: ProjectType; label: string; color: string }[] = [
  { type: 'course', label: 'Course', color: colors.tagCourse },
  { type: 'video', label: 'Video', color: colors.tagVideo },
  { type: 'documentation', label: 'Documentation', color: colors.tagDoc },
  { type: 'task', label: 'Coding Task', color: colors.tagTask },
  { type: 'brainstorm', label: 'Brainstorm', color: colors.tagBrainstorm },
];

export function ProjectFormModal({
  visible,
  projectToEdit,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectType>('task');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [unitLabel, setUnitLabel] = useState('lessons');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setType(projectToEdit.type as ProjectType);
      setLink(projectToEdit.link ?? '');
      setDescription(projectToEdit.description ?? '');
      setDeadline(projectToEdit.deadline ?? '');
      setTotalUnits(projectToEdit.totalUnits ? String(projectToEdit.totalUnits) : '');
      setUnitLabel(projectToEdit.unitLabel ?? 'lessons');
    } else {
      setTitle('');
      setType('task');
      setLink('');
      setDescription('');
      setDeadline('');
      setTotalUnits('');
      setUnitLabel('lessons');
    }
  }, [projectToEdit, visible]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedUnits = totalUnits ? parseInt(totalUnits, 10) : null;
      await onSubmit({
        title: title.trim(),
        type,
        link: link.trim() || null,
        description: description.trim() || null,
        deadline: deadline.trim() || null,
        totalUnits: isNaN(Number(parsedUnits)) ? null : parsedUnits,
        unitLabel: unitLabel.trim() || 'units',
        completedUnits: projectToEdit ? projectToEdit.completedUnits : 0,
        resumeMarker: projectToEdit ? projectToEdit.resumeMarker : null,
      });
      onClose();
    } catch (err) {
      console.error('[ProjectFormModal] Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/75">
        <View className="bg-bgCard border-t border-borderSubtle rounded-t-3xl max-h-[90%] p-5 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-borderSubtle mb-4">
            <Text className="text-lg font-bold text-textPrimary">
              {projectToEdit ? 'Edit Project' : 'New Project or Course'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Distributed Systems Course"
              placeholderTextColor={colors.textMuted}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium mb-4"
            />

            {/* Type selector */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Type *
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  onPress={() => {
                    setType(opt.type);
                    if (opt.type === 'course') setUnitLabel('lessons');
                    if (opt.type === 'documentation') setUnitLabel('pages');
                  }}
                  className={`px-3 py-1.5 rounded-lg border mr-2 flex-row items-center ${
                    type === opt.type
                      ? 'bg-bgSubtle border-brandPrimary'
                      : 'border-borderSubtle bg-bgPrimary'
                  }`}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: opt.color,
                      marginRight: 6,
                    }}
                  />
                  <Text
                    className={`text-xs font-semibold ${
                      type === opt.type ? 'text-brandPrimary' : 'text-textSecondary'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Link */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              URL / Link (YouTube or Web)
            </Text>
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="https://youtu.be/... or course link"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              className="w-full px-3.5 py-2.5 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium mb-4"
            />

            {/* Deadline */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Deadline (YYYY-MM-DD)
            </Text>
            <TextInput
              value={deadline}
              onChangeText={setDeadline}
              placeholder="e.g. 2026-10-31"
              placeholderTextColor={colors.textMuted}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium mb-4"
            />

            {/* Total Units for Daily Target Pacing */}
            <View className="flex-row space-x-2 mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                  Total Units (Optional)
                </Text>
                <TextInput
                  value={totalUnits}
                  onChangeText={setTotalUnits}
                  keyboardType="numeric"
                  placeholder="e.g. 30"
                  placeholderTextColor={colors.textMuted}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                  Unit Label
                </Text>
                <TextInput
                  value={unitLabel}
                  onChangeText={setUnitLabel}
                  placeholder="e.g. lessons, pages"
                  placeholderTextColor={colors.textMuted}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium"
                />
              </View>
            </View>

            {/* Description */}
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Description / Notes
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief overview or syllabus details..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bgSubtle border border-borderSubtle text-textPrimary text-sm font-medium mb-6"
            />

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className={`w-full py-3.5 rounded-xl bg-brandPrimary items-center justify-center ${
                isSubmitting || !title.trim() ? 'opacity-50' : 'active:opacity-90'
              }`}
            >
              <Text className="text-sm font-bold text-black uppercase tracking-wider">
                {projectToEdit ? 'Save Changes' : 'Create Project'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
