import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, IMG } from '../utils/constants';
import { getUpcoming, getOnTheAir, TMDbMovie } from '../services/tmdb';
import { SafeImage } from '../components/SafeImage';
import { scheduleNotification } from '../services/notifications';

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<TMDbMovie[]>([]);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([getUpcoming(1), getOnTheAir(1)]);
      const combined = [...m.results, ...t.results].sort((a, b) => {
        const dateA = new Date(a.release_date || a.first_air_date || '9999').getTime();
        const dateB = new Date(b.release_date || b.first_air_date || '9999').getTime();
        return dateA - dateB;
      });
      setUpcoming(combined);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const setReminder = async (item: TMDbMovie) => {
    const releaseDate = new Date(item.release_date || item.first_air_date || '');
    if (isNaN(releaseDate.getTime())) return;

    // Set reminder for 9 AM on release day
    releaseDate.setHours(9, 0, 0, 0);

    if (releaseDate < new Date()) {
       Alert.alert("Already Out", "This title is already released!");
       return;
    }

    try {
      await scheduleNotification(
        "Release Reminder! 🍿",
        `${item.title || item.name} is releasing today!`,
        releaseDate,
        { movieId: item.id, isTV: !!item.first_air_date }
      );
      Alert.alert("Reminder Set", `We'll notify you when ${item.title || item.name} drops!`);
    } catch (e) {
      Alert.alert("Error", "Could not set reminder.");
    }
  };

  const groupedByDate = upcoming.reduce((acc: any, item) => {
    const date = item.release_date || item.first_air_date || 'TBD';
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Release Calendar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {Object.keys(groupedByDate).map((date) => (
          <View key={date} style={styles.dateSection}>
            <View style={styles.dateHeader}>
              <View style={styles.dot} />
              <Text style={styles.dateText}>
                {date === 'TBD' ? 'To Be Announced' : new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>

            {groupedByDate[date].map((item: TMDbMovie) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => navigation.navigate('MovieDetail', { movieId: item.id, isTV: !!item.first_air_date, initialData: item })}
              >
                <SafeImage
                  uri={item.poster_path ? `${IMG.poster_md}${item.poster_path}` : null}
                  style={styles.poster}
                />
                <View style={styles.info}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title || item.name}</Text>
                  <Text style={styles.itemType}>{!!item.first_air_date ? 'TV Series' : 'Movie'}</Text>
                </View>
                <TouchableOpacity style={styles.remindBtn} onPress={() => setReminder(item)}>
                  <Ionicons name="notifications-outline" size={20} color={COLORS.accent} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, gap: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  scroll: { paddingBottom: 100 },
  dateSection: { marginBottom: 25 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  dateText: { fontSize: 14, fontWeight: '800', color: COLORS.textSec, textTransform: 'uppercase', letterSpacing: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 20, borderRadius: 16, padding: 12, gap: 15, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  poster: { width: 50, height: 75, borderRadius: 8 },
  info: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  itemType: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  remindBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' }
});
