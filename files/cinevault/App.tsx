import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDB } from './src/services/database';
import AppNavigator from './src/navigation/AppNavigator';
import { AppLockGate } from './src/components/AppLock';

export default function App() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppLockGate>
          <AppNavigator />
        </AppLockGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
