import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Linking, Alert, Dimensions, Modal, TextInput, Share, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, IMG, WATCH_STATUS, STATUS_COLORS } from '../utils/constants';
import {
  getFullMovieData, TMDbMovie, TMDbCredits, TMDbVideo, WatchProvidersResponse,
  getTVSeasonDetail,
} from '../services/tmdb';
import {
  addMovie, getMovie, updateMovieStatus, updateUserRating,
  toggleFavourite, removeMovie, updateNotes, markWatched,
  updateTVProgress, updateDiary, LocalMovie,
} from '../services/database';
import { useStore } from '../store/useStore';

import * as WebBrowser from 'expo-web-browser';

import { SafeImage } from '../components/SafeImage';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MovieDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { movieId, initialData } = route.params;
  const { refreshLibrary, refreshStats } = useStore();

  const [detail, setDetail]   = useState<TMDbMovie | null>(initialData || null);
  const [credits, setCredits] = useState<TMDbCredits | null>(null);
  const [videos, setVideos]   = useState<TMDbVideo[]>([]);
  const [similar, setSimilar] = useState<TMDbMovie[]>([]);
  const [providers, setProviders] = useState<WatchProvidersResponse | null>(null);
  const [local, setLocal]     = useState<LocalMovie | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [notesModal, setNotesModal] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isWatching) {
        handleReturnFromStremio();
      }
    });

    return () => subscription.remove();
  }, [isWatching, local]);

  const handleReturnFromStremio = () => {
    if (local?.status === 'watched') {
      setIsWatching(false);
      return;
    }

    Alert.alert(
      'Welcome Back!',
      `Did you finish watching ${detail?.title || (detail as any).name}?`,
      [
        { text: 'Not yet', onPress: () => setIsWatching(false), style: 'cancel' },
        {
          text: 'Yes, Mark Watched',
          onPress: async () => {
            setIsWatching(false);
            await handleStatusChange(WATCH_STATUS.WATCHED);
            setNotesModal(true); // Open diary immediately to complete the loop
          }
        },
      ]
    );
  };
  const [diaryData, setDiaryData]   = useState({
    feeling: '',
    recommend: 0,
    special: '',
    notes: ''
  });

  const reloadLocal = useCallback(async () => {
    const l = await getMovie(movieId);
    setLocal(l);
  }, [movieId]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        if (!detail) setLoading(true);
        const isTVParam = route.params?.isTV ?? false;
        const [data, localData] = await Promise.all([
          getFullMovieData(movieId, isTVParam ? 'tv' : 'movie'),
          getMovie(movieId)
        ]);

        if (isMounted) {
          setDetail(data.detail);
          setCredits(data.credits);
          setVideos(data.videos.filter((v) => v.site === 'YouTube').slice(0, 3));
          setSimilar(data.similar.slice(0, 10));
          setProviders(data.watchProviders);
          setLocal(localData);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLoading(false);
      }
    };

    // Defer data fetching slightly to avoid animation jank
    const timer = setTimeout(fetchData, 50);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [movieId, route.params?.isTV]);

  const saveToLibrary = async (status: string) => {
    if (!detail) return;
    const genres = detail.genres?.map((g) => g.name) ?? [];
    await addMovie({
      tmdb_id: detail.id,
      title: detail.title || (detail as any).name,
      poster_path: detail.poster_path,
      backdrop_path: detail.backdrop_path,
      release_date: detail.release_date || (detail as any).first_air_date,
      vote_average: detail.vote_average,
      runtime: detail.runtime || (detail as any).episode_run_time?.[0] || 0,
      genres: JSON.stringify(genres),
      overview: detail.overview,
      status: status as any,
      user_rating: null,
      user_notes: null,
      watch_date: status === 'watched' ? new Date().toISOString() : null,
      media_type: (detail as any).first_air_date ? 'tv' : 'movie',
      imdb_id: (detail as any).imdb_id || null,
      total_seasons: (detail as any).number_of_seasons || 0,
      total_episodes: (detail as any).number_of_episodes || 0,
      last_season_watched: 0
    });
    await reloadLocal();
    refreshLibrary();
    refreshStats();
  };

  const handleStatusChange = async (status: string) => {
    if (!local) {
      await saveToLibrary(status);
    } else {
      if (local.status === status) {
        handleRemove();
        return;
      }
      if (status === WATCH_STATUS.WATCHED) {
        await markWatched(movieId);
      } else {
        await updateMovieStatus(movieId, status);
      }
      await reloadLocal();
      refreshLibrary();
      refreshStats();
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Movie', 'Remove from your library?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await removeMovie(movieId);
        await reloadLocal();
        refreshLibrary();
        refreshStats();
      }},
    ]);
  };

  const handleRating = async (rating: number) => {
    if (!local) await saveToLibrary('watched');
    await updateUserRating(movieId, rating);
    await reloadLocal();
    refreshLibrary();
  };

  const handleFav = async () => {
    if (!local) await saveToLibrary('watchlist');
    await toggleFavourite(movieId, !local?.is_favourite);
    await reloadLocal();
    refreshLibrary();
  };

  const handleTVProgress = async (type: 'season' | 'episode', specificEp?: number, specificSeason?: number) => {
    if (!local || !detail) return;

    const totalSeasons = (detail as any).number_of_seasons || 0;
    const totalEpisodes = (detail as any).number_of_episodes || 0;

    if (type === 'season') {
      const seasonToMark = specificSeason ?? (local.last_season_watched || 0) + 1;
      if (seasonToMark <= totalSeasons) {
        let cumulativeBeforeTarget = 0;
        (detail as any).seasons?.forEach((s: any) => {
          if (s.season_number > 0 && s.season_number < seasonToMark) {
            cumulativeBeforeTarget += s.episode_count;
          }
        });

        const airedEpisodesInSeason = seasonEpisodes.filter(ep => !ep.air_date || new Date(ep.air_date) <= new Date()).length;
        const newTotalWatched = cumulativeBeforeTarget + airedEpisodesInSeason;

        const hasFutureEpisodes = seasonEpisodes.some(ep => ep.air_date && new Date(ep.air_date) > new Date());
        const seasonToSave = hasFutureEpisodes ? seasonToMark - 1 : seasonToMark;

        const isFinished = (newTotalWatched >= totalEpisodes && totalEpisodes > 0) || (seasonToMark >= totalSeasons && totalSeasons > 0 && !hasFutureEpisodes);

        setLocal({
          ...local,
          last_season_watched: seasonToSave,
          last_episode_watched: newTotalWatched,
          status: isFinished ? WATCH_STATUS.WATCHED : WATCH_STATUS.WATCHING
        });

        await updateTVProgress(movieId, seasonToSave, newTotalWatched);
        setShowSeasonEpisodes(null);

        if (isFinished) {
          await markWatched(movieId);
        } else if (local.status !== WATCH_STATUS.WATCHING) {
          await updateMovieStatus(movieId, WATCH_STATUS.WATCHING);
        }
      }
    } else {
      const nextEpisode = Math.max(0, specificEp ?? (local.last_episode_watched || 0) + 1);

      let cumulative = 0;
      let completedSeason = 0;
      (detail as any).seasons?.forEach((s: any) => {
        if (s.season_number > 0) {
          if (nextEpisode >= cumulative + s.episode_count) {
            cumulative += s.episode_count;
            completedSeason = s.season_number;
          }
        }
      });

      const isFinished = (nextEpisode >= totalEpisodes && totalEpisodes > 0) || (completedSeason >= totalSeasons && totalSeasons > 0 && nextEpisode >= totalEpisodes);

      setLocal({
        ...local,
        last_season_watched: completedSeason,
        last_episode_watched: nextEpisode,
        status: isFinished ? WATCH_STATUS.WATCHED : WATCH_STATUS.WATCHING
      });

      await updateTVProgress(movieId, completedSeason, nextEpisode);

      if (isFinished) {
        await markWatched(movieId);
      } else if (local.status !== WATCH_STATUS.WATCHING) {
        await updateMovieStatus(movieId, WATCH_STATUS.WATCHING);
      }
    }

    await reloadLocal();
    refreshLibrary();
    refreshStats();
  };

  const saveNotes = async () => {
    if (!local) await saveToLibrary('watched');
    await updateDiary(movieId, {
      feeling: diaryData.feeling,
      recommend: diaryData.recommend,
      special: diaryData.special,
      notes: diaryData.notes
    });
    await reloadLocal();
    setNotesModal(false);
  };

  const handleShare = async () => {
    if (!detail) return;
    try {
      await Share.share({
        message: `Check out ${detail.title} on CineVault! ${detail.overview}`,
        url: `https://www.themoviedb.org/movie/${detail.id}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const openTrailer = (key: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${key}`);
  };

  const openStremio = () => {
    if (!detail) return;
    const type = (detail as any).first_air_date ? 'series' : 'movie';
    const imdbId = (detail as any).imdb_id || local?.imdb_id;

    let url = `stremio://search?search=${encodeURIComponent(detail.title || (detail as any).name)}`;

    if (imdbId) {
      url = `stremio://detail/${type}/${imdbId}`;
    }

    setIsWatching(true);
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Stremio Not Found',
        'Make sure Stremio is installed on your device to use this shortcut.',
        [{ text: 'OK' }]
      );
    });
  };

  const openKissKH = async () => {
    if (!detail) return;
    const title = detail.title || (detail as any).name;
    const url = `https://kisskh.co/Search?type=0&sub=0&query=${encodeURIComponent(title)}`;
    await WebBrowser.openBrowserAsync(url, {
      readerMode: false,
      enableBarCollapsing: true,
      dismissButtonStyle: 'close',
    });
  };

  const openProvider = async (providerName: string) => {
    if (!detail) return;
    const title = detail.title || (detail as any).name;
    let url = '';

    if (providerName.toLowerCase().includes('netflix')) {
      url = `netflix://search?q=${encodeURIComponent(title)}`;
    } else if (providerName.toLowerCase().includes('prime video')) {
      url = `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`;
    } else if (providerName.toLowerCase().includes('hotstar')) {
      url = `hotstar://search?q=${encodeURIComponent(title)}`;
    }

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback for browser if app scheme fails
        if (providerName.toLowerCase().includes('netflix')) {
           WebBrowser.openBrowserAsync(`https://www.netflix.com/search?q=${encodeURIComponent(title)}`);
        } else if (providerName.toLowerCase().includes('hotstar')) {
           WebBrowser.openBrowserAsync(`https://www.hotstar.com/in/search?q=${encodeURIComponent(title)}`);
        }
      });
    }
  };

  if (!detail) {
    return (
      <View style={[styles.loader, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const [showSeasonEpisodes, setShowSeasonEpisodes] = useState<number | null>(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState<any[]>([]);
  const [fetchingSeason, setFetchingSeason] = useState(false);

  const fetchSeasonData = async (seasonNum: number) => {
    if (showSeasonEpisodes === seasonNum) {
      setShowSeasonEpisodes(null);
      return;
    }
    setFetchingSeason(true);
    try {
      const data = await getTVSeasonDetail(movieId, seasonNum);
      setSeasonEpisodes(data.episodes || []);
      setShowSeasonEpisodes(seasonNum);
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingSeason(false);
    }
  };

  const toggleEpisode = async (episodeNum: number, seasonNum: number) => {
    if (!local || !detail) return;

    let cumulativeBefore = 0;
    (detail as any).seasons?.forEach((s: any) => {
      if (s.season_number > 0 && s.season_number < seasonNum) {
        cumulativeBefore += s.episode_count;
      }
    });
    const epCumulative = cumulativeBefore + episodeNum;
    const isWatched = (local.last_episode_watched || 0) >= epCumulative;

    if (isWatched) {
      await handleTVProgress('episode', epCumulative - 1);
    } else {
      await handleTVProgress('episode', epCumulative);
    }
  };

  const director = credits?.crew.find((c) => c.job === 'Director');
  const topCast  = credits?.cast.slice(0, 12) ?? [];
  const trailer  = videos.find((v) => v.type === 'Trailer') ?? videos[0];

  const statusBtns = [
    { status: WATCH_STATUS.WATCHLIST, icon: 'bookmark',         label: 'Watchlist' },
    { status: WATCH_STATUS.WATCHING,  icon: 'play',             label: 'Watching'  },
    { status: WATCH_STATUS.WATCHED,   icon: 'checkmark',        label: 'Watched'   },
  ];

  const inProduction = (detail as any).in_production === true || (detail as any).status === 'Returning Series';
  const isTV = !!(detail as any).first_air_date || (detail as any).number_of_seasons !== undefined;
  const nextAiring = (detail as any).next_episode_to_air;
  const genresLabel = detail.genres?.map(g => g.name).slice(0, 2).join(', ');

  return (
    <View style={styles.root}>
      {/* Immersive Background */}
      <View style={StyleSheet.absoluteFillObject}>
        <SafeImage
          uri={detail.backdrop_path ? `${IMG.backdrop}${detail.backdrop_path}` : null}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['transparent', COLORS.bg]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Header Section */}
        <View style={styles.heroSection}>
          <SafeImage
            uri={detail.backdrop_path ? `${IMG.backdrop}${detail.backdrop_path}` : null}
            style={styles.heroBackdrop}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', COLORS.bg]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.topBtns}>
            <TouchableOpacity style={styles.blurBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.blurBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.blurBtn} onPress={handleFav}>
                <Ionicons
                  name={local?.is_favourite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={local?.is_favourite ? COLORS.red : COLORS.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.mainContentLayout}>
            {/* Left Side: Poster + Buttons */}
            <View style={styles.leftCol}>
              <View style={styles.posterContainer}>
                <SafeImage
                  uri={detail.poster_path ? `${IMG.poster_md}${detail.poster_path}` : null}
                  style={styles.poster}
                  resizeMode="cover"
                  placeholderTitle={detail.title || (detail as any).name}
                />
              </View>

              <View style={styles.actionColumn}>
                <View style={styles.cvStatusRow}>
                  {statusBtns.map((btn) => {
                    const active = local?.status === btn.status;
                    const activeColor = STATUS_COLORS[btn.status];
                    return (
                      <TouchableOpacity
                        key={btn.status}
                        activeOpacity={0.7}
                        style={[
                          styles.cvStatusBtn,
                          active && { backgroundColor: activeColor, borderColor: activeColor }
                        ]}
                        onPress={() => handleStatusChange(btn.status)}
                      >
                        <Ionicons
                          name={(active ? btn.icon : btn.icon + '-outline') as any}
                          size={20}
                          color={active ? COLORS.bg : COLORS.white}
                        />
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity style={styles.cvStatusBtn}>
                     <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={[styles.cvPrimaryBtn, { flex: 1 }]} onPress={openStremio}>
                    <Ionicons name="play" size={18} color={COLORS.bg} />
                    <Text style={styles.cvPrimaryText}>Watch Now</Text>
                  </TouchableOpacity>

                  {detail.original_language === 'ko' && (
                    <TouchableOpacity style={[styles.cvPrimaryBtn, { flex: 0.5, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0 }]} onPress={openKissKH}>
                      <Text style={[styles.cvPrimaryText, { color: COLORS.white }]}>KissKH</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Right Side: Info */}
            <View style={styles.rightCol}>
              <View style={styles.titleRow}>
                <Text style={styles.cvTitle} numberOfLines={2}>{detail.title || (detail as any).name}</Text>
              </View>

              <View style={styles.cvMetaRow}>
                <Text style={styles.cvMetaText}>Created by {director?.name || 'CineVault'}</Text>
              </View>

              <View style={styles.cvMetaRow}>
                <Text style={styles.cvMetaText}>{detail.release_date?.slice(0, 4) || (detail as any).first_air_date?.slice(0, 4)}</Text>
                <Text style={styles.cvDot}>·</Text>
                <Text style={styles.cvMetaText}>
                  {isTV
                    ? `${(detail as any).number_of_seasons || 0} Seasons (${(detail as any).number_of_episodes || 0} Eps)`
                    : `${Math.floor((detail.runtime || 0) / 60)}h ${(detail.runtime || 0) % 60}m`
                  }
                </Text>
                <Text style={styles.cvDot}>·</Text>
                <Text style={[styles.cvMetaText, inProduction && { color: COLORS.accent, fontWeight: '800' }]}>
                  {inProduction ? 'ONGOING' : ((detail as any).status || 'Released')}
                </Text>
                <Text style={styles.cvDot}>·</Text>
                <Text style={styles.cvMetaText}>{genresLabel}</Text>
              </View>

              <View style={styles.cvStatsRow}>
                 <StatBlock
                   icon="star"
                   value={`${((detail.vote_average || 0) * 10).toFixed(0)}%`}
                   label="APPROVAL"
                   color={COLORS.blue}
                 />
                 <StatBlock
                   icon="people"
                   value={((detail.vote_count || 0) / 1000).toFixed(1) + 'k'}
                   label="VOTES"
                   color={COLORS.accent}
                 />
                 <StatBlock
                   icon="trending-up"
                   value={(detail.popularity || 0).toFixed(0)}
                   label="TRENDING"
                   color={COLORS.green}
                 />
                 <StatBlock
                   icon="star-outline"
                   value={(detail.vote_average || 0).toFixed(1)}
                   label="SCORE"
                   color={COLORS.red}
                 />
              </View>

              <Text style={styles.cvOverview} numberOfLines={6}>{detail.overview}</Text>
            </View>
          </View>



          {/* Watch Providers */}
          {providers?.flatrate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available On</Text>
              <View style={styles.providersRow}>
                {providers.flatrate.map((p) => (
                  <TouchableOpacity
                    key={p.provider_id}
                    style={styles.providerBtn}
                    onPress={() => openProvider(p.provider_name)}
                  >
                    <Image
                      source={{ uri: `${IMG.poster_sm}${p.logo_path}` }}
                      style={styles.providerLogo}
                    />
                    <Text style={styles.providerName} numberOfLines={1}>{p.provider_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* TV Progress Widget */}
          {local?.media_type === 'tv' && (
            <View style={styles.tvWidget}>
              <View style={styles.tvHeader}>
                <View>
                  <Text style={styles.tvTitle}>Series Progress</Text>
                  <Text style={styles.tvSub}>
                    {local.last_episode_watched || 0} / {(detail as any).number_of_episodes || 0} Episodes
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Ionicons name="tv" size={24} color={inProduction ? COLORS.accent : COLORS.textMuted} />
                  {inProduction && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>ONGOING</Text>
                    </View>
                  )}
                </View>
              </View>

              {nextAiring && (
                <View style={styles.nextAiringBox}>
                   <Text style={styles.nextAiringLabel}>NEXT EPISODE</Text>
                   <Text style={styles.nextAiringInfo}>
                     S{nextAiring.season_number} E{nextAiring.episode_number} · {new Date(nextAiring.air_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </Text>
                </View>
              )}

              <View style={styles.tvProgressTrack}>
                <View
                  style={[
                    styles.tvProgressFill,
                    { width: `${Math.min(((local.last_episode_watched || 0) / ((detail as any).number_of_episodes || 1)) * 100, 100)}%` }
                  ]}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
                <TouchableOpacity
                  style={[styles.tvUpdateBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}
                  onPress={() => handleTVProgress('episode')}
                  disabled={local.last_episode_watched >= ((detail as any).number_of_episodes || 0)}
                >
                  <Ionicons name="play-skip-forward" size={16} color={local.last_episode_watched >= ((detail as any).number_of_episodes || 0) ? COLORS.textMuted : COLORS.white} />
                  <Text style={[styles.tvUpdateText, { color: local.last_episode_watched >= ((detail as any).number_of_episodes || 0) ? COLORS.textMuted : COLORS.white }]}>Next Episode</Text>
                </TouchableOpacity>
              </View>

              {/* Seasons Accordion */}
              {(detail as any).seasons?.filter((s: any) => s.season_number > 0).map((s: any) => {
                let cumulativeBeforeThisSeason = 0;
                (detail as any).seasons?.forEach((se: any) => {
                  if (se.season_number > 0 && se.season_number < s.season_number) {
                    cumulativeBeforeThisSeason += se.episode_count;
                  }
                });

                return (
                  <View key={s.id} style={{ marginBottom: 10 }}>
                    <TouchableOpacity
                      style={[
                        styles.seasonHeaderRow,
                        showSeasonEpisodes === s.season_number && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                      ]}
                      onPress={() => fetchSeasonData(s.season_number)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={[
                          styles.seasonStatusDot,
                          local.last_season_watched >= s.season_number && { backgroundColor: COLORS.green }
                        ]} />
                        <Text style={styles.seasonHeaderText}>Season {s.season_number}</Text>
                        <Text style={styles.seasonCountText}>{s.episode_count} Episodes</Text>
                      </View>
                      <Ionicons
                        name={showSeasonEpisodes === s.season_number ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>

                    {showSeasonEpisodes === s.season_number && (
                      <View style={styles.episodesList}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                          <Text style={styles.epListTitle}>Episode List</Text>
                          <TouchableOpacity
                            onPress={() => handleTVProgress('season', 0, s.season_number)}
                            style={{ backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                          >
                            <Text style={{ color: COLORS.bg, fontSize: 10, fontWeight: '900' }}>MARK SEASON DONE</Text>
                          </TouchableOpacity>
                        </View>

                        {fetchingSeason ? (
                          <ActivityIndicator size="small" color={COLORS.accent} style={{ padding: 20 }} />
                        ) : (
                          seasonEpisodes.map((ep: any) => {
                            const epCumulative = cumulativeBeforeThisSeason + ep.episode_number;
                            const isEpWatched = (local.last_episode_watched || 0) >= epCumulative;
                            const isAired = !ep.air_date || new Date(ep.air_date) <= new Date();

                            return (
                              <TouchableOpacity
                                key={ep.id}
                                style={[styles.epRow, !isAired && { opacity: 0.4 }]}
                                onPress={() => isAired && toggleEpisode(ep.episode_number, s.season_number)}
                                disabled={!isAired}
                              >
                                <View style={[
                                  styles.epCheck,
                                  isEpWatched && isAired && styles.epCheckActive,
                                  { borderRadius: 12 },
                                  !isAired && { borderColor: 'rgba(255,255,255,0.1)' }
                                ]}>
                                  {isEpWatched && isAired && <Ionicons name="checkmark" size={12} color={COLORS.bg} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[
                                    styles.epText,
                                    isEpWatched && isAired && styles.epTextWatched,
                                    !isAired && { color: COLORS.textMuted }
                                  ]}>
                                    {ep.episode_number}. {ep.name}
                                  </Text>
                                  {!isAired && ep.air_date && (
                                    <Text style={{ fontSize: 10, color: COLORS.accent, fontWeight: '700', marginTop: 2 }}>
                                      AIRING {new Date(ep.air_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {local.last_episode_watched >= ((detail as any).number_of_episodes || 0) && !inProduction && (
                <View style={[styles.tvComplete, { marginTop: 10 }]}>
                  <Ionicons name="checkmark-done-circle" size={20} color={COLORS.green} />
                  <Text style={styles.tvCompleteText}>Series Completed</Text>
                </View>
              )}
            </View>
          )}

          {/* User Rating */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Rating</Text>
              {local?.user_rating && (
                <Text style={styles.ratingText}>{local.user_rating}/10</Text>
              )}
            </View>
            <View style={styles.starsRow}>
              {[1,2,3,4,5,6,7,8,9,10].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRating(star)} style={styles.starTouch}>
                  <Ionicons
                    name={ (local?.user_rating ?? 0) >= star ? 'star' : 'star-outline'}
                    size={28}
                    color={(local?.user_rating ?? 0) >= star ? COLORS.accent : COLORS.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trailer */}
          {trailer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trailer</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.trailerBtn}
                onPress={() => openTrailer(trailer.key)}
              >
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg` }}
                  style={styles.trailerThumb}
                  resizeMode="cover"
                />
                <View style={styles.trailerPlay}>
                  <Ionicons name="play-circle" size={60} color={COLORS.white} />
                </View>
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.trailerLabel} numberOfLines={1}>{trailer.name}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cast */}
          {topCast.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cast</Text>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                   <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: '700' }}>Full Cast</Text>
                   <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {topCast.map((actor) => (
                  <View key={actor.id} style={styles.castCard}>
                    <View style={styles.castPhotoContainer}>
                      <Image
                        source={
                          actor.profile_path
                            ? { uri: `${IMG.poster_sm}${actor.profile_path}` }
                            : require('../../assets/no-avatar.png')
                        }
                        style={styles.castPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <Text style={styles.castName} numberOfLines={1}>{actor.name}</Text>
                    <Text style={styles.castChar} numberOfLines={1}>{actor.character}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Movie Diary Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionTitle}>Movie Diary</Text>
                <Ionicons name="journal" size={18} color={COLORS.accent} />
              </View>
              <TouchableOpacity
                style={styles.addNotesBtn}
                onPress={() => {
                  setDiaryData({
                    feeling: local?.diary_feeling || '',
                    recommend: local?.diary_recommend || 0,
                    special: local?.diary_special || '',
                    notes: local?.user_notes || ''
                  });
                  setNotesModal(true);
                }}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.accent} />
                <Text style={styles.addNotesText}>{local?.user_notes ? 'Edit Entry' : 'Write Entry'}</Text>
              </TouchableOpacity>
            </View>

            {local?.user_notes || local?.diary_feeling || local?.user_rating ? (
              <View style={styles.diaryCard}>
                <View style={styles.diaryHeader}>
                  <View style={styles.diaryHeaderLeft}>
                    <Text style={styles.diaryLabel}>MY ENTRY</Text>
                    {local.user_rating && (
                      <View style={styles.ratingInlineBadge}>
                        <Ionicons name="star" size={10} color={COLORS.accent} />
                        <Text style={styles.ratingInlineText}>{local.user_rating}/10</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.recommendBadge, { backgroundColor: local.diary_recommend ? COLORS.green + '20' : COLORS.red + '20' }]}>
                    <Ionicons
                      name={local.diary_recommend ? "thumbs-up" : "thumbs-down"}
                      size={12}
                      color={local.diary_recommend ? COLORS.green : COLORS.red}
                    />
                    <Text style={[styles.recommendText, { color: local.diary_recommend ? COLORS.green : COLORS.red }]}>
                      {local.diary_recommend ? "Rec" : "Skip"}
                    </Text>
                  </View>
                </View>

                {local.diary_feeling ? (
                  <View style={styles.diarySection}>
                    <Text style={styles.diaryLabel}>HOW I FELT</Text>
                    <Text style={styles.diaryText}>{local.diary_feeling}</Text>
                  </View>
                ) : null}

                {local.diary_special ? (
                  <View style={styles.diarySection}>
                    <Text style={styles.diaryLabel}>WHAT WAS SPECIAL</Text>
                    <Text style={styles.diaryText}>{local.diary_special}</Text>
                  </View>
                ) : null}

                <View style={styles.diarySection}>
                   <Text style={styles.diaryLabel}>THOUGHTS & TALK</Text>
                   <Text style={styles.diaryText}>{local.user_notes || 'No thoughts recorded yet...'}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.diaryPlaceholder}
                onPress={() => {
                  setDiaryData({ feeling: '', recommend: 1, special: '', notes: '' });
                  setNotesModal(true);
                }}
              >
                <Ionicons name="book-outline" size={32} color={COLORS.textMuted} />
                <Text style={styles.noNotes}>Capture your thoughts about this movie...</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Similar */}
          {similar.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>More Like This</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {similar.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={{ width: 100 }}
                    onPress={() => navigation.push('MovieDetail', { movieId: m.id })}
                  >
                    <Image
                      source={{ uri: `${IMG.poster_md}${m.poster_path}` }}
                      style={{ width: 100, height: 150, borderRadius: 12, backgroundColor: COLORS.card }}
                      resizeMode="cover"
                    />
                    <Text style={{ fontSize: 11, color: COLORS.textSec, marginTop: 6, fontWeight: '500' }} numberOfLines={1}>{m.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Remove */}
          {local && (
            <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
              <Ionicons name="trash-outline" size={16} color={COLORS.red} />
              <Text style={styles.removeText}>Remove from Library</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Notes/Diary Modal */}
      <Modal visible={notesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ paddingVertical: 40 }}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Movie Diary Entry</Text>
                <TouchableOpacity onPress={() => setNotesModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textSec} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>How did you feel watching this?</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60 }]}
                value={diaryData.feeling}
                onChangeText={(t) => setDiaryData({...diaryData, feeling: t})}
                placeholder="Emotional, bored, excited?"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: 20 }]}>What was special about it?</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60 }]}
                value={diaryData.special}
                onChangeText={(t) => setDiaryData({...diaryData, special: t})}
                placeholder="The acting, cinematography, the twist?"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: 20 }]}>Talk about the movie...</Text>
              <TextInput
                style={styles.modalInput}
                value={diaryData.notes}
                onChangeText={(t) => setDiaryData({...diaryData, notes: t})}
                placeholder="Write your detailed review here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={2000}
              />

              <View style={styles.recommendRow}>
                <Text style={styles.inputLabel}>Would you recommend it?</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setDiaryData({...diaryData, recommend: 1})}
                    style={[styles.recBtn, diaryData.recommend === 1 && { backgroundColor: COLORS.green, borderColor: COLORS.green }]}
                  >
                    <Ionicons name="thumbs-up" size={18} color={diaryData.recommend === 1 ? COLORS.bg : COLORS.green} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDiaryData({...diaryData, recommend: 0})}
                    style={[styles.recBtn, diaryData.recommend === 0 && { backgroundColor: COLORS.red, borderColor: COLORS.red }]}
                  >
                    <Ionicons name="thumbs-down" size={18} color={diaryData.recommend === 0 ? COLORS.bg : COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveNotes}>
                <Text style={{ color: COLORS.bg, fontWeight: '800', fontSize: 16 }}>Save to Diary</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function Pill({ text }: { text: string }) {
  return <View style={pil.wrap}><Text style={pil.text}>{text}</Text></View>;
}

function StatBlock({ icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <View style={styles.statBlock}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabelSub}>{label}</Text>
      </View>
    </View>
  );
}

const pil = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginTop: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  text: { fontSize: 12, color: COLORS.textSec, fontWeight: '600' },
});

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { },

  heroSection: { height: 450, overflow: 'hidden' },
  heroBackdrop: { ...StyleSheet.absoluteFillObject },

  topBtns: { position: 'absolute', top: 60, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  blurBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  body:  { paddingHorizontal: 32, marginTop: -180 },
  mainContentLayout: { flexDirection: 'row', gap: 40 },
  leftCol: { width: 240 },
  rightCol: { flex: 1, paddingTop: 50 },

  posterContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.7,
    shadowRadius: 35,
    elevation: 30,
    backgroundColor: COLORS.card,
  },
  poster: { width: 240, height: 360 },

  actionColumn: { marginTop: 24, gap: 16 },
  cvStatusRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  cvStatusBtn: { flex: 1, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cvPrimaryBtn: { height: 54, borderRadius: 27, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  cvPrimaryText: { color: COLORS.bg, fontWeight: '900', fontSize: 16 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cvTitle: { fontSize: 52, fontWeight: '900', color: COLORS.white, letterSpacing: -1.5, lineHeight: 60 },
  cvMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  cvMetaText: { fontSize: 17, color: COLORS.textSec, fontWeight: '600' },
  cvDot: { color: COLORS.textMuted, fontSize: 18 },

  cvStatsRow: { flexDirection: 'row', gap: 24, marginTop: 30, marginBottom: 30 },
  statBlock: { gap: 4 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  statLabelSub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginLeft: 2 },

  cvOverview: { fontSize: 17, color: COLORS.textSec, lineHeight: 28, marginBottom: 40, opacity: 0.9 },


  providersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  providerBtn: { alignItems: 'center', width: 70 },
  providerLogo: { width: 50, height: 50, borderRadius: 12, backgroundColor: COLORS.card },
  providerName: { fontSize: 10, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },

  tvWidget: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tvHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  tvTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  tvSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  liveText: { fontSize: 9, fontWeight: '900', color: COLORS.accent, letterSpacing: 0.5 },
  nextAiringBox: { backgroundColor: 'rgba(232, 168, 56, 0.1)', borderRadius: 10, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(232, 168, 56, 0.2)' },
  nextAiringLabel: { fontSize: 9, fontWeight: '900', color: COLORS.accent, marginBottom: 2 },
  nextAiringInfo: { fontSize: 13, color: COLORS.white, fontWeight: '600' },
  tvProgressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 15 },
  seasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  seasonStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 12 },
  seasonHeaderText: { fontSize: 15, fontWeight: '700', color: COLORS.white, flex: 1 },
  seasonCountText: { fontSize: 12, color: COLORS.textMuted, marginRight: 10 },
  episodesList: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  epListTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  epRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  epCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  epCheckActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  epText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  epTextWatched: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  tvProgressFill: { height: '100%', backgroundColor: COLORS.accent },
  tvUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12
  },
  tvUpdateText: { color: COLORS.bg, fontWeight: '800', fontSize: 14 },
  tvComplete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  tvCompleteText: { color: COLORS.green, fontWeight: '800', fontSize: 14 },
  tvRemaining: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 10, fontWeight: '600' },

  section:       { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle:  { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },

  starsRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  starTouch:  { padding: 4 },
  ratingText: { color: COLORS.accent, fontWeight: '800', fontSize: 16 },

  overview: { fontSize: 15, color: COLORS.textSec, lineHeight: 24 },
  director: { fontSize: 14, color: COLORS.textMuted, marginTop: 12 },

  trailerBtn:   { borderRadius: 16, overflow: 'hidden', height: 200, backgroundColor: COLORS.card },
  trailerThumb: { width: '100%', height: '100%' },
  trailerPlay:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  trailerLabel: { position: 'absolute', bottom: 12, left: 16, right: 16, fontSize: 14, color: COLORS.white, fontWeight: '700', zIndex: 2 },

  castCard:  { width: 100, alignItems: 'center' },
  castPhotoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  castPhoto: { width: '100%', height: '100%' },
  castName:  { fontSize: 13, color: COLORS.textPrimary, textAlign: 'center', fontWeight: '800' },
  castChar:  { fontSize: 11,  color: COLORS.textMuted, textAlign: 'center', marginTop: 2, fontWeight: '500' },

  addNotesBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.accentSoft },
  addNotesText: { fontSize: 12, color: COLORS.accent, fontWeight: '700' },

  diaryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 16
  },
  diarySection: { gap: 4 },
  diaryLabel: { fontSize: 10, fontWeight: '800', color: COLORS.accent, letterSpacing: 1 },
  diaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diaryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingInlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.accent + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingInlineText: { fontSize: 11, fontWeight: '800', color: COLORS.accent },
  diaryText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },
  recommendBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  recommendText: { fontSize: 11, fontWeight: '700' },
  diaryPlaceholder: { padding: 40, alignItems: 'center', gap: 12, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border },

  removeBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.red + '30', marginTop: 10 },
  removeText: { color: COLORS.red, fontWeight: '700', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
  modalBox:     { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  inputLabel:   { fontSize: 13, fontWeight: '700', color: COLORS.textSec, marginBottom: 8 },
  modalInput:   { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, color: COLORS.textPrimary, fontSize: 15, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border },
  recommendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  recBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  modalSaveBtn: { backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 30 },
});
