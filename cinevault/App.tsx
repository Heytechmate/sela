import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDB, runPruning } from './src/services/database';
import AppNavigator from './src/navigation/AppNavigator';
import { AppLockGate } from './src/components/AppLock';
import { COLORS } from './src/utils/constants';
import { registerForPushNotificationsAsync } from './src/services/notifications';

const SplashOverlay = () => (
  <View style={styles.splashContainer}>
    <Text style={styles.splashTitle}>
      CINE<Text style={{ color: COLORS.accent }}>VAULT</Text>
    </Text>
    <View style={styles.loaderContainer}>
      <ActivityIndicator color={COLORS.accent} size="small" />
    </View>
  </View>
);

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        await runPruning();
        // Request local notification permissions on mount
        // await registerForPushNotificationsAsync();
        // Reduced delay for faster startup
        setTimeout(() => setDbReady(true), 400);
      } catch (e) {
        setDbReady(true);
      }
    };
    setup();
  }, []);

  if (!dbReady) {
    return <SplashOverlay />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaProvider style={{ backgroundColor: COLORS.bg }}>
        <StatusBar style="light" />
        <AppLockGate>
          <AppNavigator />
        </AppLockGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#050508',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '200',
    letterSpacing: 14,
    textTransform: 'uppercase',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 100,
  }
});
