import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Keyboard, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, IMG } from '../utils/constants';
import { searchMovies, discoverByFilters, getGenres, TMDbMovie } from '../services/tmdb';

const SORT_OPTIONS = [
  { label: 'Popularity',  value: 'popularity.desc' },
  { label: 'Top Rated',   value: 'vote_average.desc' },
  { label: 'Newest',      value: 'release_date.desc' },
  { label: 'Oldest',      value: 'release_date.asc' },
];

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<TMDbMovie[]>([]);
  const [genres, setGenres]       = useState<{ id: number; name: string }[]>([]);
  const [selGenres, setSelGenres] = useState<number[]>([]);
  const [sortBy, setSortBy]       = useState('popularity.desc');
  const [minRating, setMinRating] = useState<number | undefined>();
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    getGenres().then(setGenres);
    loadDiscover(1);
  }, []);

  const loadDiscover = async (p = 1) => {
    setLoading(true);
    try {
      const data = await discoverByFilters({
        genres: selGenres,
        sortBy,
        minRating,
        page: p,
      });
      if (p === 1) setResults(data.results);
      else setResults((prev) => [...prev, ...data.results]);
      setHasMore(p < data.total_pages);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { loadDiscover(1); return; }
    setLoading(true);
    try {
      const data = await searchMovies(q, 1);
      setResults(data.results);
      setHasMore(false);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const onQueryChange = (text: string) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 500);
  };

  const applyFilters = () => {
    setQuery('');
    setShowFilters(false);
    loadDiscover(1);
  };

  const toggleGenre = (id: number) => {
    setSelGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const renderItem = ({ item }: { item: TMDbMovie }) => (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
      activeOpacity={0.75}
    >
      <Image
        source={
          item.poster_path
            ? { uri: `${IMG.poster_sm}${item.poster_path}` }
            : require('../../assets/no-poster.png')
        }
        style={styles.thumb}
        resizeMode="cover"
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.resultMeta}>
          <Ionicons name="star" size={11} color={COLORS.accent} />
          <Text style={styles.resultRating}>{item.vote_average.toFixed(1)}</Text>
          {item.release_date && (
            <Text style={styles.resultYear}> · {item.release_date.slice(0, 4)}</Text>
          )}
        </View>
        <Text style={styles.resultOverview} numberOfLines={2}>{item.overview}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search movies…"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => doSearch(query)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); loadDiscover(1); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
          <Ionicons name="options" size={18} color={showFilters ? COLORS.accent : COLORS.textSec} />
          {selGenres.length > 0 && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Genres</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
            {genres.map((g) => {
              const active = selGenres.includes(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => toggleGenre(g.id)}
                >
                  <Text style={[styles.genreChipText, active && { color: COLORS.bg }]}>{g.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>Sort By</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => setSortBy(opt.value)}
                >
                  <Text style={[styles.genreChipText, active && { color: COLORS.bg }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>Min Rating</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
            {[null, 5, 6, 7, 7.5, 8, 8.5, 9].map((r) => {
              const active = minRating === (r ?? undefined);
              return (
                <TouchableOpacity
                  key={String(r)}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => setMinRating(r ?? undefined)}
                >
                  <Text style={[styles.genreChipText, active && { color: COLORS.bg }]}>
                    {r === null ? 'Any' : `${r}+`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        onEndReached={() => {
          if (!query && hasMore && !loading) loadDiscover(page + 1);
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.accent} style={{ margin: 20 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="film-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No movies found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  input:     { flex: 1, color: COLORS.textPrimary, fontSize: 15 },
  filterBtn: { position: 'relative', padding: 2 },
  filterDot: { position: 'absolute', top: 0, right: 0, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },

  filterPanel: { backgroundColor: COLORS.surface, borderRadius: 12, marginHorizontal: 16, padding: 14, marginBottom: 12 },
  filterLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 8, marginTop: 10, letterSpacing: 0.5 },
  genreRow:   { gap: 8, paddingBottom: 4 },
  genreChip:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  genreChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  genreChipText:   { fontSize: 12, color: COLORS.textSec },

  applyBtn:  { marginTop: 14, backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  applyText: { color: COLORS.bg, fontWeight: '700', fontSize: 14 },

  resultRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  thumb:         { width: 52, height: 78, borderRadius: 6, backgroundColor: COLORS.card },
  resultInfo:    { flex: 1 },
  resultTitle:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  resultMeta:    { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  resultRating:  { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  resultYear:    { fontSize: 12, color: COLORS.textMuted },
  resultOverview: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, lineHeight: 17 },

  sep:       { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  empty:     { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
});
