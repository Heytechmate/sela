import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, Dimensions, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, IMG } from '../utils/constants';
import { getDiaryEntries, LocalMovie } from '../services/database';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

export default function DiaryScreen() {
  const navigation = useNavigation<any>();
  const [entries, setEntries] = useState<LocalMovie[]>([]);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredEntries = entries.filter(e => {
    const matchesFilter = filter === 'all' ? true : e.media_type === filter;
    const matchesSearch = searchQuery.trim() === '' ? true : (
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.user_notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.diary_feeling || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.diary_special || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: entries.length,
    highlyRated: entries.filter(e => (e.user_rating || 0) >= 8).length,
    recommendations: entries.filter(e => e.diary_recommend).length
  };

  const loadDiary = useCallback(async () => {
    const data = await getDiaryEntries();
    setEntries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDiary();
    }, [loadDiary])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiary();
    setRefreshing(false);
  };

  const renderEntry = ({ item }: { item: LocalMovie }) => {
    const dateLabel = item.watch_date
      ? format(new Date(item.watch_date), 'MMMM do, yyyy')
      : format(new Date(item.date_added), 'MMMM do, yyyy');

    return (
      <TouchableOpacity
        style={styles.diaryCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('MovieDetail', { movieId: item.tmdb_id, isTV: item.media_type === 'tv' })}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: `${IMG.poster_sm}${item.poster_path}` }}
            style={styles.miniPoster}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.dateText}>{dateLabel}</Text>
              {item.user_rating && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color={COLORS.accent} />
                    <Text style={styles.ratingText}>{item.user_rating}/10</Text>
                  </View>
                </>
              )}
            </View>
          </View>
          <View style={[styles.recIcon, { backgroundColor: item.diary_recommend ? COLORS.green + '20' : COLORS.red + '20' }]}>
            <Ionicons
              name={item.diary_recommend ? "thumbs-up" : "thumbs-down"}
              size={14}
              color={item.diary_recommend ? COLORS.green : COLORS.red}
            />
          </View>
        </View>

        <View style={styles.cardContent}>
          {item.diary_feeling ? (
            <View style={styles.contentSection}>
              <Text style={styles.label}>FEELING</Text>
              <Text style={styles.text} numberOfLines={2}>{item.diary_feeling}</Text>
            </View>
          ) : null}

          {item.diary_special ? (
            <View style={styles.contentSection}>
              <Text style={styles.label}>HIGHLIGHT</Text>
              <Text style={styles.text} numberOfLines={2}>{item.diary_special}</Text>
            </View>
          ) : null}

          {item.user_notes ? (
            <View style={styles.contentSection}>
              <Text style={styles.label}>THOUGHTS</Text>
              <Text style={styles.text} numberOfLines={3}>{item.user_notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
           <Text style={styles.moreText}>Read Full Entry</Text>
           <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.accent + '15', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cinema Diary</Text>
          <Text style={styles.subtitle}>{entries.length} memories captured</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.highlyRated}</Text>
            <Text style={styles.statLabel}>Gems</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: COLORS.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.recommendations}</Text>
            <Text style={styles.statLabel}>Recs</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search titles, feelings, or notes..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterBar}>
        <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} count={entries.length} />
        <FilterChip label="Movies" active={filter === 'movie'} onPress={() => setFilter('movie')} count={entries.filter(e => e.media_type === 'movie').length} />
        <FilterChip label="TV Series" active={filter === 'tv'} onPress={() => setFilter('tv')} count={entries.filter(e => e.media_type === 'tv').length} />
      </View>

      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.tmdb_id.toString()}
        renderItem={renderEntry}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Your diary is empty</Text>
            <Text style={styles.emptyText}>Go to a movie you've watched and write your first entry to see it here!</Text>
          </View>
        }
      />
    </View>
  );
}

function FilterChip({ label, active, onPress, count }: { label: string; active: boolean; onPress: () => void; count: number }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      <View style={[styles.chipCount, active ? styles.chipCountActive : { backgroundColor: COLORS.border }]}>
        <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
  headerStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  statItem: { alignItems: 'center', paddingHorizontal: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.accent },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 20, marginHorizontal: 4 },

  searchBarWrapper: { paddingHorizontal: 20, marginBottom: 5 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600'
  },

  filterBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginVertical: 15 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  chipTextActive: { color: COLORS.bg },
  chipCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  chipCountActive: { backgroundColor: 'rgba(0,0,0,0.15)' },
  chipCountText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted },
  chipCountTextActive: { color: COLORS.bg },

  list: { padding: 20, paddingBottom: 100, paddingTop: 5 },
  diaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  miniPoster: { width: 40, height: 60, borderRadius: 6, backgroundColor: COLORS.card },
  headerInfo: { flex: 1 },
  movieTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dateText: { fontSize: 12, color: COLORS.textMuted },
  dot: { color: COLORS.textMuted, fontSize: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.accent + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { fontSize: 10, color: COLORS.accent, fontWeight: '800' },
  recIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardContent: { gap: 12 },
  contentSection: { gap: 4 },
  label: { fontSize: 10, fontWeight: '800', color: COLORS.accent, letterSpacing: 1 },
  text: { fontSize: 14, color: COLORS.textSec, lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)'
  },
  moreText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40, gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});