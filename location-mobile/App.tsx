import React, { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/presentation/screens/HomeScreen';

export default function App() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appState.current = next;
    });
    let notifSub: { remove: () => void } | null = null;
    try {
      notifSub = Notifications.addNotificationReceivedListener((notification) => {
        const title = notification.request.content.title ?? '알림';
        const body = notification.request.content.body ?? '';
        if (appState.current === 'active' && (title || body)) {
          Alert.alert(title, body || ' ');
        }
      });
    } catch {
    }
    return () => {
      sub.remove();
      notifSub?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <HomeScreen />
    </SafeAreaProvider>
  );
}
