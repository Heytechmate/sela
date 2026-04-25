import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, IMG } from '../utils/constants';
import { getAllMovies } from '../services/database';
import { searchMovies, TMDbMovie } from '../services/tmdb';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

interface Recommendation {
  title: string;
  year: string;
  reason: string;
  mood: string;
  tmdbResult?: TMDbMovie;
}

export default function AIScreen() {
  const navigation = useNavigation<any>();
  const [prompt, setPrompt]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [recommendations, setRecs]      = useState<Recommendation[]>([]);
  const [aiMessage, setAiMessage]       = useState('');
  const [watchedTitles, setWatchedTitles] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    const watched = getAllMovies('watched').map((m) => m.title);
    setWatchedTitles(watched);
  }, []));

  const buildSystemPrompt = () => {
    const libraryContext = watchedTitles.length > 0
      ? `The user has watched these films: ${watchedTitles.slice(0, 30).join(', ')}.`
      : 'The user has not logged any watched films yet.';

    return `You are CineVault AI, a smart movie recommendation engine. ${libraryContext}

Analyze the user's request and recommend exactly 6 movies. Respond ONLY with valid JSON in this exact format:
{
  "message": "A short friendly intro (1-2 sentences)",
  "recommendations": [
    {
      "title": "Exact movie title",
      "year": "Release year as string",
      "reason": "Why this fits the user's request (2 sentences max)",
      "mood": "One word mood tag"
    }
  ]
}

Rules:
- Recommend movies that match the user's request or taste profile
- Avoid recommending films already in their watched list unless they ask for rewatches
- Be specific and personal in your reasons
- Include mix of well-known and hidden gems`;
  };

  const getRecommendations = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setRecs([]);
    setAiMessage('');

    try {
      const response = await fetch(CLAUDE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      setAiMessage(parsed.message);

      // Enrich with TMDb data
      const enriched: Recommendation[] = await Promise.all(
        parsed.recommendations.map(async (rec: Recommendation) => {
          try {
            const results = await searchMovies(`${rec.title} ${rec.year}`);
            const match = results.results[0];
            return { ...rec, tmdbResult: match };
          } catch {
            return rec;
          }
        })
      );

      setRecs(enriched);
    } catch (e) {
      console.error('AI error:', e);
      setAiMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    'Something thrilling for tonight 🎬',
    'Based on my watched list, what next?',
    'Best sci-fi films I might have missed',
    'A great movie to watch with someone special',
    'Something short under 90 minutes',
    'A hidden gem from the 90s',
  ];

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Picks</Text>
        <Text style={styles.headerSub}>Powered by Claude</Text>
      </View>

      {/* Input */}
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="What are you in the mood for?"
          placeholderTextColor={COLORS.textMuted}
          multiline
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!prompt.trim() || loading) && { opacity: 0.5 }]}
          onPress={getRecommendations}
          disabled={!prompt.trim() || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color={COLORS.bg} />
            : <Ionicons name="sparkles" size={20} color={COLORS.bg} />
          }
        </TouchableOpacity>
      </View>

      {/* Quick prompts */}
      {recommendations.length === 0 && !loading && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {QUICK_PROMPTS.map((p) => (
            <TouchableOpacity
              key={p}
              style={styles.quickChip}
              onPress={() => { setPrompt(p); }}
            >
              <Text style={styles.quickText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>Claude is thinking…</Text>
          <Text style={styles.loadingSubText}>Analyzing your taste profile</Text>
        </View>
      )}

      {/* AI Message */}
      {aiMessage ? (
        <View style={styles.aiMessage}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={COLORS.bg} />
          </View>
          <Text style={styles.aiText}>{aiMessage}</Text>
        </View>
      ) : null}

      {/* Recommendations */}
      {recommendations.map((rec, i) => (
        <TouchableOpacity
          key={i}
          style={styles.recCard}
          onPress={() => rec.tmdbResult && navigation.navigate('MovieDetail', { movieId: rec.tmdbResult.id })}
          activeOpacity={rec.tmdbResult ? 0.8 : 1}
        >
          <Image
            source={
              rec.tmdbResult?.poster_path
                ? { uri: `${IMG.poster_md}${rec.tmdbResult.poster_path}` }
                : require('../../assets/no-poster.png')
            }
            style={styles.recPoster}
            resizeMode="cover"
          />
          <View style={styles.recInfo}>
            <View style={styles.recTopRow}>
              <Text style={styles.recTitle} numberOfLines={2}>{rec.title}</Text>
              <View style={styles.recYearBadge}>
                <Text style={styles.recYear}>{rec.year}</Text>
              </View>
            </View>
            <View style={styles.recMoodBadge}>
              <Text style={styles.recMoodText}>{rec.mood}</Text>
            </View>
            <Text style={styles.recReason}>{rec.reason}</Text>
            {rec.tmdbResult && (
              <View style={styles.recMeta}>
                <Ionicons name="star" size={11} color={COLORS.accent} />
                <Text style={styles.recRating}>{rec.tmdbResult.vote_average.toFixed(1)}</Text>
                <Text style={styles.recTap}>Tap to view →</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {recommendations.length > 0 && (
        <TouchableOpacity style={styles.refreshBtn} onPress={getRecommendations}>
          <Ionicons name="refresh" size={16} color={COLORS.accent} />
          <Text style={styles.refreshText}>Get New Recommendations</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  headerSub:   { fontSize: 13, color: COLORS.accent, marginTop: 2, fontWeight: '600' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    padding: 12,
  },
  input:   { flex: 1, color: COLORS.textPrimary, fontSize: 15, maxHeight: 100 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },

  quickRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 20 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  quickText: { fontSize: 12, color: COLORS.textSec },

  loadingBox:    { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText:   { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' },
  loadingSubText:{ fontSize: 13, color: COLORS.textMuted },

  aiMessage: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.accentSoft, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.accentDim,
  },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  aiText:   { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },

  recCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  recPoster: { width: 72, height: 108, borderRadius: 8, backgroundColor: COLORS.card },
  recInfo:   { flex: 1 },
  recTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  recTitle:  { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 19 },
  recYearBadge: { backgroundColor: COLORS.card, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  recYear:   { fontSize: 11, color: COLORS.textMuted },
  recMoodBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.accentDim, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, marginBottom: 6 },
  recMoodText: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
  recReason: { fontSize: 12, color: COLORS.textSec, lineHeight: 19 },
  recMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  recRating: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  recTap:    { marginLeft: 'auto', fontSize: 11, color: COLORS.textMuted },

  refreshBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.accent },
  refreshText: { color: COLORS.accent, fontWeight: '600' },
});
