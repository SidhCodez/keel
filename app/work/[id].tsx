import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Play, Pause, ExternalLink, Clock, Plus, Trash2, Bookmark, CheckCircle2 } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { projectRepository } from '@/db/repositories/projectRepository';
import { sessionRepository } from '@/db/repositories/sessionRepository';
import { noteRepository } from '@/db/repositories/noteRepository';
import { Project, Note, Session } from '@/db/schema';
import { useTimerStore } from '@/stores/timerStore';
import { StoppedAtModal } from '@/components/work/StoppedAtModal';
import { ForgotTimerGuardModal } from '@/components/work/ForgotTimerGuardModal';
import { parseYouTubeTimestamp } from '@/rules/youtube';
import { format } from 'date-fns';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);

  // Note entry inputs
  const [noteContent, setNoteContent] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Timer store
  const {
    activeProjectId,
    elapsedSeconds,
    isGuardAlertVisible,
    isStoppedAtModalOpen,
    start,
    pause,
    submitStoppedAt,
    dismissGuard,
    tick,
  } = useTimerStore();

  const isTimerActiveForThisProject = activeProjectId === id;

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const proj = await projectRepository.getById(id);
      setProject(proj);

      const notesList = await noteRepository.getForProject(id);
      setNotes(notesList);

      const sessionsList = await sessionRepository.getForProject(id);
      setSessions(sessionsList);

      const total = await sessionRepository.getTotalSeconds(id);
      setTotalSeconds(total);
    } catch (err) {
      console.error('[ProjectDetail] Failed to load project:', err);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live timer tick listener
  useEffect(() => {
    if (!isTimerActiveForThisProject) return;
    const interval = setInterval(() => {
      tick();
    } , 1000);
    return () => clearInterval(interval);
  }, [isTimerActiveForThisProject, tick]);

  const handleToggleTimer = async () => {
    if (!id) return;
    if (isTimerActiveForThisProject) {
      await pause();
    } else {
      await start(id);
    }
  };

  const handleSaveStoppedAt = async (marker: string) => {
    await submitStoppedAt(marker);
    await loadData();
  };

  const handleOpenLink = async () => {
    if (!project?.link) return;
    try {
      const canOpen = await Linking.canOpenURL(project.link);
      if (canOpen) {
        await Linking.openURL(project.link);
      } else {
        Alert.alert('Unable to open link', project.link);
      }
    } catch (err) {
      console.warn('Error opening link:', err);
    }
  };

  const handleTimestampTap = async (timestampStr: string) => {
    if (!project?.link) {
      Alert.alert('No Link Attached', 'This project does not have a video link attached.');
      return;
    }

    const parsed = parseYouTubeTimestamp(project.link, timestampStr);
    if (!parsed) {
      Alert.alert('Cannot Parse Timestamp', `Could not parse timestamp "${timestampStr}".`);
      return;
    }

    try {
      const canOpenApp = await Linking.canOpenURL(parsed.appUrl);
      if (canOpenApp) {
        await Linking.openURL(parsed.appUrl);
      } else {
        await Linking.openURL(parsed.webUrl);
      }
    } catch {
      await Linking.openURL(parsed.webUrl);
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteContent.trim()) return;
    try {
      await noteRepository.create(id, noteContent.trim(), noteTimestamp.trim() || undefined);
      setNoteContent('');
      setNoteTimestamp('');
      setShowNoteInput(false);
      const updatedNotes = await noteRepository.getForProject(id);
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await noteRepository.delete(noteId);
      if (id) {
        const updated = await noteRepository.getForProject(id);
        setNotes(updated);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  if (!project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} className="justify-center items-center">
        <Text className="text-sm text-textSecondary">Loading project...</Text>
      </SafeAreaView>
    );
  }

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Top Header Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-borderSubtle">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-bgCard border border-borderSubtle items-center justify-center active:bg-bgSubtle"
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text className="text-sm font-bold text-textPrimary uppercase tracking-wider">
          {project.type}
        </Text>

        {project.link ? (
          <TouchableOpacity
            onPress={handleOpenLink}
            className="w-10 h-10 rounded-full bg-bgCard border border-borderSubtle items-center justify-center active:bg-bgSubtle"
          >
            <ExternalLink size={18} color={colors.brandPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Project Header Info */}
        <Text className="text-2xl font-bold text-textPrimary mb-2">
          {project.title}
        </Text>

        {project.description ? (
          <Text className="text-xs text-textSecondary leading-relaxed mb-4">
            {project.description}
          </Text>
        ) : null}

        {/* Resume Marker Chip */}
        {project.resumeMarker ? (
          <View className="flex-row items-center p-3 mb-4 rounded-xl bg-bgCard border border-borderSubtle">
            <Bookmark size={16} color={colors.brandPrimary} />
            <Text className="ml-2 text-xs text-textSecondary">
              Stopped at:{' '}
              <Text className="text-textPrimary font-mono font-bold">
                {project.resumeMarker}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Live Session Timer Hero Widget */}
        <View className="p-5 rounded-2xl bg-bgCard border border-borderSubtle items-center mb-6">
          <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            {isTimerActiveForThisProject ? 'Session In Progress' : 'Focus Session'}
          </Text>

          <Text className="text-4xl font-extrabold text-textPrimary font-mono mb-4 tracking-wider">
            {formatTimer(isTimerActiveForThisProject ? elapsedSeconds : 0)}
          </Text>

          <TouchableOpacity
            onPress={handleToggleTimer}
            className={`w-full py-3.5 rounded-xl flex-row items-center justify-center ${
              isTimerActiveForThisProject ? 'bg-brandWarning' : 'bg-brandPrimary'
            } active:opacity-90`}
          >
            {isTimerActiveForThisProject ? (
              <>
                <Pause size={18} color="#000000" fill="#000000" />
                <Text className="ml-2 text-sm font-bold text-black uppercase tracking-wider">
                  Pause & Save Stopping Point
                </Text>
              </>
            ) : (
              <>
                <Play size={18} color="#000000" fill="#000000" />
                <Text className="ml-2 text-sm font-bold text-black uppercase tracking-wider">
                  Start Focus Timer
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-[11px] text-textMuted mt-3 font-mono">
            Total Logged: {formatTimer(totalSeconds)} across {sessions.length} sessions
          </Text>
        </View>

        {/* Notes & Timestamp Deep-Links */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-textPrimary">
              Notes & Timestamps
            </Text>
            <TouchableOpacity
              onPress={() => setShowNoteInput(!showNoteInput)}
              className="px-2.5 py-1 rounded-lg bg-bgCard border border-borderSubtle flex-row items-center"
            >
              <Plus size={14} color={colors.brandPrimary} />
              <Text className="ml-1 text-xs font-semibold text-brandPrimary">
                Add Note
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Note Form */}
          {showNoteInput && (
            <View className="p-4 mb-4 rounded-xl bg-bgCard border border-borderSubtle">
              <TextInput
                value={noteContent}
                onChangeText={setNoteContent}
                placeholder="Write your note..."
                placeholderTextColor={colors.textMuted}
                multiline
                className="w-full px-3 py-2 rounded-lg bg-bgSubtle border border-borderSubtle text-textPrimary text-sm mb-2"
              />
              <TextInput
                value={noteTimestamp}
                onChangeText={setNoteTimestamp}
                placeholder="Optional timestamp (e.g. 14:32)"
                placeholderTextColor={colors.textMuted}
                className="w-full px-3 py-2 rounded-lg bg-bgSubtle border border-borderSubtle text-textPrimary text-xs mb-3 font-mono"
              />
              <View className="flex-row justify-end space-x-2">
                <TouchableOpacity
                  onPress={() => setShowNoteInput(false)}
                  className="px-3 py-1.5 rounded-lg bg-bgSubtle mr-2"
                >
                  <Text className="text-xs text-textSecondary">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddNote}
                  className="px-4 py-1.5 rounded-lg bg-brandPrimary"
                >
                  <Text className="text-xs font-bold text-black">Save Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Notes List */}
          {notes.length === 0 ? (
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle items-center">
              <Text className="text-xs text-textMuted">
                No notes yet. Add thoughts or timestamp marks as you learn.
              </Text>
            </View>
          ) : (
            notes.map((note) => (
              <View
                key={note.id}
                className="p-3.5 mb-2 rounded-xl bg-bgCard border border-borderSubtle flex-row items-start justify-between"
              >
                <View className="flex-1 mr-2">
                  {note.timestampStr ? (
                    <TouchableOpacity
                      onPress={() => handleTimestampTap(note.timestampStr!)}
                      className="self-start px-2 py-0.5 mb-1.5 rounded bg-sky-950/60 border border-brandPrimary/40 flex-row items-center"
                    >
                      <Clock size={11} color={colors.brandPrimary} />
                      <Text className="ml-1 text-[11px] font-mono font-bold text-brandPrimary">
                        {note.timestampStr} (Open Video)
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <Text className="text-sm text-textPrimary leading-relaxed">
                    {note.content}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteNote(note.id)}
                  className="p-1 opacity-60 active:opacity-100"
                >
                  <Trash2 size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Sessions History */}
        <View className="mb-10">
          <Text className="text-base font-bold text-textPrimary mb-3">
            Logged Sessions ({sessions.length})
          </Text>
          {sessions.length === 0 ? (
            <View className="p-4 rounded-xl bg-bgCard border border-borderSubtle items-center">
              <Text className="text-xs text-textMuted">No sessions recorded yet.</Text>
            </View>
          ) : (
            sessions.map((sess) => (
              <View
                key={sess.id}
                className="p-3 mb-2 rounded-xl bg-bgCard border border-borderSubtle flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-xs font-semibold text-textPrimary font-mono">
                    {format(new Date(sess.startedAt), 'MMM dd, yyyy · HH:mm')}
                  </Text>
                  {sess.stoppedAtMarker ? (
                    <Text className="text-[11px] text-textSecondary mt-0.5">
                      Marker: {sess.stoppedAtMarker}
                    </Text>
                  ) : null}
                </View>

                <View className="items-end">
                  <Text className="text-xs font-bold text-brandPrimary font-mono">
                    {formatTimer(sess.durationSeconds)}
                  </Text>
                  {sess.autoPausedByGuard ? (
                    <Text className="text-[10px] text-brandWarning font-semibold">
                      Auto-Paused (3h)
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* "Stopped at?" Modal */}
      <StoppedAtModal
        visible={isStoppedAtModalOpen}
        projectType={project.type as any}
        projectTitle={project.title}
        currentMarker={project.resumeMarker}
        onSubmit={handleSaveStoppedAt}
        onSkip={() => handleSaveStoppedAt(project.resumeMarker ?? '')}
      />

      {/* Forgot-Timer Guard Modal */}
      <ForgotTimerGuardModal
        visible={isGuardAlertVisible}
        projectTitle={project.title}
        onKeepGoing={() => dismissGuard(true)}
        onPauseNow={() => dismissGuard(false)}
      />
    </SafeAreaView>
  );
}
