import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Linking, Alert, Dimensions, Modal, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, IMG, WATCH_STATUS, STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import { getFullMovieData, TMDbMovie, TMDbCredits, TMDbVideo } from '../services/tmdb';
import {
  addMovie, getMovie, updateMovieStatus, updateUserRating,
  toggleFavourite, removeMovie, updateNotes, LocalMovie,
} from '../services/database';
import { useStore } from '../store/useStore';

const { width } = Dimensions.get('window');

export default function MovieDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { movieId } = route.params;
  const { refreshLibrary, refreshStats } = useStore();

  const [detail, setDetail]   = useState<TMDbMovie | null>(null);
  const [credits, setCredits] = useState<TMDbCredits | null>(null);
  const [videos, setVideos]   = useState<TMDbVideo[]>([]);
  const [similar, setSimilar] = useState<TMDbMovie[]>([]);
  const [local, setLocal]     = useState<LocalMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesModal, setNotesModal] = useState(false);
  const [notesText, setNotesText]   = useState('');

  const reload = useCallback(() => {
    const l = getMovie(movieId);
    setLocal(l);
  }, [movieId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFullMovieData(movieId);
        setDetail(data.detail);
        setCredits(data.credits);
        setVideos(data.videos.filter((v) => v.site === 'YouTube').slice(0, 3));
        setSimilar(data.similar.slice(0, 10));
        reload();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [movieId]);

  const saveAndRefresh = (status: string) => {
    if (!detail) return;
    const genres = detail.genres?.map((g) => g.name) ?? [];
    addMovie({
      tmdb_id: detail.id,
      title: detail.title,
      poster_path: detail.poster_path,
      backdrop_path: detail.backdrop_path,
      release_date: detail.release_date,
      vote_average: detail.vote_average,
      runtime: detail.runtime ?? 0,
      genres: JSON.stringify(genres),
      overview: detail.overview,
      status: status as any,
      user_rating: null,
      user_notes: null,
      watch_date: status === 'watched' ? new Date().toISOString() : null,
    });
    reload();
    refreshLibrary();
    refreshStats();
  };

  const handleStatusChange = (status: string) => {
    if (!local) {
      saveAndRefresh(status);
    } else {
      updateMovieStatus(movieId, status);
      reload();
      refreshLibrary();
      refreshStats();
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Movie', 'Remove from your library?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        removeMovie(movieId);
        reload();
        refreshLibrary();
        refreshStats();
      }},
    ]);
  };

  const handleRating = (rating: number) => {
    if (!local) saveAndRefresh('watched');
    updateUserRating(movieId, rating);
    reload();
    refreshLibrary();
  };

  const handleFav = () => {
    if (!local) saveAndRefresh('watchlist');
    toggleFavourite(movieId, !local?.is_favourite);
    reload();
    refreshLibrary();
  };

  const saveNotes = () => {
    if (!local) saveAndRefresh('watchlist');
    updateNotes(movieId, notesText);
    reload();
    setNotesModal(false);
  };

  const openTrailer = (key: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${key}`);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }
  if (!detail) return null;

  const director = credits?.crew.find((c) => c.job === 'Director');
  const topCast  = credits?.cast.slice(0, 12) ?? [];
  const trailer  = videos.find((v) => v.type === 'Trailer') ?? videos[0];

  const statusBtns = [
    { status: WATCH_STATUS.WATCHLIST, icon: 'bookmark',         label: 'Watchlist' },
    { status: WATCH_STATUS.WATCHING,  icon: 'play-circle',      label: 'Watching'  },
    { status: WATCH_STATUS.WATCHED,   icon: 'checkmark-circle', label: 'Watched'   },
  ];

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Backdrop */}
      <View style={{ height: 280 }}>
        <Image
          source={{ uri: `${IMG.backdrop}${detail.backdrop_path}` }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(10,10,15,0.2)', COLORS.bg]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 0, y: 1 }}
        />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favBtn} onPress={handleFav}>
          <Ionicons
            name={local?.is_favourite ? 'heart' : 'heart-outline'}
            size={22}
            color={local?.is_favourite ? COLORS.red : COLORS.white}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Poster + Info */}
        <View style={styles.topRow}>
          <Image
            source={
              detail.poster_path
                ? { uri: `${IMG.poster_md}${detail.poster_path}` }
                : require('../../assets/no-poster.png')
            }
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.topInfo}>
            <Text style={styles.title}>{detail.title}</Text>
            {detail.tagline ? <Text style={styles.tagline}>"{detail.tagline}"</Text> : null}
            <View style={styles.metaRow}>
              <Ionicons name="star" size={13} color={COLORS.accent} />
              <Text style={styles.tmdbRating}>{detail.vote_average.toFixed(1)}</Text>
              <Text style={styles.voteCount}>({detail.vote_count.toLocaleString()})</Text>
            </View>
            <View style={styles.pillRow}>
              {detail.release_date && <Pill text={detail.release_date.slice(0, 4)} />}
              {detail.runtime ? <Pill text={`${Math.floor(detail.runtime / 60)}h ${detail.runtime % 60}m`} /> : null}
              {detail.original_language && <Pill text={detail.original_language.toUpperCase()} />}
            </View>
            {detail.genres?.slice(0, 3).map((g) => (
              <Text key={g.id} style={styles.genreTag}>{g.name}</Text>
            ))}
          </View>
        </View>

        {/* Status Buttons */}
        <View style={styles.statusRow}>
          {statusBtns.map((btn) => {
            const active = local?.status === btn.status;
            const color  = STATUS_COLORS[btn.status];
            return (
              <TouchableOpacity
                key={btn.status}
                style={[styles.statusBtn, active && { backgroundColor: color + '25', borderColor: color }]}
                onPress={() => handleStatusChange(btn.status)}
              >
                <Ionicons name={btn.icon as any} size={16} color={active ? color : COLORS.textMuted} />
                <Text style={[styles.statusLabel, active && { color }]}>{btn.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* User Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rating</Text>
          <View style={styles.starsRow}>
            {[1,2,3,4,5,6,7,8,9,10].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                <Ionicons
                  name="star"
                  size={26}
                  color={(local?.user_rating ?? 0) >= star ? COLORS.accent : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {local?.user_rating && (
            <Text style={styles.ratingText}>{local.user_rating}/10</Text>
          )}
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{detail.overview}</Text>
          {director && (
            <Text style={styles.director}>Directed by <Text style={{ color: COLORS.accent }}>{director.name}</Text></Text>
          )}
        </View>

        {/* Trailer */}
        {trailer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trailer</Text>
            <TouchableOpacity
              style={styles.trailerBtn}
              onPress={() => openTrailer(trailer.key)}
            >
              <Image
                source={{ uri: `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg` }}
                style={styles.trailerThumb}
                resizeMode="cover"
              />
              <View style={styles.trailerPlay}>
                <Ionicons name="play-circle" size={56} color={COLORS.white} />
              </View>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.trailerLabel}>{trailer.name}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cast */}
        {topCast.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {topCast.map((actor) => (
                <View key={actor.id} style={styles.castCard}>
                  <Image
                    source={
                      actor.profile_path
                        ? { uri: `${IMG.poster_sm}${actor.profile_path}` }
                        : require('../../assets/no-avatar.png')
                    }
                    style={styles.castPhoto}
                    resizeMode="cover"
                  />
                  <Text style={styles.castName} numberOfLines={1}>{actor.name}</Text>
                  <Text style={styles.castChar} numberOfLines={1}>{actor.character}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Notes</Text>
            <TouchableOpacity onPress={() => { setNotesText(local?.user_notes ?? ''); setNotesModal(true); }}>
              <Ionicons name="create-outline" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
          {local?.user_notes ? (
            <Text style={styles.notes}>{local.user_notes}</Text>
          ) : (
            <Text style={styles.noNotes}>Tap the pen icon to add your notes…</Text>
          )}
        </View>

        {/* Similar */}
        {similar.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>You Might Also Like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {similar.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={{ width: 90 }}
                  onPress={() => navigation.push('MovieDetail', { movieId: m.id })}
                >
                  <Image
                    source={{ uri: `${IMG.poster_md}${m.poster_path}` }}
                    style={{ width: 90, height: 135, borderRadius: 8, backgroundColor: COLORS.card }}
                    resizeMode="cover"
                  />
                  <Text style={{ fontSize: 10, color: COLORS.textSec, marginTop: 4 }} numberOfLines={1}>{m.title}</Text>
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

      {/* Notes Modal */}
      <Modal visible={notesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>My Notes</Text>
            <TextInput
              style={styles.modalInput}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Write your thoughts…"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={1000}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNotesModal(false)}>
                <Text style={{ color: COLORS.textSec }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveNotes}>
                <Text style={{ color: COLORS.bg, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Pill({ text }: { text: string }) {
  return <View style={pil.wrap}><Text style={pil.text}>{text}</Text></View>;
}
const pil = StyleSheet.create({
  wrap: { backgroundColor: COLORS.card, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4, marginTop: 4 },
  text: { fontSize: 11, color: COLORS.textSec },
});

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 48, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  favBtn:  { position: 'absolute', top: 48, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  body:  { paddingHorizontal: 16, marginTop: -20 },
  topRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  poster: { width: 100, height: 150, borderRadius: 10, backgroundColor: COLORS.card },
  topInfo: { flex: 1, paddingTop: 8 },
  title:   { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 22 },
  tagline: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  tmdbRating: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  voteCount:  { fontSize: 11, color: COLORS.textMuted },
  pillRow:  { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  genreTag: { fontSize: 11, color: COLORS.textSec, marginTop: 4 },

  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  statusLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },

  starsRow:   { flexDirection: 'row', gap: 4 },
  ratingText: { color: COLORS.accent, fontWeight: '700', marginTop: 8, fontSize: 14 },

  overview: { fontSize: 14, color: COLORS.textSec, lineHeight: 22 },
  director: { fontSize: 13, color: COLORS.textMuted, marginTop: 10 },

  trailerBtn:   { borderRadius: 12, overflow: 'hidden', height: 180 },
  trailerThumb: { width: '100%', height: '100%' },
  trailerPlay:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  trailerLabel: { position: 'absolute', bottom: 10, left: 12, fontSize: 12, color: COLORS.white, fontWeight: '600' },

  castCard:  { width: 72, alignItems: 'center' },
  castPhoto: { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.card },
  castName:  { fontSize: 10, color: COLORS.textSec, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  castChar:  { fontSize: 9,  color: COLORS.textMuted, textAlign: 'center' },

  notes:   { fontSize: 14, color: COLORS.textSec, lineHeight: 22 },
  noNotes: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  removeBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.red + '40', marginBottom: 16 },
  removeText: { color: COLORS.red, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  modalInput:   { backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, color: COLORS.textPrimary, fontSize: 14, minHeight: 140, textAlignVertical: 'top' },
  modalBtns:    { flexDirection: 'row', gap: 12, marginTop: 14 },
  modalCancel:  { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center' },
  modalSave:    { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center' },
});
