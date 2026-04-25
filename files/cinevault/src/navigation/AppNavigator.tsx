import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { COLORS } from '../utils/constants';
import HomeScreen        from '../screens/HomeScreen';
import SearchScreen      from '../screens/SearchScreen';
import DiscoverScreen    from '../screens/DiscoverScreen';
import LibraryScreen     from '../screens/LibraryScreen';
import StatsScreen       from '../screens/StatsScreen';
import AIScreen          from '../screens/AIScreen';
import SettingsScreen    from '../screens/SettingsScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import { useOrientation } from '../hooks/useOrientation';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [styles.tabBar, isLandscape && styles.tabBarLandscape],
        tabBarBackground: () => (
          Platform.OS === 'ios'
            ? <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
            : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.surface + 'EE' }]} />
        ),
        tabBarActiveTintColor:   COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: [styles.tabLabel, isLandscape && styles.tabLabelLandscape],
        tabBarItemStyle: isLandscape ? styles.tabItemLandscape : undefined,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:     ['home',      'home-outline'],
            Search:   ['search',    'search-outline'],
            Discover: ['compass',   'compass-outline'],
            Library:  ['library',   'library-outline'],
            Stats:    ['bar-chart', 'bar-chart-outline'],
            AI:       ['sparkles',  'sparkles-outline'],
            Settings: ['settings',  'settings-outline'],
          };
          const [filled, outline] = icons[route.name] ?? ['help', 'help-outline'];
          return <Ionicons name={(focused ? filled : outline) as any} size={isLandscape ? 20 : size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Search"   component={SearchScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Library"  component={LibraryScreen} />
      <Tab.Screen name="Stats"    component={StatsScreen} />
      <Tab.Screen name="AI"       component={AIScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main"        component={TabNavigator} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} options={{ presentation: 'card', gestureEnabled: true }} />
        <Stack.Screen name="Browse"      component={SearchScreen} options={{ presentation: 'card', gestureEnabled: true }} />
        <Stack.Screen name="Mood"        component={DiscoverScreen} options={{ presentation: 'modal', gestureEnabled: true }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 0,
    height: Platform.OS === 'ios' ? 82 : 62,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6, paddingTop: 4,
  },
  tabBarLandscape: { height: 52, paddingBottom: 4, paddingTop: 4 },
  tabLabel:        { fontSize: 10, fontWeight: '600' },
  tabLabelLandscape: { fontSize: 9 },
  tabItemLandscape:  { paddingVertical: 2 },
});
