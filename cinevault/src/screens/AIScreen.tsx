import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, IMG } from '../utils/constants';
import { getStats, getAllMovies } from '../services/database';
import {
  getMovieRecommendations,
  getTVRecommendations,
  getTrending,
  getTopRated,
  TMDbMovie,
  discoverByFilters,
  getGenres
} from '../services/tmdb';
import { useWindowDimensions } from '../hooks/useOrientation';

export default function SmartPicksScreen() {
  const navigation = useNavigation<any>();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [loading, setLoading]       = useState(true);
  const [recommendations, setRecs]  = useState<TMDbMovie[]>([]);
  const [sectionTitle, setTitle]    = useState('Personalized for You');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Adaptive Grid logic
  const numColumns = useMemo(() => {
    if (width > 1200) return 8;
    if (width > 900)  return 6;
    if (width > 600)  return 4;
    return 2; // Default for phones
  }, [width]);

  const loadPersonalized = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await getStats();
      setUserProfile(stats);
      let results: TMDbMovie[] = [];

      if (stats.watched > 0 && stats.recentlyWatched.length > 0) {
        // Logic 1: Direct recommendations from recent watches
        const recent = stats.recentlyWatched.slice(0, 2);
        const recArrays = await Promise.all(
          recent.map(m => m.media_type === 'tv' ? getTVRecommendations(m.tmdb_id) : getMovieRecommendations(m.tmdb_id))
        );

        // Logic 2: Genre-based discovery from top genres
        let genreRecs: TMDbMovie[] = [];
        if (stats.topGenres.length > 0) {
          const topGenreName = stats.topGenres[0].name;
          const genreList = await getGenres();
          const genreId = genreList.find(g => g.name === topGenreName)?.id;
          if (genreId) {
            const data = await discoverByFilters({ genres: [genreId], sortBy: 'popularity.desc', page: 1 });
            genreRecs = data.results;
          }
        }

        const combined = [...recArrays.flat(), ...genreRecs];
        // Unique results
        const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());

        const library = await getAllMovies();
        const libIds = new Set(library.map(m => m.tmdb_id));
        results = unique.filter(m => !libIds.has(m.id)).sort(() => 0.5 - Math.random()).slice(0, 40);

        if (stats.topGenres.length > 0) {
          setTitle(`CineVault AI: Heavy on ${stats.topGenres[0].name}`);
        } else {
          setTitle(`Because you watched ${recent[0].title}`);
        }
      } else {
        const [trending, top] = await Promise.all([getTrending('day'), getTopRated()]);
        results = [...trending.results.slice(0, 15), ...top.results.slice(0, 15)];
        setTitle('Top Picks Today');
      }

      setRecs(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPersonalized();
    }, [loadPersonalized])
  );

  const handleQuickFilter = async (type: string) => {
    setLoading(true);
    try {
      let data;
      if (type === 'thrilling') {
        setTitle('Pulse-Pounding Thrillers');
        data = await discoverByFilters({ genres: [28, 53], sortBy: 'popularity.desc' });
      } else if (type === 'gems') {
        setTitle('Hidden Gems');
        data = await discoverByFilters({ minRating: 7.5, sortBy: 'vote_count.asc', page: 1 });
      } else if (type === 'classic') {
        setTitle('Timeless Classics');
        data = await discoverByFilters({ year: 1990, sortBy: 'vote_average.desc' });
      } else if (type === 'hi') {
        setTitle('Top Hindi Movies');
        data = await discoverByFilters({ language: 'hi', region: 'IN', sortBy: 'popularity.desc' });
      } else if (type === 'ta') {
        setTitle('Top Tamil Movies');
        data = await discoverByFilters({ language: 'ta', region: 'IN', sortBy: 'popularity.desc' });
      } else if (type === 'ml') {
        setTitle('Top Malayalam Movies');
        data = await discoverByFilters({ language: 'ml', region: 'IN', sortBy: 'popularity.desc' });
      }
      if (data) setRecs(data.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderMovie = ({ item }: { item: TMDbMovie }) => {
    const isTVItem = !!item.first_air_date || (!!item.name && !item.title);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MovieDetail', { movieId: item.id, isTV: isTVItem })}
        activeOpacity={0.8}
      >
        <Image
          source={item.poster_path ? { uri: `${IMG.poster_md}${item.poster_path}` } : require('../../assets/no-poster.png')}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{item.title || item.name}</Text>
          <View style={styles.meta}>
            <Ionicons name="star" size={10} color={COLORS.accent} />
            <Text style={styles.rating}>{(item.vote_average || 0).toFixed(1)}</Text>
            <Text style={styles.year}>· {(item.release_date || item.first_air_date)?.slice(0, 4)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <View>
            <Text style={styles.headerTitle}>AI Smart Picks</Text>
            <Text style={styles.headerSub}>Personalized discovery engine</Text>
          </View>
          <Ionicons name="sparkles" size={28} color={COLORS.accent} />
        </View>
      </View>

      {userProfile && userProfile.topGenres.length > 0 && (
        <View style={styles.dnaContainer}>
          <Text style={styles.dnaTitle}>YOUR CINEMA DNA</Text>
          <View style={styles.dnaRow}>
            {userProfile.topGenres.slice(0, 3).map((g: any, i: number) => (
              <View key={g.name} style={[styles.dnaChip, { opacity: 1 - (i * 0.2) }]}>
                <Text style={styles.dnaText}>{g.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.quickFilters, isLandscape && styles.quickFiltersLandscape]}>
        <FilterBtn icon="flash"   label="Thrillers" onPress={() => handleQuickFilter('thrilling')} />
        <FilterBtn icon="diamond" label="Gems"      onPress={() => handleQuickFilter('gems')} />
        <FilterBtn icon="calendar" label="Classics"  onPress={() => handleQuickFilter('classic')} />
      </View>

      <View style={[styles.quickFilters, isLandscape && styles.quickFiltersLandscape, { marginTop: -8 }]}>
        <FilterBtn icon="film"    label="Hindi"      onPress={() => handleQuickFilter('hi')} />
        <FilterBtn icon="flame"   label="Tamil"      onPress={() => handleQuickFilter('ta')} />
        <FilterBtn icon="water"   label="Malayalam"  onPress={() => handleQuickFilter('ml')} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Analyzing your taste...</Text>
        </View>
      ) : (
        <FlatList
          key={`ai-${numColumns}`}
          data={recommendations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovie}
          numColumns={numColumns}
          contentContainerStyle={[styles.list, { paddingHorizontal: isLandscape ? 32 : 16 }]}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
              <TouchableOpacity onPress={loadPersonalized} hitSlop={10} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={16} color={COLORS.accent} />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="sparkles-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No matches found. Try a different filter!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function FilterBtn({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.filterBtn} onPress={onPress}>
      <Ionicons name={icon} size={16} color={COLORS.accent} />
      <Text style={styles.filterLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerLandscape: { paddingTop: 24, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },

  dnaContainer: { marginHorizontal: 20, marginBottom: 20, padding: 15, backgroundColor: COLORS.accent + '10', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  dnaTitle: { fontSize: 10, fontWeight: '900', color: COLORS.accent, letterSpacing: 1, marginBottom: 8 },
  dnaRow: { flexDirection: 'row', gap: 8 },
  dnaChip: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dnaText: { fontSize: 12, color: COLORS.accent, fontWeight: '700' },

  quickFilters: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  quickFiltersLandscape: { paddingHorizontal: 32 },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.surface, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  filterLabel: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  refreshText: { fontSize: 11, color: COLORS.accent, fontWeight: '700' },

  list: { paddingBottom: 100 },
  columnWrapper: { gap: 12, marginBottom: 16 },
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  poster: { width: '100%', aspectRatio: 0.67, backgroundColor: COLORS.card },
  info: { padding: 8, gap: 2 },
  title: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: 10, color: COLORS.accent, fontWeight: '800' },
  year: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  loadingText: { color: COLORS.textSec, fontSize: 14, fontWeight: '600' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
});
