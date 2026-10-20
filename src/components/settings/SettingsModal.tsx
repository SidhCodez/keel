import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Shield,
  Smartphone,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { exportKeelBackup, importKeelBackup, resetAllKeelData } from '@/services/backupService';
import { checkForAppUpdates } from '@/services/updateService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export function SettingsModal({ visible, onClose, onDataRestored }: SettingsModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportKeelBackup();
      if (result.success) {
        Alert.alert(
          'Backup Exported',
          'Your SQLite database was successfully bundled into a secure JSON backup file and shared.'
        );
      } else {
        Alert.alert('Export Failed', result.error ?? 'Unknown error occurred.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Restore From Backup?',
      'Restoring will replace all current habits, projects, logs, and journals with the data from your backup file. Ensure your backup is trusted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select JSON File',
          onPress: async () => {
            setIsImporting(true);
            try {
              const result = await importKeelBackup();
              if (result.success) {
                Alert.alert(
                  'Restore Complete',
                  `Successfully restored ${result.counts?.habits ?? 0} habits, ${result.counts?.projects ?? 0} projects, and ${result.counts?.journalEntries ?? 0} journal entries!`
                );
                onDataRestored?.();
                onClose();
              } else if (result.error !== 'Import cancelled by user') {
                Alert.alert('Restore Failed', result.error ?? 'Invalid backup file.');
              }
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      await checkForAppUpdates(true);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      '⚠️ Wipe All Data?',
      'This will irreversibly delete all your local projects, sessions, habits, streaks, and journal entries. This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllKeelData();
            Alert.alert('Database Reset', 'All data has been cleared.');
            onDataRestored?.();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/80">
        <View
          style={{ maxHeight: '88%', backgroundColor: colors.bgCard }}
          className="rounded-t-3xl border-t border-borderSubtle p-5"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-borderSubtle">
            <View className="flex-row items-center">
              <Shield size={20} color={colors.brandPrimary} />
              <Text className="ml-2 text-lg font-bold text-textPrimary">
                Keel Settings & Backup
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-bgSubtle items-center justify-center active:opacity-70"
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
            {/* Local Sovereignty Banner */}
            <View className="p-3.5 mb-4 rounded-xl bg-sky-950/40 border border-brandPrimary/30">
              <Text className="text-xs font-bold text-brandPrimary mb-0.5">
                100% Local-First Sovereignty
              </Text>
              <Text className="text-[11px] text-textSecondary leading-relaxed">
                Zero cloud servers, zero trackers. Your data lives exclusively in on-device SQLite. Export anytime to back up to Google Drive, USB, or local storage.
              </Text>
            </View>

            {/* Section 1: Data Backup & Restore */}
            <Text className="text-xs font-bold uppercase tracking-wider text-textSecondary mb-2 mt-1">
              Data Sovereignty
            </Text>

            <TouchableOpacity
              onPress={handleExport}
              disabled={isExporting}
              className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-xl bg-bgSubtle border border-borderSubtle active:opacity-80"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-9 h-9 rounded-lg bg-sky-950/60 border border-brandPrimary/30 items-center justify-center mr-3">
                  {isExporting ? (
                    <ActivityIndicator size="small" color={colors.brandPrimary} />
                  ) : (
                    <Download size={18} color={colors.brandPrimary} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textPrimary">
                    Export Backup (JSON)
                  </Text>
                  <Text className="text-[11px] text-textMuted">
                    Bundle all habits, projects, logs & journals into a portable JSON
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleImport}
              disabled={isImporting}
              className="flex-row items-center justify-between p-3.5 mb-4 rounded-xl bg-bgSubtle border border-borderSubtle active:opacity-80"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-brandSuccess/30 items-center justify-center mr-3">
                  {isImporting ? (
                    <ActivityIndicator size="small" color={colors.brandSuccess} />
                  ) : (
                    <Upload size={18} color={colors.brandSuccess} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textPrimary">
                    Restore From Backup
                  </Text>
                  <Text className="text-[11px] text-textMuted">
                    Select a validated Keel JSON backup file to restore
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Section 2: App & Updates */}
            <Text className="text-xs font-bold uppercase tracking-wider text-textSecondary mb-2">
              Updates & Information
            </Text>

            <TouchableOpacity
              onPress={handleCheckUpdates}
              disabled={isCheckingUpdate}
              className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-xl bg-bgSubtle border border-borderSubtle active:opacity-80"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-500/30 items-center justify-center mr-3">
                  {isCheckingUpdate ? (
                    <ActivityIndicator size="small" color="#A855F7" />
                  ) : (
                    <RefreshCw size={18} color="#A855F7" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textPrimary">
                    Check for Updates (OTA)
                  </Text>
                  <Text className="text-[11px] text-textMuted">
                    Fetches latest fixes silently via expo-updates pipeline
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View className="p-3.5 mb-4 rounded-xl bg-bgSubtle border border-borderSubtle">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Smartphone size={16} color={colors.textSecondary} />
                  <Text className="ml-2 text-xs font-semibold text-textPrimary">
                    Keel for Android
                  </Text>
                </View>
                <Text className="text-xs font-mono font-bold text-brandPrimary">
                  v1.0.0 (Release)
                </Text>
              </View>
              <Text className="text-[10px] text-textMuted mt-1">
                Zero Cloud · Pure SQLite WAL · Drizzle ORM · NativeWind v4
              </Text>
            </View>

            {/* Section 3: Danger Zone */}
            <Text className="text-xs font-bold uppercase tracking-wider text-brandDanger mb-2">
              Danger Zone
            </Text>

            <TouchableOpacity
              onPress={handleResetData}
              className="flex-row items-center justify-between p-3.5 mb-8 rounded-xl bg-red-950/20 border border-brandDanger/40 active:opacity-80"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-9 h-9 rounded-lg bg-red-950/60 border border-brandDanger/40 items-center justify-center mr-3">
                  <Trash2 size={18} color={colors.brandDanger} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-brandDanger">
                    Wipe All Local Data
                  </Text>
                  <Text className="text-[11px] text-textMuted">
                    Clear all projects, habits, streaks, and journal logs
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
