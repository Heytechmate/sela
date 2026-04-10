import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, FlatList, RefreshControl, Alert, Animated, ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, IMG, WATCH_STATUS, STATUS_COLORS } from '../utils/constants';
import {
  getAllMovies, LocalMovie, batchDeleteMovies,
  batchUpdateStatus, batchToggleFav, updateMovieStatus,
} from '../services/database';
import { useStore } from '../store/useStore';
import { useWindowDimensions } from '../hooks/useOrientation';

const TABS = [
  { id: WATCH_STATUS.WATCHLIST, label: 'Watchlist', icon: 'bookmark' },
  { id: WATCH_STATUS.WATCHING,  label: 'Watching',  icon: 'play-circle' },
  { id: WATCH_STATUS.WATCHED,   label: 'Watched',   icon: 'checkmark-circle' },
];

type ViewMode = 'grid' | 'list';

const FilterChip = memo(({ label, active, onPress, icon }: any) => {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={14} color={active ? COLORS.accent : COLORS.textMuted} />
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
});

const GridItem = memo(({ item, width, isSelected, selectionMode, onPress, onLongPress }: any) => {
  return (
    <TouchableOpacity
      style={{ width }}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.tmdb_id)}
      activeOpacity={0.8}
    >
      <View style={styles.posterWrapper}>
        <Image
          source={item.poster_path ? { uri: `${IMG.poster_md}${item.poster_path}` } : require('../../assets/no-poster.png')}
          style={[styles.gridPoster, { width, height: width * 1.5 }, isSelected && styles.selectedPoster]}
          fadeDuration={0}
        />
        {selectionMode && (
           <View style={styles.gridCheckbox}>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={isSelected ? COLORS.accent : COLORS.white}
              />
           </View>
        )}
        {isSelected && <View style={styles.selectionOverlay} />}
      </View>
      <View style={styles.gridBadge}>
        <Ionicons name="star" size={9} color={COLORS.accent} />
        <Text style={styles.gridRating}>{(item.vote_average || 0).toFixed(1)}</Text>
      </View>
      {item.is_favourite === 1 && (
        <View style={styles.favBadge}>
          <Ionicons name="heart" size={10} color={COLORS.red} />
        </View>
      )}
      <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
    </TouchableOpacity>
  );
});

