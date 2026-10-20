import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { runMigrations } from '@/db/migrate';
import { checkForAppUpdates } from '@/services/updateService';

export default function RootLayout() {
  useEffect(() => {
    try {
      runMigrations();
      console.log('[Keel] Database migrations executed successfully.');
    } catch (err) {
      console.error('[Keel] Failed to execute database migrations:', err);
    }

    // Check for continuous app updates
    checkForAppUpdates(false);
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
