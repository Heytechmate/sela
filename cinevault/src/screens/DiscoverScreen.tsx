import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, Animated,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, IMG, MOODS } from '../utils/constants';
import {
  getTrending, getTopRated, getKDramas,
  discoverByGenres, getIndianCinema, getHiddenGems, TMDbMovie
} from '../services/tmdb';
import { useWindowDimensions } from '../hooks/useOrientation';
import { useStore } from '../store/useStore';

const { width: SCREEN_W } = Dimensions.get('window');

// Optimize Item Component for Performance
const GridItem = React.memo(({ item, navigation, contentMode }: { item: TMDbMovie, navigation: any, contentMode: string }) => (
  <TouchableOpacity
    style={styles.gridItem}
    onPress={() => navigation.navigate('MovieDetail', {
      movieId: item.id,
      isTV: contentMode === 'tv' || !!item.first_air_date,
      initialData: item
    })}
  >
    <View style={styles.posterContainer}>
      <Image
        source={item.poster_path ? { uri: `${IMG.poster_md}${item.poster_path}` } : require('../../assets/no-poster.png')}
        style={styles.gridPoster}
        fadeDuration={0} // Faster image appearance
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.gridRating}>
        <Ionicons name="star" size={10} color={COLORS.accent} />
        <Text style={styles.ratingText}>{(item.vote_average || 0).toFixed(1)}</Text>
      </View>
    </View>
    <Text style={styles.gridTitle} numberOfLines={2}>{item.title || item.name}</Text>
  </TouchableOpacity>
));

