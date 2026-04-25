import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, IMG } from '../utils/constants';
import { getStats } from '../services/database';
import { useStore } from '../store/useStore';

export default function StatsScreen() {
  const { stats, refreshStats } = useStore();

  useFocusEffect(useCallback(() => {
    refreshStats();
  }, []));

  if (!stats || stats.total === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bar-chart-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No stats yet</Text>
        <Text style={styles.emptyText}>Add movies to your library to see your stats here</Text>
      </View>
    );
  }

  const pctWatched = stats.total > 0 ? Math.round((stats.watched / stats.total) * 100) : 0;

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refreshStats} tintColor={COLORS.accent} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Stats</Text>
        <Text style={styles.headerSub}>{stats.total} films in your library</Text>
      </View>

      {/* Big Numbers */}
      <View style={styles.bigRow}>
        <BigStat value={stats.watched}   label="Films Watched" color={COLORS.green}  icon="checkmark-circle" />
        <BigStat value={stats.watchlist} label="In Watchlist"  color={COLORS.blue}   icon="bookmark" />
        <BigStat value={stats.watching}  label="Watching"      color={COLORS.accent} icon="play-circle" />
      </View>

      {/* Time Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Time Invested</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeStat}>
            <Text style={styles.timeValue}>{stats.totalHours}</Text>
            <Text style={styles.timeLabel}>Hours Watched</Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeStat}>
            <Text style={styles.timeValue}>{stats.totalDays}</Text>
            <Text style={styles.timeLabel}>Days Watched</Text>
          </View>
          {stats.avgRating && (
            <>
              <View style={styles.timeDivider} />
              <View style={styles.timeStat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={18} color={COLORS.accent} />
                  <Text style={styles.timeValue}>{stats.avgRating}</Text>
                </View>
                <Text style={styles.timeLabel}>Avg Rating</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Library Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pctWatched}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>{pctWatched}% watched</Text>
          <Text style={styles.progressText}>{stats.watchlist + stats.watching} remaining</Text>
        </View>

        <View style={styles.progressLegend}>
          <LegendItem color={COLORS.green}  label="Watched"   value={stats.watched} />
          <LegendItem color={COLORS.accent} label="Watching"  value={stats.watching} />
          <LegendItem color={COLORS.blue}   label="Watchlist" value={stats.watchlist} />
        </View>
      </View>

      {/* Recently Watched */}
      {stats.recentlyWatched.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recently Watched</Text>
          <View style={styles.recentRow}>
            {stats.recentlyWatched.map((m) => (
              <View key={m.tmdb_id} style={styles.recentItem}>
                <Image
                  source={m.poster_path ? { uri: `${IMG.poster_sm}${m.poster_path}` } : require('../../assets/no-poster.png')}
                  style={styles.recentPoster}
                  resizeMode="cover"
                />
                <Text style={styles.recentTitle} numberOfLines={1}>{m.title}</Text>
                {m.user_rating && (
                  <View style={styles.recentRating}>
                    <Ionicons name="star" size={9} color={COLORS.accent} />
                    <Text style={styles.recentRatingText}>{m.user_rating}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Favourites */}
      {stats.favourites.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>❤️ Favourites</Text>
          <View style={styles.recentRow}>
            {stats.favourites.slice(0, 5).map((m) => (
              <View key={m.tmdb_id} style={styles.recentItem}>
                <Image
                  source={m.poster_path ? { uri: `${IMG.poster_sm}${m.poster_path}` } : require('../../assets/no-poster.png')}
                  style={styles.recentPoster}
                  resizeMode="cover"
                />
                <Text style={styles.recentTitle} numberOfLines={1}>{m.title}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function BigStat({ value, label, color, icon }: { value: number; label: string; color: string; icon: any }) {
  return (
    <View style={[bs.wrap, { borderColor: color + '30' }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[bs.value, { color }]}>{value}</Text>
      <Text style={bs.label}>{label}</Text>
    </View>
  );
}
const bs = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, gap: 4 },
  value: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', fontWeight: '500' },
});

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={li.row}>
      <View style={[li.dot, { backgroundColor: color }]} />
      <Text style={li.label}>{label}</Text>
      <Text style={[li.value, { color }]}>{value}</Text>
    </View>
  );
}
const li = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:   { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 13, color: COLORS.textSec },
  value: { fontSize: 13, fontWeight: '700' },
});

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  empty:       { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.textSec },
  emptyText:   { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },

  header:      { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  headerSub:   { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },

  bigRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },

  card:      { backgroundColor: COLORS.surface, borderRadius: 14, padding: 18, marginHorizontal: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },

  timeRow:     { flexDirection: 'row', alignItems: 'center' },
  timeStat:    { flex: 1, alignItems: 'center' },
  timeDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  timeValue:   { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  timeLabel:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  progressBar:    { height: 10, backgroundColor: COLORS.card, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill:   { height: '100%', backgroundColor: COLORS.green, borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  progressText:   { fontSize: 12, color: COLORS.textMuted },
  progressLegend: { gap: 8 },

  recentRow:  { flexDirection: 'row', gap: 10 },
  recentItem: { flex: 1, alignItems: 'center' },
  recentPoster: { width: '100%', aspectRatio: 0.67, borderRadius: 8, backgroundColor: COLORS.card },
  recentTitle:  { fontSize: 10, color: COLORS.textSec, marginTop: 6, textAlign: 'center' },
  recentRating: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  recentRatingText: { fontSize: 10, color: COLORS.accent, fontWeight: '700' },
});
