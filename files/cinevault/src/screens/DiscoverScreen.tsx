import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, IMG, MOODS } from '../utils/constants';
import { discoverByGenres, TMDbMovie } from '../services/tmdb';

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const initMood   = route.params?.mood;

  const [activeMood, setActiveMood] = useState(initMood ?? null);
  const [movies, setMovies]         = useState<TMDbMovie[]>([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (activeMood) loadMoodMovies(activeMood);
  }, [activeMood]);

  useEffect(() => {
    if (initMood) setActiveMood(initMood);
  }, [initMood]);

  const loadMoodMovies = async (mood: typeof MOODS[0]) => {
    setLoading(true);
    try {
      const data = await discoverByGenres(mood.genres);
      setMovies(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSub}>What are you in the mood for?</Text>
      </View>

      {/* Mood Grid */}
      <View style={styles.moodGrid}>
        {MOODS.map((mood) => {
          const active = activeMood?.id === mood.id;
          return (
            <TouchableOpacity
              key={mood.id}
              style={[styles.moodCard, active && { borderColor: mood.color, borderWidth: 2 }]}
              onPress={() => setActiveMood(mood)}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={[mood.color + '30', mood.color + '10']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
              {active && (
                <View style={[styles.activeDot, { backgroundColor: mood.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.loadingText}>Finding {activeMood?.label.toLowerCase()} movies…</Text>
        </View>
      )}

      {!loading && activeMood && movies.length > 0 && (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {activeMood.emoji} {activeMood.label} Picks
            </Text>
            <Text style={styles.resultsCount}>{movies.length} movies</Text>
          </View>
          <FlatList
            data={movies}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: `${IMG.poster_md}${item.poster_path}` }}
                  style={styles.gridPoster}
                  resizeMode="cover"
                />
                <View style={styles.gridBadge}>
                  <Ionicons name="star" size={9} color={COLORS.accent} />
                  <Text style={styles.gridRating}>{item.vote_average.toFixed(1)}</Text>
                </View>
                <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {!loading && !activeMood && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select a mood above to discover movies</Text>
        </View>
      )}
    </View>
  );
}

const ITEM_W = (340 - 40) / 3; // approx

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  headerSub:   { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  moodCard: {
    width: '30%', aspectRatio: 1.3,
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  moodEmoji:  { fontSize: 22 },
  moodLabel:  { fontSize: 12, fontWeight: '700' },
  activeDot:  { width: 5, height: 5, borderRadius: 3, marginTop: 2 },

  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20 },
  loadingText: { color: COLORS.textSec, fontSize: 14 },

  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  resultsTitle:  { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  resultsCount:  { fontSize: 12, color: COLORS.textMuted },

  grid:    { paddingHorizontal: 16, paddingBottom: 100 },
  gridRow: { gap: 10, marginBottom: 10 },
  gridItem: { flex: 1 },
  gridPoster: { width: '100%', aspectRatio: 0.67, borderRadius: 8, backgroundColor: COLORS.card },
  gridBadge: {
    position: 'absolute', top: 5, right: 5,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 5,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  gridRating: { fontSize: 9, color: COLORS.accent, fontWeight: '700' },
  gridTitle:  { fontSize: 10, color: COLORS.textSec, marginTop: 4 },

  placeholder:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: COLORS.textMuted, fontSize: 14 },
});
