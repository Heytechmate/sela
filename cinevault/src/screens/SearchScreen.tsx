import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, ActivityIndicator, Keyboard, ScrollView, Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, IMG } from '../utils/constants';
import {
  searchMulti, discoverByFilters, getGenres, TMDbMovie,
  getTrending, getNowPlaying, getPopular, getTopRated, getUpcoming,
  getRecommendationsForLibrary, getIndianCinema, getKDramas, getHiddenGems,
  getOnTheAir
} from '../services/tmdb';
import { useStore } from '../store/useStore';

import { SafeImage } from '../components/SafeImage';

const SORT_OPTIONS = [
  { label: 'Popularity',  value: 'popularity.desc' },
  { label: 'Top Rated',   value: 'vote_average.desc' },
  { label: 'Newest',      value: 'release_date.desc' },
  { label: 'Oldest',      value: 'release_date.asc' },
];

const ResultItem = memo(({ item, isTV, activeCategory, navigation }: { item: TMDbMovie, isTV: boolean, activeCategory: string | null, navigation: any }) => (
  <TouchableOpacity
    style={styles.resultRow}
    onPress={() => navigation.navigate('MovieDetail', {
      movieId: item.id,
      isTV: isTV || !!item.first_air_date || (activeCategory?.includes('tv')),
      initialData: item
    })}
    activeOpacity={0.7}
  >
    <View style={styles.thumbContainer}>
      <SafeImage
        uri={item.poster_path ? `${IMG.poster_md}${item.poster_path}` : null}
        style={styles.thumb}
        resizeMode="cover"
        placeholderTitle={item.title || item.name}
      />
      <View style={styles.scoreBadge}>
        <Ionicons name="star" size={8} color={COLORS.accent} />
        <Text style={styles.scoreText}>{(item.vote_average || 0).toFixed(1)}</Text>
      </View>
    </View>
    <View style={styles.resultInfo}>
      <Text style={styles.resultTitle} numberOfLines={1}>{item.title || item.name}</Text>
      <Text style={styles.resultYear}>
        {(item.release_date || item.first_air_date || '').slice(0, 4)}
      </Text>
      <Text style={styles.resultOverview} numberOfLines={2}>{item.overview}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
  </TouchableOpacity>
));

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialCategory = route.params?.category;

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
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory || null);
  const [isTV, setIsTV] = useState<boolean>(route.params?.isTV || false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const debounceRef = useRef<any>(null);
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getGenres().then(setGenres);
    if (initialCategory) {
      loadCategory(initialCategory, 1);
    } else {
      loadDiscover(1);
    }
  }, [initialCategory, isTV]);

  useEffect(() => {
    Animated.timing(filterAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFilters]);

  const loadCategory = async (cat: string, p = 1) => {
    setLoading(true);
    setActiveCategory(cat);
    try {
      let data;
      const type = isTV ? 'tv' : 'movie';

      if (cat === 'trending') data = await getTrending(type, 'week', p);
      else if (cat === 'trending_tv') data = await getTrending('tv', 'week', p);
      else if (cat === 'now_playing') data = await getNowPlaying(p);
      else if (cat === 'popular') data = await getPopular('movie', p);
      else if (cat === 'popular_tv') data = await getPopular('tv', p);
      else if (cat === 'top_rated') data = await getTopRated(type, p);
      else if (cat === 'upcoming') {
        const movies = await getUpcoming(p);
        const tv = await getOnTheAir(p);

        // Combine and sort by date
        const combined = [...movies.results, ...tv.results].sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date || '9999').getTime();
          const dateB = new Date(b.release_date || b.first_air_date || '9999').getTime();
          return dateA - dateB;
        });

        data = { results: combined, total_pages: Math.max(movies.total_pages, tv.total_pages) };
      }
      else if (cat === 'indian') data = await getIndianCinema(p);
      else if (cat === 'kdrama') data = await getKDramas(p);
      else if (cat === 'gems') data = await getHiddenGems(type, p);
      else if (cat === 'recommendations') {
        const { library } = useStore.getState();
        const recs = await getRecommendationsForLibrary(library);
        data = { results: recs, total_pages: 1 };
      }

      if (data) {
        if (p === 1) setResults(data.results);
        else setResults((prev) => [...prev, ...data.results]);
        setHasMore(p < data.total_pages);
        setPage(p);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadDiscover = async (p = 1) => {
    setLoading(true);
    setActiveCategory(null);
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
    if (!q.trim()) {
      if (activeCategory) {
        loadCategory(activeCategory, 1);
      } else {
        loadDiscover(1);
      }
      return;
    }
    setLoading(true);
    setActiveCategory(null);
    try {
      const data = await searchMulti(q, 1);
      // Filter out people and non-essential media types
      const filtered = data.results.filter((m: any) => m.media_type === 'movie' || m.media_type === 'tv');
      setResults(filtered);
      setHasMore(1 < data.total_pages);
      setPage(1);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [activeCategory, isTV]);

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
      onPress={() => navigation.navigate('MovieDetail', {
        movieId: item.id,
        isTV: isTV || !!item.first_air_date || (activeCategory?.includes('tv')),
        initialData: item
      })}
      activeOpacity={0.7}
    >
      <View style={styles.thumbContainer}>
        <Image
          source={
            item.poster_path
              ? { uri: `${IMG.poster_md}${item.poster_path}` }
              : require('../../assets/no-poster.png')
          }
          style={styles.thumb}
          resizeMode="cover"
        />
        <View style={styles.scoreBadge}>
          <Ionicons name="star" size={8} color={COLORS.accent} />
          <Text style={styles.scoreText}>{(item.vote_average || 0).toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title || item.name}</Text>
        <Text style={styles.resultYear}>
          {(item.release_date || item.first_air_date || '').slice(0, 4)}
        </Text>
        <Text style={styles.resultOverview} numberOfLines={2}>{item.overview}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );


  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320],
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
           <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeCategory === 'trending' ? 'Trending' :
           activeCategory === 'trending_tv' ? 'Trending TV' :
           activeCategory === 'now_playing' ? 'Now Playing' :
           activeCategory === 'popular' ? 'Popular' :
           activeCategory === 'popular_tv' ? 'Popular TV' :
           activeCategory === 'top_rated' ? 'Top Rated' :
           activeCategory === 'upcoming' ? 'Upcoming' :
           activeCategory === 'indian' ? 'Indian Cinema' :
           activeCategory === 'kdrama' ? 'K-Wave' :
           activeCategory === 'gems' ? 'Hidden Gems' :
           activeCategory === 'recommendations' ? 'Recommended' : 'Discover'}
        </Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.viewModeBtn}
          onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
        >
          <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search for movies…"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            clearButtonMode="while-editing"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              doSearch(query);
            }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); loadDiscover(1); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterToggle, (showFilters || selGenres.length > 0) && styles.filterToggleActive]}
        >
          <Ionicons name="options-outline" size={22} color={showFilters || selGenres.length > 0 ? COLORS.bg : COLORS.textPrimary} />
          {selGenres.length > 0 && !showFilters && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      <Animated.View style={[styles.filterPanel, { height: filterHeight, opacity: filterAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={styles.filterLabel}>GENRES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {genres.map((g) => {
              const active = selGenres.includes(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => toggleGenre(g.id)}
                >
                  <Text style={[styles.genreChipText, active && { color: COLORS.bg, fontWeight: '700' }]}>{g.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>SORT BY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => setSortBy(opt.value)}
                >
                  <Text style={[styles.genreChipText, active && { color: COLORS.bg, fontWeight: '700' }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>MINIMUM RATING</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {[null, 5, 6, 7, 7.5, 8, 8.5, 9].map((r) => {
              const active = minRating === (r ?? undefined);
              return (
                <TouchableOpacity
                  key={String(r)}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => setMinRating(r ?? undefined)}
                >
                  <Text style={[styles.genreChipText, active && { color: COLORS.bg, fontWeight: '700' }]}>
                    {r === null ? 'Any' : `${r}+`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
            <Text style={styles.applyText}>Apply Discovery Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      <FlashList
        key={viewMode}
        data={results}
        numColumns={viewMode === 'grid' ? 6 : 1}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          viewMode === 'grid' ? (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => navigation.navigate('MovieDetail', {
                movieId: item.id,
                isTV: isTV || !!item.first_air_date || (activeCategory?.includes('tv')),
                initialData: item
              })}
              activeOpacity={0.7}
            >
              <SafeImage
                uri={item.poster_path ? `${IMG.poster_md}${item.poster_path}` : null}
                style={styles.gridPoster}
                placeholderTitle={item.title || item.name}
              />
              <View style={styles.gridBadge}>
                <Ionicons name="star" size={6} color={COLORS.accent} />
                <Text style={styles.gridRating}>{(item.vote_average || 0).toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <ResultItem
              item={item}
              isTV={isTV}
              activeCategory={activeCategory}
              navigation={navigation}
            />
          )
        )}
        estimatedItemSize={viewMode === 'grid' ? 100 : 136}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: 10,
          paddingHorizontal: viewMode === 'grid' ? 8 : 0
        }}
        onEndReached={() => {
          if (loading || !hasMore) return;
          if (query) {
             // Handle pagination for multi-search if needed
             return;
          }
          if (activeCategory) loadCategory(activeCategory, page + 1);
          else loadDiscover(page + 1);
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.accent} style={{ margin: 20 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No movies found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  viewModeBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  input:     { flex: 1, color: COLORS.textPrimary, fontSize: 16, fontWeight: '500' },
  filterToggle: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  filterToggleActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  badge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.bg, borderWidth: 2, borderColor: COLORS.accent },

  filterPanel: { backgroundColor: COLORS.surface, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', paddingHorizontal: 16 },
  filterLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800', marginBottom: 12, marginTop: 16, letterSpacing: 1 },
  chipRow:    { gap: 10, paddingBottom: 4 },
  genreChip:  { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  genreChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  genreChipText:   { fontSize: 13, color: COLORS.textSec, fontWeight: '600' },

  applyBtn:  { marginTop: 24, backgroundColor: COLORS.accentSoft, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.accentDim },
  applyText: { color: COLORS.accent, fontWeight: '800', fontSize: 15 },

  resultRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  thumbContainer: { width: 75, height: 112, borderRadius: 14, overflow: 'hidden', backgroundColor: COLORS.card },
  thumb:         { width: '100%', height: '100%' },
  scoreBadge:    { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  scoreText:     { color: COLORS.accent, fontSize: 9, fontWeight: '900' },
  resultInfo:    { flex: 1, gap: 2 },
  resultTitle:   { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  resultYear:    { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
  resultOverview: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },

  gridItem: { flex: 1, aspectRatio: 2/3, margin: 2, borderRadius: 6, overflow: 'hidden', backgroundColor: COLORS.surface },
  gridPoster: { width: '100%', height: '100%' },
  gridBadge: { position: 'absolute', top: 4, right: 4, flexDirection: 'row', alignItems: 'center', gap: 1, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4 },
  gridRating: { color: COLORS.accent, fontSize: 8, fontWeight: '900' },

  empty:     { alignItems: 'center', paddingTop: 100, gap: 16 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptyText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center' },
});