const BentoSkeleton = () => (
  <View style={styles.bentoContainer}>
    <View style={[styles.bentoLarge, { backgroundColor: COLORS.surface, opacity: 0.5 }]} />
    <View style={styles.voyageRow}>
      <View style={[styles.voyageCard, { backgroundColor: COLORS.surface, opacity: 0.5 }]} />
      <View style={[styles.voyageCard, { backgroundColor: COLORS.surface, opacity: 0.5 }]} />
      <View style={[styles.voyageCard, { backgroundColor: COLORS.surface, opacity: 0.5 }]} />
    </View>
  </View>
);

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { width, height } = useWindowDimensions();
  const { library, contentMode, vaultUnlocked } = useStore();
  const initMood   = route.params?.mood;

  const isLandscape = width > height;

  // Adaptive Grid logic
  const numColumns = useMemo(() => {
    if (width > 1200) return 6;
    if (width > 900)  return 4;
    return 2; // Using 2 for a more "magazine" feel on mobile
  }, [width]);

  const [activeMood, setActiveMood] = useState<any>(null);
  const [movies, setMovies]         = useState<TMDbMovie[]>([]);

  // Hub Data
  const [trending, setTrending] = useState<TMDbMovie[]>([]);
  const [indianMovies, setIndianMovies] = useState<TMDbMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDbMovie[]>([]);
  const [kdramas, setKdramas] = useState<TMDbMovie[]>([]);
  const [hiddenGems, setHiddenGems] = useState<TMDbMovie[]>([]);

  const [loading, setLoading]       = useState(false);
  const [hubLoading, setHubLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;

  const libIds = useMemo(() => new Set(library.map(m => m.tmdb_id)), [library]);

  const fMovies = useMemo(() => movies.filter(m => !libIds.has(m.id)), [movies, libIds]);
  const fTrending = useMemo(() => trending.filter(m => !libIds.has(m.id)), [trending, libIds]);
  const fIndian = useMemo(() => indianMovies.filter(m => !libIds.has(m.id)), [indianMovies, libIds]);
  const fTopRated = useMemo(() => topRated.filter(m => !libIds.has(m.id)), [topRated, libIds]);
  const fKdramas = useMemo(() => kdramas.filter(m => !libIds.has(m.id)), [kdramas, libIds]);
  const fGems = useMemo(() => hiddenGems.filter(m => !libIds.has(m.id)), [hiddenGems, libIds]);

  // Extended Moods for Vault
  const displayMoods = useMemo(() => {
    const base = [...MOODS];
    if (vaultUnlocked) {
      base.push(
        { id: 'noir', label: 'Noir Vault', icon: 'incognito', lib: 'MCI', genres: [80, 9648], color: '#6366F1' },
        { id: 'forbidden', label: 'Late Night', icon: 'moon-waning-crescent', lib: 'MCI', genres: [27, 53], color: '#EC4899' }
      );
    }
    return base;
  }, [vaultUnlocked]);

  const loadMoodMovies = useCallback(async (mood: any) => {
    if (!mood) return;
    setLoading(true);
    try {
      const isTV = contentMode === 'tv';
      const data = await discoverByGenres(mood.genres, isTV);
      setMovies(data?.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [contentMode]);

  const loadHubData = useCallback(async () => {
    // Start showing placeholders or cached data if available
    setHubLoading(true);
    try {
      const type = contentMode === 'all' ? 'movie' : contentMode;
      const [t, tr, kd, hg] = await Promise.all([
        getTrending(type, 'day'),
        getTopRated(type),
        getKDramas(),
        getHiddenGems(type as any)
      ]);
      setTrending(t.results.slice(0, 10));
      setTopRated(tr.results.slice(0, 15));
      setKdramas(kd.results.slice(0, 15));
      setHiddenGems(hg.results.slice(0, 15));

      if (contentMode !== 'tv') {
        const ind = await getIndianCinema();
        setIndianMovies(ind.results.slice(0, 15));
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Small delay to ensure layout is ready before hiding loader
      setTimeout(() => setHubLoading(false), 50);
    }
  }, [contentMode]);

  useEffect(() => {
    loadHubData();
    if (initMood) {
      setActiveMood(initMood);
      loadMoodMovies(initMood);
    }
  }, [initMood, loadMoodMovies, loadHubData, contentMode]);

  const handleMoodPress = (mood: any) => {
    setActiveMood(mood);
    loadMoodMovies(mood);
  };

  const luckyPick = () => {
    const list = activeMood ? fMovies : fTrending;
    if (list.length === 0) return;
    const random = list[Math.floor(Math.random() * list.length)];
    navigation.navigate('MovieDetail', {
      movieId: random.id,
      isTV: contentMode === 'tv' || !!random.first_air_date,
      initialData: random
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <View>
          <Text style={[styles.headerTitle, vaultUnlocked && styles.vaultText]}>
            {vaultUnlocked ? 'GLOBAL VAULT' : 'DISCOVERY'}
          </Text>
          <Text style={styles.headerSub}>Find your next obsession</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.luckyBtn} onPress={() => navigation.navigate('Calendar')}>
            <Ionicons name="calendar" size={18} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.luckyBtn} onPress={luckyPick}>
            <Ionicons name="sparkles" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mood Palette - The "Vibe Engine" */}
      <View style={styles.paletteContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
          {displayMoods.map((mood) => {
            const active = activeMood?.id === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                onPress={() => handleMoodPress(mood)}
                style={[styles.moodItem, active && { backgroundColor: mood.color }]}
              >
                {mood.lib === 'MCI' ? (
                  <MaterialCommunityIcons name={mood.icon as any} size={18} color={active ? COLORS.bg : mood.color} />
                ) : (
                  <Ionicons name={mood.icon as any} size={18} color={active ? COLORS.bg : mood.color} />
                )}
                <Text style={[styles.moodText, active && { color: COLORS.bg }]}>{mood.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {!activeMood && (
        hubLoading ? <BentoSkeleton /> : (
          <View style={styles.bentoContainer}>
            {/* Main Feature - Spotlight */}
            {fTrending.length > 0 && (
              <TouchableOpacity
                style={[styles.bentoLarge, { width: width - 32 }]}
                onPress={() => navigation.navigate('MovieDetail', {
                  movieId: fTrending[0].id,
                  isTV: !!fTrending[0].first_air_date || (contentMode === 'tv'),
                  initialData: fTrending[0]
                })}
              >
                <Image source={{ uri: `${IMG.backdrop}${fTrending[0].backdrop_path}` }} style={styles.bentoImg} fadeDuration={0} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.bentoBadge}>
                  <Text style={styles.bentoBadgeText}>#1 WORLDWIDE</Text>
                </View>
                <View style={styles.bentoContent}>
                  <Text style={styles.bentoTitle}>{fTrending[0].title || fTrending[0].name}</Text>
                  <Text style={styles.bentoSub}>{fTrending[0].overview?.slice(0, 60)}...</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Hub Rows - Different visual identity */}
            <View style={styles.voyageRow}>
              {fIndian.length > 0 && (
                <TouchableOpacity style={styles.voyageCard} onPress={() => navigation.navigate('Browse', { category: 'indian' })}>
                  <Image source={{ uri: `${IMG.poster_md}${fIndian[0].poster_path}` }} style={styles.voyageImg} fadeDuration={0} />
                  <BlurView intensity={30} tint="dark" style={styles.voyageLabel}>
                    <Text style={styles.voyageText}>🇮🇳 Indian</Text>
                  </BlurView>
                </TouchableOpacity>
              )}
              {fKdramas.length > 0 && (
                <TouchableOpacity style={styles.voyageCard} onPress={() => navigation.navigate('Browse', { category: 'kdrama', isTV: true })}>
                  <Image source={{ uri: `${IMG.poster_md}${fKdramas[0].poster_path}` }} style={styles.voyageImg} fadeDuration={0} />
                  <BlurView intensity={30} tint="dark" style={styles.voyageLabel}>
                    <Text style={styles.voyageText}>🇰🇷 K-Wave</Text>
                  </BlurView>
                </TouchableOpacity>
              )}
              {fGems.length > 0 && (
                <TouchableOpacity style={styles.voyageCard} onPress={() => navigation.navigate('Browse', { category: 'gems' })}>
                  <Image source={{ uri: `${IMG.poster_md}${fGems[0].poster_path}` }} style={styles.voyageImg} fadeDuration={0} />
                  <BlurView intensity={30} tint="dark" style={styles.voyageLabel}>
                    <Text style={styles.voyageText}>💎 Gems</Text>
                  </BlurView>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.loadingText}>Brewing matches...</Text>
        </View>
      )}

      {activeMood && !loading && (
        <View style={styles.resultsMeta}>
          <Text style={styles.resultsTitle}>{activeMood.label} Collection</Text>
          <TouchableOpacity onPress={() => setActiveMood(null)}>
             <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      {vaultUnlocked && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0A0A0F' }]}>
           <LinearGradient colors={['rgba(99, 102, 241, 0.05)', 'transparent']} style={{ height: 300 }} />
        </View>
      )}

      <FlashList
        key={`discover-${numColumns}`}
        data={activeMood ? fMovies : []}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        estimatedItemSize={250}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: 16
        }}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          !loading && activeMood && fMovies.length === 0 ? (
            <View style={styles.placeholder}>
              <Ionicons name="planet-outline" size={64} color={COLORS.border} />
              <Text style={styles.placeholderText}>Nothing in this orbit yet.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <GridItem item={item} navigation={navigation} contentMode={contentMode} />
        )}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  listContent: { paddingBottom: 100 },
  headerContainer: { marginBottom: 20 },
  header:      { paddingHorizontal: 16, paddingTop: 64, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLandscape: { paddingTop: 24 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -1 },
  headerSub:   { fontSize: 14, color: COLORS.textMuted, marginTop: -2 },
  vaultText:   { color: COLORS.red, textShadowColor: 'rgba(239, 68, 68, 0.5)', textShadowRadius: 10 },

  luckyBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border
  },

  paletteContainer: { marginVertical: 10 },
  paletteScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 10 },
  moodItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 25,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border
  },
  moodText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  bentoContainer: { paddingHorizontal: 16, gap: 12 },
  bentoLarge: {
    height: 240, borderRadius: 30, overflow: 'hidden',
    backgroundColor: COLORS.card, elevation: 5
  },
  bentoImg: { width: '100%', height: '100%' },
  bentoBadge: {
    position: 'absolute', top: 20, left: 20,
    backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8
  },
  bentoBadgeText: { fontSize: 10, fontWeight: '900', color: COLORS.bg },
  bentoContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  bentoTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  bentoSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  voyageRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  voyageCard: { flex: 1, height: 160, borderRadius: 20, overflow: 'hidden', backgroundColor: COLORS.card },
  voyageImg: { width: '100%', height: '100%' },
  voyageLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 10, alignItems: 'center' },
  voyageText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },

  loadingContainer: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.textSec, fontSize: 14, fontWeight: '600' },

  resultsMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  resultsTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },

  gridRow: { gap: 16, marginBottom: 20 },
  gridItem: { flex: 1, margin: 8 },
  posterContainer: { width: '100%', aspectRatio: 0.7, borderRadius: 20, overflow: 'hidden', backgroundColor: COLORS.card },
  gridPoster: { width: '100%', height: '100%' },
  gridRating: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  ratingText: { color: COLORS.accent, fontSize: 10, fontWeight: '800' },
  gridTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSec, marginTop: 8, paddingHorizontal: 4 },

  placeholder: { padding: 100, alignItems: 'center', gap: 20 },
  placeholderText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
});

