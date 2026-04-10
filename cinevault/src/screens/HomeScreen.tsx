import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { COLORS, IMG, MOODS, WATCH_STATUS } from '../utils/constants';
import {
  getTrending, getNowPlaying, getPopular, getTopRated,
  getRecommendationsForLibrary, getKDramas, TMDbMovie
} from '../services/tmdb';
import { useStore } from '../store/useStore';
import { useWindowDimensions } from '../hooks/useOrientation';

import * as LocalAuthentication from 'expo-local-authentication';

const CARD_W = 110;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { refreshLibrary, refreshStats, stats, contentMode, setContentMode, library, vaultUnlocked, setVaultUnlocked } = useStore();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width > 800;

  const HERO_H = isTablet ? 380 : (isLandscape ? 280 : 220);
  const CARD_W_DYNAMIC = isTablet ? 150 : 100;

  const [trending, setTrending] = useState<TMDbMovie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TMDbMovie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDbMovie[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDbMovie[]>([]);
  const [popularTV, setPopularTV] = useState<TMDbMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDbMovie[]>([]);
  const [kdramas, setKdramas] = useState<TMDbMovie[]>([]);
  const [recommendations, setRecommendations] = useState<TMDbMovie[]>([]);
  const [dailyPick, setDailyPick] = useState<TMDbMovie | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter content: Remove items already in library
  const libIds = useMemo(() => new Set(library.map(m => m.tmdb_id)), [library]);

  const fTrending = useMemo(() => trending.filter(m => !libIds.has(m.id)), [trending, libIds]);
  const fTrendingTV = useMemo(() => trendingTV.filter(m => !libIds.has(m.id)), [trendingTV, libIds]);
  const fNowPlaying = useMemo(() => nowPlaying.filter(m => !libIds.has(m.id)), [nowPlaying, libIds]);
  const fPopularMovies = useMemo(() => popularMovies.filter(m => !libIds.has(m.id)), [popularMovies, libIds]);
  const fPopularTV = useMemo(() => popularTV.filter(m => !libIds.has(m.id)), [popularTV, libIds]);
  const fTopRated = useMemo(() => topRated.filter(m => !libIds.has(m.id)), [topRated, libIds]);
  const fKdramas = useMemo(() => kdramas.filter(m => !libIds.has(m.id)), [kdramas, libIds]);
  const fRecommendations = useMemo(() => recommendations.filter(m => !libIds.has(m.id)), [recommendations, libIds]);

  const loadData = useCallback(async () => {
    try {
      const [tM, tT, n, pM, pT, tr, kd] = await Promise.all([
        getTrending('movie', 'day'),
        getTrending('tv', 'day'),
        getNowPlaying(),
        getPopular('movie'),
        getPopular('tv'),
        getTopRated('movie'),
        getKDramas()
      ]);
      setTrending(tM.results.slice(0, 10));
      setTrendingTV(tT.results.slice(0, 20));
      setNowPlaying(n.results.slice(0, 20));
      setPopularMovies(pM.results.slice(0, 20));
      setPopularTV(pT.results.slice(0, 20));
      setTopRated(tr.results.slice(0, 20));
      setKdramas(kd.results.slice(0, 20));

      // Pre-fetch hero backdrops for smooth transitions
      tM.results.slice(0, 5).forEach((movie: TMDbMovie) => {
        if (movie.backdrop_path) {
          Image.prefetch(`${IMG.backdrop}${movie.backdrop_path}`);
        }
      });

      // Daily Pick: Deterministic based on date
      const dateSeed = new Date().toISOString().split('T')[0];
      const seedNum = dateSeed.split('-').reduce((acc, v) => acc + parseInt(v), 0);
      const pick = tM.results[seedNum % tM.results.length];
      setDailyPick(pick);

      if (pick?.backdrop_path) {
        Image.prefetch(`${IMG.backdrop}${pick.backdrop_path}`);
      }

      await refreshStats();

      // Personalized Recs
      const { library } = useStore.getState();
      if (library.length > 0) {
        const recs = await getRecommendationsForLibrary(library);
        setRecommendations(recs);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    let isMounted = true;
    InteractionManager.runAfterInteractions(() => {
      if (isMounted) {
        loadData();
        refreshLibrary();
      }
    });
    return () => { isMounted = false; };
  }, [loadData, refreshLibrary]);

  useEffect(() => {
    if (trending.length === 0 || !isFocused) return;
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % Math.min(trending.length, 5));
    }, 6000);
    return () => clearInterval(interval);
  }, [trending, isFocused]);

  const hero = useMemo(() => fTrending[heroIndex], [fTrending, heroIndex]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleVaultToggle = async () => {
    if (vaultUnlocked) {
      setVaultUnlocked(false);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock CineVault Secure Library',
        fallbackLabel: 'Enter PIN',
      });
      if (result.success) {
        setVaultUnlocked(true);
      }
    } else {
      // Fallback if no biometrics
      setVaultUnlocked(true);
    }
  };


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loaderText}>Loading CineVault…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
    >
      {/* ── Header / Welcome ── */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={handleVaultToggle}
          delayLongPress={3000}
        >
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={[styles.appName, vaultUnlocked && { color: COLORS.red }]}>
            CineVault{vaultUnlocked ? ' (Unlocked)' : ''}
          </Text>
        </TouchableOpacity>

        {/* Master Mode Toggle */}
        <View style={styles.modeToggle}>
          {(['all', 'movie', 'tv'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setContentMode(m)}
              style={[styles.modeBtn, contentMode === m && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, contentMode === m && styles.modeBtnTextActive]}>
                {m === 'all' ? 'All' : m === 'movie' ? 'Cinema' : 'TV'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Hero / Daily Pick ── */}
      {hero && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('MovieDetail', {
            movieId: hero.id,
            isTV: !!hero.first_air_date || (contentMode === 'tv'),
            initialData: hero
          })}
          style={[styles.heroContainer, isTablet && { paddingHorizontal: 16 }]}
        >
          <View style={{ width: isTablet ? '100%' : width - 32, height: HERO_H, alignSelf: 'center', borderRadius: 24, overflow: 'hidden' }}>
            <Image
              source={{ uri: `${IMG.backdrop}${hero.backdrop_path}` }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              fadeDuration={0}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.95)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={[styles.heroContent, isTablet && { padding: 40 }]}>
              <View style={styles.dailyBadge}>
                <Ionicons name="sparkles" size={isTablet ? 16 : 12} color={COLORS.bg} />
                <Text style={[styles.dailyBadgeText, isTablet && { fontSize: 13 }]}>DAILY PICK</Text>
              </View>
              <Text style={[styles.heroTitle, isTablet && { fontSize: 42, lineHeight: 52 }]} numberOfLines={2}>{hero.title}</Text>
              <View style={styles.heroMeta}>
                <Ionicons name="star" size={isTablet ? 18 : 13} color={COLORS.accent} />
                <Text style={[styles.heroRating, isTablet && { fontSize: 18 }]}>{(hero.vote_average || 0).toFixed(1)}</Text>
                <Text style={styles.heroDot}>·</Text>
                <Text style={[styles.heroYear, isTablet && { fontSize: 18 }]}>{hero.release_date?.slice(0, 4)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.body, isTablet && { paddingHorizontal: 16 }]}>
        {/* ── Quick Stats Glance ── */}
        {stats && (stats.watched > 0 || stats.watchlist > 0) && (
          <View style={styles.glanceBar}>
            <TouchableOpacity
              style={styles.glanceItem}
              onPress={() => navigation.navigate('Library', { initialTab: WATCH_STATUS.WATCHED })}
            >
              <Ionicons name="checkmark-done" size={16} color={COLORS.green} />
              <View>
                <Text style={styles.glanceValue}>{stats.watched}</Text>
                <Text style={styles.glanceLabel}>Watched</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.glanceDivider} />

            <TouchableOpacity
              style={styles.glanceItem}
              onPress={() => navigation.navigate('Library', { initialTab: WATCH_STATUS.WATCHLIST })}
            >
              <Ionicons name="bookmark" size={14} color={COLORS.blue} />
              <View>
                <Text style={styles.glanceValue}>{stats.watchlist}</Text>
                <Text style={styles.glanceLabel}>Queue</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.glanceDivider} />

            <View style={styles.glanceItem}>
              <Ionicons name="time" size={16} color={COLORS.accent} />
              <View>
                <Text style={styles.glanceValue}>{stats.totalHours}h</Text>
                <Text style={styles.glanceLabel}>Hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Mood Picker ── */}
        <SectionHeader title="What's the vibe?" onSeeAll={() => navigation.navigate('Discover')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.moodChip, { borderColor: m.color + '30' }]}
              onPress={() => navigation.navigate('Discover', { mood: m })}
            >
              <View style={[styles.moodIconWrap, { backgroundColor: m.color + '15' }]}>
                {m.lib === 'MCI' ? (
                  <MaterialCommunityIcons name={m.icon as any} size={20} color={m.color} />
                ) : (
                  <Ionicons name={m.icon as any} size={18} color={m.color} />
                )}
              </View>
              <Text style={[styles.moodLabel, { color: COLORS.textPrimary }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Horizontal Lists ── */}
        {(contentMode === 'all' || contentMode === 'movie') && (
          <>
            <MovieSection title="Trending Movies" data={fTrending} navigation={navigation} category="trending" isTablet={isTablet} cardWidth={CARD_W_DYNAMIC} />
            <MovieSection title="Now in Cinemas" data={fNowPlaying} navigation={navigation} category="now_playing" isTablet={isTablet} cardWidth={CARD_W_DYNAMIC} />
            <MovieSection title="Top Rated Classics" data={fTopRated} navigation={navigation} category="top_rated" isTablet={isTablet} cardWidth={CARD_W_DYNAMIC} />
            <MovieSection title="Popular Movies" data={fPopularMovies} navigation={navigation} category="popular" isTablet={isTablet} cardWidth={CARD_W_DYNAMIC} />
          </>
        )}

        {(contentMode === 'all' || contentMode === 'tv') && (
          <>
            <MovieSection title="Trending TV Shows" data={fTrendingTV} navigation={navigation} category="trending_tv" isTV isTablet={isTablet} cardWidth={CARD_W_DYNAMIC} />
            <MovieSection title="Korean Drama Essentials" data={fKdramas} navigation={navigation} category="kdrama" isTV isTablet={isTablet} cardWidth={CARD_W_DYNAMIC} />
            <MovieSection title="Popular on TV" data={fPopularTV} navigation={navigation} category="popular_tv" isTV isTablet={isTablet} cardWidth={CARD_W_DYNAMIC} />
          </>
        )}

        {/* Personalized Section */}
        {fRecommendations.length > 0 && contentMode === 'all' && (
          <MovieSection title="Recommended for You" data={fRecommendations} navigation={navigation} category="recommendations" isTablet={isTablet} cardWidth={CARD_W_DYNAMIC} />
        )}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ──────────────────────────────────────────

const MovieSection = memo(({ title, data, navigation, category, isTV, isTablet, cardWidth }: any) => {
  if (!data?.length) return null;
  return (
    <>
      <SectionHeader title={title} onSeeAll={() => navigation.navigate('Browse', { category, isTV })} isTablet={isTablet} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.movieRow, isTablet && { gap: 24 }]}
        removeClippedSubviews={true}
      >
        {data.map((m: TMDbMovie) => (
          <MovieCard
            key={m.id}
            movie={m}
            cardWidth={cardWidth}
            isTablet={isTablet}
            onPress={() => navigation.navigate('MovieDetail', {
              movieId: m.id,
              isTV: isTV || !!m.first_air_date || !!m.name && !m.title,
              initialData: m
            })}
          />
        ))}
      </ScrollView>
    </>
  );
});

