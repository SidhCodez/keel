import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export interface UpdateStatus {
  isChecking: boolean;
  isAvailable: boolean;
  isDownloaded: boolean;
  error: string | null;
}

/**
 * Checks for over-the-air (OTA) updates using expo-updates.
 * If an update is available in production, downloads and restarts the app seamlessly.
 */
export async function checkForAppUpdates(notifyIfLatest = false): Promise<void> {
  if (__DEV__) {
    if (notifyIfLatest) {
      Alert.alert('Development Mode', 'Auto-updates are disabled in local development mode.');
    }
    return;
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      Alert.alert(
        'Update Available',
        'A new version of Keel is available. Downloading update now...',
        [{ text: 'OK' }]
      );
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Update Ready',
        'Update has been downloaded. Restarting Keel to apply updates.',
        [
          {
            text: 'Restart Now',
            onPress: async () => {
              await Updates.reloadAsync();
            },
          },
        ]
      );
    } else if (notifyIfLatest) {
      Alert.alert('Up to Date', 'You are running the latest version of Keel.');
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[Updates] Failed to check for updates:', message);
    if (notifyIfLatest) {
      Alert.alert('Update Check Failed', message);
    }
  }
}
