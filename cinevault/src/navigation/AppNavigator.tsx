import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { COLORS } from '../utils/constants';
import HomeScreen        from '../screens/HomeScreen';
import SearchScreen      from '../screens/SearchScreen';
import DiscoverScreen    from '../screens/DiscoverScreen';
import LibraryScreen     from '../screens/LibraryScreen';
import DiaryScreen       from '../screens/DiaryScreen';
import StatsScreen       from '../screens/StatsScreen';
import AIScreen          from '../screens/AIScreen';
import SettingsScreen    from '../screens/SettingsScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import CalendarScreen    from '../screens/CalendarScreen';
import { useWindowDimensions } from '../hooks/useOrientation';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.bg,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
    primary: COLORS.accent,
  },
};


const TAB_CONFIG = [
  { name: 'Home',     icon: 'home' },
  { name: 'Search',   icon: 'search' },
  { name: 'Discover', icon: 'compass' },
  { name: 'Library',  icon: 'library' },
  { name: 'Diary',    icon: 'book' },
  { name: 'AI',       icon: 'sparkles' },
  { name: 'Stats',    icon: 'bar-chart' },
  { name: 'Settings', icon: 'settings' },
];

function TabNavigator() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          isLandscape && { height: 64, paddingBottom: 10 }
        ],
        tabBarBackground: () => (
          Platform.OS === 'ios'
            ? <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
            : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.bg + 'F2' }]} />
        ),
        tabBarActiveTintColor:   COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icon = TAB_CONFIG.find(t => t.name === route.name)?.icon || 'help';
          return <Ionicons name={(focused ? icon : icon + '-outline') as any} size={isLandscape ? 22 : size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Search"   component={SearchScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Library"  component={LibraryScreen} />
      <Tab.Screen name="Diary"    component={DiaryScreen} />
      <Tab.Screen name="AI"       component={AIScreen} />
      <Tab.Screen name="Stats"    component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={NavigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg }
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen
          name="MovieDetail"
          component={MovieDetailScreen}
          options={{
            animation: 'slide_from_right',
            fullScreenGestureEnabled: true,
          }}
        />
        <Stack.Screen name="Browse" component={SearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12, paddingTop: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