const SectionHeader = memo(({ title, onSeeAll, isTablet }: { title: string; onSeeAll?: () => void; isTablet?: boolean }) => {
  return (
    <View style={[sh.row, isTablet && { marginTop: 40, marginBottom: 20 }]}>
      <Text style={[sh.title, isTablet && { fontSize: 24 }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[sh.seeAll, isTablet && { fontSize: 18 }]}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const MovieCard = memo(({ movie, onPress, isTablet, cardWidth }: { movie: TMDbMovie; onPress: () => void; isTablet?: boolean; cardWidth: number }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ width: cardWidth }} activeOpacity={0.75}>
      <Image
        source={
          movie.poster_path
            ? { uri: `${IMG.poster_md}${movie.poster_path}` }
            : require('../../assets/no-poster.png')
        }
        style={{ width: cardWidth, height: cardWidth * 1.5, borderRadius: 16, backgroundColor: COLORS.card }}
        resizeMode="cover"
      />
      <View style={[mc.badge, isTablet && { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }]}>
        <Ionicons name="star" size={isTablet ? 14 : 9} color={COLORS.accent} />
        <Text style={[mc.rating, isTablet && { fontSize: 14 }]}>{(movie.vote_average || 0).toFixed(1)}</Text>
      </View>
      <Text style={[mc.title, isTablet && { fontSize: 16, marginTop: 12 }]} numberOfLines={1}>{movie.title || movie.name}</Text>
    </TouchableOpacity>
  );
});

const StatChip = memo(({ icon, label, value, color, isTablet, onPress }: { icon: any; label: string; value: number; color: string; isTablet?: boolean; onPress?: () => void }) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[sc.chip, { borderColor: color + '20' }, isTablet && { paddingVertical: 24, borderRadius: 24 }]}
    >
      <Ionicons name={icon} size={isTablet ? 28 : 18} color={color} />
      <Text style={[sc.value, { color }, isTablet && { fontSize: 32 }]}>{value}</Text>
      <Text style={[sc.label, isTablet && { fontSize: 14 }]}>{label}</Text>
    </TouchableOpacity>
  );
});

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: COLORS.textSec, fontFamily: 'System', fontSize: 14 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  welcomeText: { fontSize: 14, color: COLORS.textSec, fontWeight: '500' },
  appName: { fontSize: 28, color: COLORS.textPrimary, fontWeight: '900', letterSpacing: -0.5 },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: COLORS.accent,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modeBtnTextActive: {
    color: COLORS.bg,
  },

  profileBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  heroContainer: { marginBottom: 10 },
  heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroTag: { fontSize: 11, color: COLORS.accent, fontWeight: '700', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, lineHeight: 32 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  heroRating: { fontSize: 14, color: COLORS.accent, fontWeight: '700' },
  heroDot: { color: COLORS.textMuted, fontSize: 14 },
  heroYear: { fontSize: 14, color: COLORS.textSec },
  heroDots: { position: 'absolute', bottom: 12, right: 20, flexDirection: 'row', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 18, backgroundColor: COLORS.accent },

  dailyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8,
  },
  dailyBadgeText: { fontSize: 10, fontWeight: '900', color: COLORS.bg },

  body: { paddingTop: 10 },

  glanceBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  glanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  glanceDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  glanceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  glanceLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  moodRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
  moodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingLeft: 10, paddingRight: 16, paddingVertical: 10,
    borderRadius: 16, borderWidth: 1,
    backgroundColor: COLORS.surface,
  },
  moodIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  moodLabel: { fontSize: 13, fontWeight: '700' },

  movieRow: { paddingHorizontal: 16, gap: 14, paddingBottom: 10 },
});

const sh = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 28, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  seeAll: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },
});

const mc = StyleSheet.create({
  wrap: { width: CARD_W },
  poster: { width: CARD_W, height: CARD_W * 1.5, borderRadius: 12, backgroundColor: COLORS.card },
  badge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 4,
  },
  rating: { fontSize: 10, color: COLORS.accent, fontWeight: '800' },
  title: { fontSize: 12, color: COLORS.textSec, marginTop: 8, fontWeight: '600' },
});

const sc = StyleSheet.create({
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, gap: 4,
  },
  value: { fontSize: 22, fontWeight: '900' },
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});
