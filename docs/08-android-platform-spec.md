# 08. Android Platform Specification: Keel

## 1. Overview & Native Requirements

Because Keel is targeting **Android only**, we leverage Android's native platform strengths to enforce two features that web PWAs fail to deliver reliably:
1. **Persistent Alarms** (audio that rings until explicitly dismissed).
2. **Distraction-Free Journal Lock** (screen pinning and reset-on-leave penalties).

This document details the exact permissions, native modules, Expo config plugins, and fallback behaviors.

---

## 2. Android Permissions & `app.json` Manifest Configuration

To satisfy modern Android API levels (Target API 34+ / Android 14+), the following permissions are declared in the Expo configuration:

```json
{
  "expo": {
    "name": "Keel",
    "slug": "keel",
    "version": "1.0.0",
    "android": {
      "package": "com.keel.app",
      "adaptiveIcon": {
        "backgroundColor": "#000000"
      },
      "permissions": [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_EXACT_ALARM",
        "android.permission.WAKE_LOCK",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.USE_FULL_SCREEN_INTENT"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#38BDF8",
          "sounds": ["./assets/sounds/alarm_ring.wav"]
        }
      ]
    ]
  }
}
```

### 2.1 Permission Justifications
- `POST_NOTIFICATIONS`: Required on Android 13+ (API 33+) to post any notification.
- `USE_EXACT_ALARM` & `SCHEDULE_EXACT_ALARM`: Ensures reminder notifications trigger at the exact second scheduled, avoiding Android Doze mode throttling.
- `RECEIVE_BOOT_COMPLETED`: Reschedules active habit and project alarms after device restart.
- `USE_FULL_SCREEN_INTENT`: Enables alarms to wake the screen and display a full-screen dismiss interface when device is locked.

---

## 3. Persistent Alarm Subsystem

### 3.1 Technical Assessment: Notifee vs. Expo Notifications vs. Native Kotlin Module
- **`notifee` Status**: While powerful, Notifee has had intermittent maintenance gaps on Expo SDK 50+.
- **Recommended Free Architecture**:
  1. For **Nudge** & **Escalate**: Use `expo-notifications` with Android notification channels configured for high importance and sound.
  2. For **True Alarm**: A dedicated Android Notification Channel configured with `AudioAttributes.USAGE_ALARM`:
     - Sound looping enabled.
     - Ringtone assigned to the `ALARM` audio stream (plays even if phone is on normal vibrate/silent mode, respecting Android alarm volume).
     - Fullscreen intent pointing to an alarm ringing activity/modal.
  3. When the user taps "Dismiss" or "Smart Snooze", the sound stops and the notification clears.

```typescript
// Channel Setup
import * as Notifications from 'expo-notifications';

export async function registerAlarmNotificationChannel() {
  await Notifications.setNotificationChannelAsync('keel-alarms', {
    name: 'Keel Alarms',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    sound: 'alarm_ring.wav',
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}
```

---

## 4. Journal Hard Lock Specification

The journal lock prevents casual distraction and enforces 10 minutes of uninterrupted focus.

### 4.1 Native Screen Pinning (`startLockTask`)
Android provides a native OS feature called **Screen Pinning** (`startLockTask()`), which locks the current application onto the screen, blocking the Home button, App Overview/Recents, and status bar pull-down.

#### Implementation Strategy
1. **Custom Native Module (Expo Config Plugin)**:
   A lightweight Kotlin module (`KeelLockModule.kt`) exposes two methods to React Native:
   ```kotlin
   package com.keel.app

   import com.facebook.react.bridge.ReactApplicationContext
   import com.facebook.react.bridge.ReactContextBaseJavaModule
   import com.facebook.react.bridge.ReactMethod

   class KeelLockModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
       override fun getName() = "KeelLockModule"

       @ReactMethod
       fun enterScreenPin() {
           currentActivity?.startLockTask()
       }

       @ReactMethod
       fun exitScreenPin() {
           currentActivity?.stopLockTask()
       }
   }
   ```
2. **Expo Config Plugin**:
   Integrates `KeelLockModule` cleanly into the generated Android project during prebuild without requiring manual Android Studio modifications.

### 4.2 Tri-Layer Defensive Backstop
Even if the user declines the Android OS screen pinning prompt, Keel's tri-layer software guard ensures the lock cannot be bypassed:

```
+-------------------------------------------------------------------+
| LAYER 1: Hardware Back Button Trap                                |
| BackHandler listener consumes all back events with warning toast  |
+-------------------------------------------------------------------+
| LAYER 2: Keep Screen On (expo-keep-awake)                         |
| Display is forced to stay awake; no accidental display timeout     |
+-------------------------------------------------------------------+
| LAYER 3: Reset-on-Leave Penalty (The Inviolable Backstop)         |
| If AppState leaves 'active' (Home button or App switcher pressed):|
| -> Autosave text content to SQLite                                |
| -> Reset 10-minute countdown back to 600 seconds                  |
| -> Log interruption event                                         |
+-------------------------------------------------------------------+
```

---

## 5. Session Timer Persistence & Battery Resilience

### 5.1 Surviving Android OS Process Death
Android frequently kills background apps to conserve RAM. 
- Traditional timer implementations store `let seconds = 0; setInterval(() => seconds++, 1000)` which is destroyed when the process dies.
- **Keel Architecture**:
  1. The start event writes `{ started_at: 1716382000000, accumulated_ms: 0 }` to SQLite table `active_sessions`.
  2. The UI calculates live time as:
     $$\text{Elapsed} = \text{accumulated\_ms} + (\text{Date.now()} - \text{started\_at})$$
  3. If the phone is locked, backgrounded, or Keel's process is killed by Android, the database remains intact.
  4. Upon next launch, Keel queries `active_sessions`. If an active record exists:
     - It immediately calculates exact elapsed time without losing a single second.
     - If elapsed time exceeds 3 hours ($10,800,000\text{ ms}$), the **Forgot-Timer Guard** activates.

### 5.2 Device Reboot Recovery
Upon receiving `android.intent.action.BOOT_COMPLETED`:
- A lightweight broadcast receiver triggers Keel's notification rescheduling routine.
- Reads upcoming habit reminders and work deadlines from SQLite and calls `Notifications.scheduleNotificationAsync()` to restore exact alarms.

---

## 6. YouTube Timestamp Deep-Linking

When tapping a note with a timestamp (e.g. `12:40`):
1. **Conversion**: Parsed to total seconds ($12 \times 60 + 40 = 760$).
2. **Intent Scheme**:
   - Primary: `vnd.youtube://<videoId>?t=760` (directly invokes native YouTube Android app).
   - Fallback: `https://youtu.be/<videoId>?t=760` (opens in default Android web browser if YouTube app is disabled).
3. Invocation:
   ```typescript
   import { Linking } from 'react-native';

   export async function openYouTubeAtTimestamp(videoUrl: string, seconds: number) {
     const videoId = extractYouTubeId(videoUrl);
     if (!videoId) return;

     const appUrl = `vnd.youtube://${videoId}?t=${seconds}`;
     const canOpen = await Linking.canOpenURL(appUrl);

     if (canOpen) {
       await Linking.openURL(appUrl);
     } else {
       await Linking.openURL(`https://youtu.be/${videoId}?t=${seconds}s`);
     }
   }
   ```
