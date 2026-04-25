import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, IMG, MOODS } from '../utils/constants';
import { getTrending, getNowPlaying, TMDbMovie } from '../services/tmdb';
import { getStats } from '../services/database';
import { useStore } from '../store/useStore';
import { useWindowDimensions } from '../hooks/useOrientation';

const CARD_W = 110;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { refreshLibrary, refreshStats } = useStore();
  const { width } = useWindowDimensions();
  const isLandscape = width > 600;
  const HERO_H = isLandscape ? Math.round(width * 0.32) : Math.round(width * 0.6);

  const [trending, setTrending] = useState<TMDbMovie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDbMovie[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [t, n] = await Promise.all([getTrending('week'), getNowPlaying()]);
      setTrending(t.slice(0, 10));
      setNowPlaying(n.slice(0, 20));
      setStats(getStats());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); refreshLibrary(); refreshStats(); }, []);

  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % Math.min(trending.length, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [trending]);

  const hero = trending[heroIndex];

  const onRefresh = () => { setRefreshing(true); loadData(); };

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
      {/* ── Hero Banner ── */}
      {hero && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('MovieDetail', { movieId: hero.id })}
        >
          <View style={{ width, height: HERO_H }}>
            <Image
              source={{ uri: `${IMG.backdrop}${hero.backdrop_path}` }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', COLORS.bg]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0.3 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroTag}>🔥 Trending</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>{hero.title}</Text>
              <View style={styles.heroMeta}>
                <Ionicons name="star" size={13} color={COLORS.accent} />
                <Text style={styles.heroRating}>{hero.vote_average.toFixed(1)}</Text>
                <Text style={styles.heroDot}>·</Text>
                <Text style={styles.heroYear}>{hero.release_date?.slice(0, 4)}</Text>
              </View>
            </View>
            {/* Dots */}
            <View style={styles.heroDots}>
              {Array(Math.min(trending.length, 5)).fill(0).map((_, i) => (
                <View key={i} style={[styles.dot, i === heroIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.body}>
        {/* ── Quick Stats ── */}
        {stats && (stats.watched > 0 || stats.watchlist > 0) && (
          <View style={styles.statsRow}>
            <StatChip icon="checkmark-circle" label="Watched" value={stats.watched} color={COLORS.green} />
            <StatChip icon="time"             label="Queued"  value={stats.watchlist} color={COLORS.blue} />
            <StatChip icon="time-outline"     label="Hours"   value={stats.totalHours} color={COLORS.accent} />
          </View>
        )}

        {/* ── Mood Picker ── */}
        <SectionHeader title="Pick a Mood" onSeeAll={() => navigation.navigate('Mood')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.moodChip, { borderColor: m.color + '60' }]}
              onPress={() => navigation.navigate('Discover', { mood: m })}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, { color: m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Trending This Week ── */}
        <SectionHeader title="Trending This Week" onSeeAll={() => navigation.navigate('Browse', { category: 'trending' })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieRow}>
          {trending.map((m) => (
            <MovieCard key={m.id} movie={m} onPress={() => navigation.navigate('MovieDetail', { movieId: m.id })} />
          ))}
        </ScrollView>

        {/* ── Now Playing ── */}
        <SectionHeader title="Now in Cinemas" onSeeAll={() => navigation.navigate('Browse', { category: 'now_playing' })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieRow}>
          {nowPlaying.map((m) => (
            <MovieCard key={m.id} movie={m} onPress={() => navigation.navigate('MovieDetail', { movieId: m.id })} />
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={sh.seeAll}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MovieCard({ movie, onPress }: { movie: TMDbMovie; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={mc.wrap} activeOpacity={0.75}>
      <Image
        source={
          movie.poster_path
            ? { uri: `${IMG.poster_md}${movie.poster_path}` }
            : require('../../assets/no-poster.png')
        }
        style={mc.poster}
        resizeMode="cover"
      />
      <View style={mc.badge}>
        <Ionicons name="star" size={9} color={COLORS.accent} />
        <Text style={mc.rating}>{movie.vote_average.toFixed(1)}</Text>
      </View>
      <Text style={mc.title} numberOfLines={1}>{movie.title}</Text>
    </TouchableOpacity>
  );
}

function StatChip({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <View style={[sc.chip, { borderColor: color + '40' }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: COLORS.textSec, fontFamily: 'System', fontSize: 14 },

  heroContent: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  heroTag: { fontSize: 11, color: COLORS.accent, fontWeight: '700', marginBottom: 4, letterSpacing: 1 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 28 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  heroRating: { fontSize: 13, color: COLORS.accent, fontWeight: '700' },
  heroDot: { color: COLORS.textMuted, fontSize: 13 },
  heroYear: { fontSize: 13, color: COLORS.textSec },
  heroDots: { position: 'absolute', bottom: 8, right: 16, flexDirection: 'row', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted },
  dotActive: { width: 16, backgroundColor: COLORS.accent },

  body: { paddingTop: 20 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 },

  moodRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  moodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: COLORS.surface,
  },
  moodEmoji: { fontSize: 16 },
  moodLabel: { fontSize: 13, fontWeight: '600' },

  movieRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
});

const sh = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  seeAll: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
});

const mc = StyleSheet.create({
  wrap: { width: CARD_W },
  poster: { width: CARD_W, height: CARD_W * 1.5, borderRadius: 8, backgroundColor: COLORS.card },
  badge: {
    position: 'absolute', top: 6, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  rating: { fontSize: 9, color: COLORS.accent, fontWeight: '700' },
  title: { fontSize: 11, color: COLORS.textSec, marginTop: 6, fontWeight: '500' },
});

const sc = StyleSheet.create({
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, gap: 2,
  },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
});
