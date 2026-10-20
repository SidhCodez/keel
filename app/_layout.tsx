import '../global.css';
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { runMigrations } from '@/db/migrate';
import { checkForAppUpdates } from '@/services/updateService';
import {
  configureNotificationHandler,
  initializeNotifications,
} from '@/services/notificationService';
import { rescheduleAllReminders } from '@/services/reminderScheduler';

// Configure how notifications appear when app is in foreground
configureNotificationHandler();

export default function RootLayout() {
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Database migrations
    try {
      runMigrations();
      console.log('[Keel] Database migrations executed successfully.');
    } catch (err) {
      console.error('[Keel] Failed to execute database migrations:', err);
    }

    // Check for continuous app updates
    checkForAppUpdates(false);

    // Initialize notification channels + permissions
    initializeNotifications().then((granted) => {
      if (granted) {
        console.log('[Keel] Notifications initialized.');
        // Reschedule all habit & deadline reminders on app start
        // (handles boot recovery and timezone changes)
        rescheduleAllReminders().catch((err) => {
          console.error('[Keel] Failed to reschedule reminders:', err);
        });
      }
    });

    // Listen for notification taps (for snooze / deep-link actions)
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('[Keel] Notification tapped:', data);
        // Future: route to specific screen based on data.type
      });

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#000000' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
