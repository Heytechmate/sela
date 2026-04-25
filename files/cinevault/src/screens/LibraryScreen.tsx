import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, IMG, WATCH_STATUS, STATUS_COLORS } from '../utils/constants';
import { getAllMovies, LocalMovie } from '../services/database';
import { useStore } from '../store/useStore';

const TABS = [
  { id: WATCH_STATUS.WATCHLIST, label: 'Watchlist', icon: 'bookmark' },
  { id: WATCH_STATUS.WATCHING,  label: 'Watching',  icon: 'play-circle' },
  { id: WATCH_STATUS.WATCHED,   label: 'Watched',   icon: 'checkmark-circle' },
];

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { refreshLibrary } = useStore();
  const [activeTab, setActiveTab] = useState(WATCH_STATUS.WATCHLIST);
  const [movies, setMovies] = useState<LocalMovie[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'date_added' | 'title' | 'user_rating'>('date_added');

  const loadMovies = useCallback(() => {
    const data = getAllMovies(activeTab);
    const sorted = [...data].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'user_rating') return (b.user_rating ?? 0) - (a.user_rating ?? 0);
      return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
    });
    setMovies(sorted);
  }, [activeTab, sortBy]);

  useFocusEffect(useCallback(() => {
    loadMovies();
    refreshLibrary();
  }, [loadMovies]));

  const onRefresh = () => {
    setRefreshing(true);
    loadMovies();
    setRefreshing(false);
  };

  const renderMovie = ({ item }: { item: LocalMovie }) => {
    const genres = (() => { try { return JSON.parse(item.genres); } catch { return []; } })();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MovieDetail', { movieId: item.tmdb_id })}
        activeOpacity={0.8}
      >
        <Image
          source={
            item.poster_path
              ? { uri: `${IMG.poster_md}${item.poster_path}` }
              : require('../../assets/no-poster.png')
          }
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.year}>{item.release_date?.slice(0, 4)}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={COLORS.accent} />
            <Text style={styles.tmdbScore}>{item.vote_average.toFixed(1)}</Text>
            {item.user_rating && (
              <>
                <Text style={styles.dot}>·</Text>
                <Ionicons name="star" size={12} color={COLORS.green} />
                <Text style={[styles.tmdbScore, { color: COLORS.green }]}>{item.user_rating}/10</Text>
              </>
            )}
          </View>

          {genres.slice(0, 2).length > 0 && (
            <Text style={styles.genres}>{genres.slice(0, 2).join(' · ')}</Text>
          )}

          {item.runtime > 0 && (
            <Text style={styles.runtime}>
              {Math.floor(item.runtime / 60)}h {item.runtime % 60}m
            </Text>
          )}

          {item.watch_date && (
            <Text style={styles.watchDate}>
              Watched {new Date(item.watch_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          )}
        </View>

        <View style={styles.icons}>
          {item.is_favourite ? <Ionicons name="heart" size={16} color={COLORS.red} /> : null}
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  const statusColor = STATUS_COLORS[activeTab];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <Text style={styles.count}>{movies.length} films</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const color  = STATUS_COLORS[tab.id];
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && { borderBottomColor: color, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons name={tab.icon as any} size={14} color={active ? color : COLORS.textMuted} />
              <Text style={[styles.tabLabel, active && { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sort Row */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort:</Text>
        {(['date_added', 'title', 'user_rating'] as const).map((s) => (
          <TouchableOpacity key={s} onPress={() => setSortBy(s)}>
            <Text style={[styles.sortOption, sortBy === s && { color: COLORS.accent, fontWeight: '700' }]}>
              {s === 'date_added' ? 'Date' : s === 'title' ? 'Title' : 'Rating'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={movies}
        keyExtractor={(item) => item.tmdb_id.toString()}
        renderItem={renderMovie}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="film-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>Search for movies and add them to your {activeTab} list</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  count:       { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },

  tabs:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginHorizontal: 16 },
  tab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12 },
  tabLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },

  sortRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  sortLabel:  { fontSize: 12, color: COLORS.textMuted },
  sortOption: { fontSize: 12, color: COLORS.textSec },

  card:     { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12, alignItems: 'center' },
  poster:   { width: 56, height: 84, borderRadius: 6, backgroundColor: COLORS.card },
  info:     { flex: 1 },
  title:    { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  year:     { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tmdbScore: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  dot:      { color: COLORS.textMuted, fontSize: 12 },
  genres:   { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  runtime:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  watchDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' },
  icons:    { gap: 8, alignItems: 'center' },

  sep:       { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  empty:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textSec },
  emptyText:  { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});
