import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bridges the React Native data to the Android Native Widget
 */
export const updateWidgetData = async (watchedCount: number, hoursWatched: number, currentlyWatching?: string) => {
  if (Platform.OS !== 'android') return;

  try {
    // In a real production app with custom native modules, we'd call a method here.
    // For now, we use a Shared Preferences bridge approach that the Widget can read.
    // Since we don't have a custom bridge module yet, we'll suggest using a
    // library or creating a simple TurboModule/NativeModule.

    // For this specific build, we will rely on the app saving these to a
    // specific key that our Native Kotlin code can eventually access if we
    // add a small bridge.

    await AsyncStorage.setItem('@widget_watched', watchedCount.toString());
    await AsyncStorage.setItem('@widget_hours', hoursWatched.toString());
    if (currentlyWatching) {
      await AsyncStorage.setItem('@widget_watching', currentlyWatching);
    }
  } catch (e) {
    console.error('Widget Update Error:', e);
  }
};