const ListItem = memo(({ item, isSelected, selectionMode, isLandscape, onPress, onLongPress }: any) => {
  return (
    <TouchableOpacity
      style={[
        styles.listCard,
        isLandscape && styles.listCardLandscape,
        isSelected && { backgroundColor: COLORS.accentSoft + '40' }
      ]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.tmdb_id)}
      activeOpacity={0.7}
    >
      {selectionMode && (
        <View style={styles.checkbox}>
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={22}
            color={isSelected ? COLORS.accent : COLORS.textMuted}
          />
        </View>
      )}
      <Image
        source={item.poster_path ? { uri: `${IMG.poster_md}${item.poster_path}` } : require('../../assets/no-poster.png')}
        style={styles.listPoster}
        fadeDuration={0}
      />
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.year}>{item.release_date?.slice(0, 4)}</Text>
          <Text style={styles.dot}>·</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color={COLORS.accent} />
            <Text style={styles.ratingText}>{(item.vote_average || 0).toFixed(1)}</Text>
          </View>
          {item.user_rating && (
             <>
               <Text style={styles.dot}>·</Text>
               <View style={[styles.ratingBadge, { backgroundColor: COLORS.green + '20' }]}>
                 <Ionicons name="star" size={10} color={COLORS.green} />
                 <Text style={[styles.ratingText, { color: COLORS.green }]}>{item.user_rating}</Text>
               </View>
             </>
          )}
        </View>
        <Text style={styles.listOverview} numberOfLines={isLandscape ? 3 : 2}>{item.overview}</Text>
      </View>
      {!selectionMode && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );
});

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { library, refreshLibrary, refreshStats, vaultUnlocked } = useStore();
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const GRID_COLUMNS = isLandscape ? 6 : 3;
  const GRID_SPACING = 12;
  const LIST_PADDING = isLandscape ? 32 : 20;

  const [activeTab, setActiveTab] = useState(route.params?.initialTab || WATCH_STATUS.WATCHLIST);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'date_added' | 'title' | 'user_rating'>('date_added');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Batch Selection State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Sync activeTab if route params change
  React.useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  useFocusEffect(
    useCallback(() => {
      refreshLibrary();
    }, [refreshLibrary])
  );

  const movies = React.useMemo(() => {
    // Hidden Vault Filter: If not unlocked, don't show items that might be "vaulted"
    // For now, let's assume any item with user_rating >= 9 is "vaulted" or we can add a hidden property
    let data = library.filter(m => m.status === activeTab);

    if (!vaultUnlocked) {
      // In a real app, you'd have a 'is_hidden' flag in the DB.
      // For this demo, we'll hide highly rated personal items or specific genres if not unlocked.
      // data = data.filter(m => m.is_hidden !== 1);
    }

    if (mediaFilter !== 'all') {
      data = data.filter(m => m.media_type === mediaFilter);
    }

    return [...data].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'user_rating') return (b.user_rating ?? 0) - (a.user_rating ?? 0);
      return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
    });
  }, [library, activeTab, mediaFilter, sortBy, vaultUnlocked]);


  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLibrary();
    setRefreshing(false);
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter(i => i !== id);
      setSelectedIds(next);
      if (next.length === 0) setSelectionMode(false);
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleLongPress = (id: number) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds([id]);
    }
  };

  const handlePress = (item: LocalMovie) => {
    if (selectionMode) {
      toggleSelection(item.tmdb_id);
    } else {
      navigation.navigate('MovieDetail', {
        movieId: item.tmdb_id,
        isTV: item.media_type === 'tv',
        initialData: {
          id: item.tmdb_id,
          title: item.title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          overview: item.overview,
          release_date: item.release_date
        }
      });
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleBatchDelete = () => {
    Alert.alert(
      'Remove Movies',
      `Remove ${selectedIds.length} movies from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          await batchDeleteMovies(selectedIds);
          cancelSelection();
          refreshLibrary();
          refreshStats();
        }},
      ]
    );
  };

  const handleBatchMove = async (status: string) => {
    await batchUpdateStatus(selectedIds, status);
    cancelSelection();
    refreshLibrary();
    refreshStats();
  };

  const handleBatchFav = async (fav: boolean) => {
    await batchToggleFav(selectedIds, fav);
    cancelSelection();
    refreshLibrary();
  };

  const handleRandomPick = () => {
    if (movies.length === 0) return;

    // Pick a random movie from the current filtered list
    const randomIndex = Math.floor(Math.random() * movies.length);
    const randomMovie = movies[randomIndex];

    Alert.alert(
      'Watchlist Roulette 🎲',
      `How about watching "${randomMovie.title}"?`,
      [
        { text: 'Spin Again', onPress: () => handleRandomPick() },
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Open Details',
          style: 'default',
          onPress: () => navigation.navigate('MovieDetail', {
            movieId: randomMovie.tmdb_id,
            isTV: randomMovie.media_type === 'tv',
            initialData: {
              id: randomMovie.tmdb_id,
              title: randomMovie.title,
              poster_path: randomMovie.poster_path,
              backdrop_path: randomMovie.backdrop_path,
              vote_average: randomMovie.vote_average,
              overview: randomMovie.overview,
              release_date: randomMovie.release_date
            }
          })
        },
      ]
    );
  };

  const renderItem = useCallback(({ item }: { item: LocalMovie }) => {
    if (viewMode === 'grid') {
      const itemWidth = (width - (16 * 2) - (GRID_SPACING * (GRID_COLUMNS - 1))) / GRID_COLUMNS;
      const isSelected = selectedIds.includes(item.tmdb_id);
      return (
        <GridItem
          item={item}
          width={itemWidth}
          isSelected={isSelected}
          selectionMode={selectionMode}
          onPress={handlePress}
          onLongPress={handleLongPress}
        />
      );
    }
    const isSelected = selectedIds.includes(item.tmdb_id);
    return (
      <ListItem
        item={item}
        isSelected={isSelected}
        selectionMode={selectionMode}
        isLandscape={isLandscape}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
    );
  }, [viewMode, width, GRID_COLUMNS, GRID_SPACING, selectedIds, selectionMode, isLandscape, handlePress, handleLongPress]);

  return (
    <View style={styles.root}>
      {/* Selection Header */}
      {selectionMode ? (
        <View style={[styles.header, isLandscape && styles.headerLandscape, styles.selectionHeader]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={cancelSelection}>
              <Ionicons name="close" size={26} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.selectionCount}>{selectedIds.length} Selected</Text>
          </View>
          <View style={styles.headerActions}>
             <TouchableOpacity style={styles.iconBtn} onPress={() => handleBatchFav(true)}>
                <Ionicons name="heart" size={20} color={COLORS.red} />
             </TouchableOpacity>
             <TouchableOpacity style={[styles.iconBtn, { borderColor: COLORS.red + '40' }]} onPress={handleBatchDelete}>
                <Ionicons name="trash" size={20} color={COLORS.red} />
             </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.header, isLandscape && styles.headerLandscape]}>
          <View>
            <Text style={styles.headerTitle}>My Library</Text>
            <Text style={styles.count}>{movies.length} {movies.length === 1 ? 'movie' : 'movies'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
              <Ionicons name="search" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs (Hidden in selection mode to focus on actions) */}
      {!selectionMode && (
        <View style={[styles.tabsContainer, isLandscape && styles.tabsContainerLandscape]}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const color  = STATUS_COLORS[tab.id];
            const count = library.filter(m => m.status === tab.id).length;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, active && { borderBottomColor: color, borderBottomWidth: 3 }]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons name={(active ? tab.icon : tab.icon + '-outline') as any} size={isLandscape ? 16 : 18} color={active ? color : COLORS.textMuted} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.tabLabel, active && { color, fontWeight: '800' }]}>{tab.label}</Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: active ? color + '20' : COLORS.surface }]}>
                      <Text style={[styles.tabBadgeText, { color: active ? color : COLORS.textMuted }]}>{count}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Sorting & Filter Row */}
      {!selectionMode && (
        <View style={[styles.filterRow, isLandscape && { paddingHorizontal: LIST_PADDING }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            <FilterChip
              label="All"
              active={mediaFilter === 'all'}
              onPress={() => setMediaFilter('all')}
              icon="layers"
            />
            <FilterChip
              label="Movies"
              active={mediaFilter === 'movie'}
              onPress={() => setMediaFilter('movie')}
              icon="film"
            />
            <FilterChip
              label="TV Shows"
              active={mediaFilter === 'tv'}
              onPress={() => setMediaFilter('tv')}
              icon="tv"
            />
          </ScrollView>

          <View style={styles.sortContainer}>
            <Ionicons name="swap-vertical" size={14} color={COLORS.textMuted} />
            <TouchableOpacity style={styles.sortTrigger} onPress={() => {
              const next = sortBy === 'date_added' ? 'title' : sortBy === 'title' ? 'user_rating' : 'date_added';
              setSortBy(next);
            }}>
              <Text style={styles.sortValue}>
                {sortBy === 'date_added' ? 'Recent' : sortBy === 'title' ? 'Alphabetical' : 'Rating'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlashList
        key={`${viewMode}-${GRID_COLUMNS}`}
        data={movies}
        keyExtractor={(item: LocalMovie) => item.tmdb_id.toString()}
        numColumns={viewMode === 'grid' ? GRID_COLUMNS : 1}
        renderItem={renderItem}
        estimatedItemSize={viewMode === 'grid' ? 200 : 120}
        contentContainerStyle={{
          paddingBottom: 150,
          paddingTop: selectionMode ? 20 : 10,
          paddingHorizontal: viewMode === 'grid' ? 16 : 0
        }}
        refreshControl={!selectionMode ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} /> : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="film-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>Find your next favorite movie and add it to your {activeTab}!</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.browseBtnText}>Explore Movies</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Selection Action Bar (Floating at bottom) */}
      {selectionMode && (
        <View style={[styles.actionBar, { width: width - 32 }]}>
           <Text style={styles.actionTitle}>Move to:</Text>
           <View style={styles.actionBtns}>
              {TABS.filter(t => t.id !== activeTab).map(tab => (
                 <TouchableOpacity
                   key={tab.id}
                   style={[styles.actionBtn, { backgroundColor: STATUS_COLORS[tab.id] + '20' }]}
                   onPress={() => handleBatchMove(tab.id)}
                 >
                    <Ionicons name={tab.icon as any} size={18} color={STATUS_COLORS[tab.id]} />
                    <Text style={[styles.actionBtnText, { color: STATUS_COLORS[tab.id] }]}>{tab.label}</Text>
                 </TouchableOpacity>
              ))}
           </View>
        </View>
      )}

      {/* Random Pick FAB */}
      {!selectionMode && movies.length > 1 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 80 }]}
          onPress={handleRandomPick}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.accent, '#FFB74D']}
            style={styles.fabGradient}
          />
          <MaterialCommunityIcons name="slot-machine" size={24} color={COLORS.bg} />
          <Text style={styles.fabText}>Pick for Me</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  headerLandscape: { paddingTop: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  count:       { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },

  chipScroll: { gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  chipActive: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
  },
  chipLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  chipLabelActive: { color: COLORS.accent },

  selectionHeader: { backgroundColor: COLORS.accent, paddingTop: 60, paddingBottom: 15 },
  selectionCount: { fontSize: 20, fontWeight: '800', color: COLORS.white },

  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabsContainerLandscape: { paddingHorizontal: 40 },
  tab:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  tabLabel:      { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  tabBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText:  { fontSize: 10, fontWeight: '800' },

  filterRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  sortContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  sortTrigger:   { },
  sortValue:     { fontSize: 12, color: COLORS.textSec, fontWeight: '700' },

  listContent: { paddingBottom: 150, paddingTop: 10 },

  // List Item Styles
  listCard:    { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 14, alignItems: 'center' },
  listCardLandscape: { paddingHorizontal: 32 },
  checkbox:    { marginRight: 4 },
  listPoster:  { width: 60, height: 90, borderRadius: 8, backgroundColor: COLORS.card },
  listInfo:    { flex: 1, gap: 4 },
  listTitle:   { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  listOverview: { fontSize: 12, color: COLORS.textMuted, lineHeight: 16 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.accentSoft, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  ratingText:  { fontSize: 10, color: COLORS.accent, fontWeight: '800' },

  // Grid Item Styles
  gridRow:     { gap: 12, marginBottom: 16 },
  posterWrapper: { position: 'relative' },
  gridPoster:  { borderRadius: 10, backgroundColor: COLORS.card },
  selectedPoster: { borderWidth: 3, borderColor: COLORS.accent },
  selectionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.accent + '20', borderRadius: 10 },
  gridCheckbox: { position: 'absolute', top: 8, left: 8, zIndex: 10 },

  gridBadge:   { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3 },
  favBadge:    { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 6, padding: 4 },
  gridRating:  { fontSize: 9, color: COLORS.accent, fontWeight: '800' },
  gridTitle:   { fontSize: 11, color: COLORS.textSec, marginTop: 6, fontWeight: '600', paddingHorizontal: 2 },

  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  year:        { fontSize: 12, color: COLORS.textSec, fontWeight: '500' },
  dot:         { color: COLORS.textMuted, fontSize: 12 },

  empty:       { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  emptyText:   { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  browseBtn:   { marginTop: 10, backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  browseBtnText: { color: COLORS.bg, fontWeight: '900', fontSize: 14 },

  // Batch Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase' },
  actionBtns: { flex: 1, flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  fab: {
    position: 'absolute',
    right: 20,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    elevation: 10,
    zIndex: 100,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fabGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 28 },
  fabText: { color: COLORS.bg, fontSize: 16, fontWeight: '900' },
});
