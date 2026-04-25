// ─── TMDb Config ───────────────────────────────────────────────
export const TMDB_API_KEY = '8514773b31bcb2e70b7d4a18f70510a7';
export const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NTE0NzczYjMxYmNiMmU3MGI3ZDRhMThmNzA1MTBhNyIsIm5iZiI6MTc0NzAzMjcyNS4zNzUsInN1YiI6IjY4MjcyNS4zNzUsInN1YiI6IjY4MjcyNS4zNzUsInN1YiI6IjY4MjcyNS4zNzV9';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const IMG = {
  poster_sm: `${TMDB_IMAGE_BASE}/w185`,
  poster_md: `${TMDB_IMAGE_BASE}/w342`,
  poster_lg: `${TMDB_IMAGE_BASE}/w500`,
  backdrop: `${TMDB_IMAGE_BASE}/w1280`,
  original: `${TMDB_IMAGE_BASE}/original`,
};

// ─── Color Palette ─────────────────────────────────────────────
export const COLORS = {
  bg:          '#0A0A0F',
  surface:     '#12121A',
  card:        '#1A1A26',
  border:      '#252535',
  accent:      '#E8A838',      // golden amber
  accentDim:   '#E8A83830',
  accentSoft:  '#E8A83815',
  red:         '#E84B38',
  green:       '#38C976',
  blue:        '#3890E8',
  purple:      '#9B59E8',
  textPrimary: '#F0EDE8',
  textSec:     '#9B9AA8',
  textMuted:   '#52515E',
  white:       '#FFFFFF',
  overlay:     'rgba(10,10,15,0.85)',
};

// ─── Mood Map ──────────────────────────────────────────────────
export const MOODS = [
  { id: 'thrilling',  label: 'Thrilling',  emoji: '⚡', genres: [28, 53, 80],     color: '#E84B38' },
  { id: 'cozy',       label: 'Cozy',       emoji: '☕', genres: [35, 10751, 16],  color: '#E8A838' },
  { id: 'emotional',  label: 'Emotional',  emoji: '🌧', genres: [18, 10749],      color: '#3890E8' },
  { id: 'mindless',   label: 'Mindless',   emoji: '🍿', genres: [28, 12, 878],    color: '#38C976' },
  { id: 'dark',       label: 'Dark',       emoji: '🌑', genres: [27, 9648, 53],   color: '#9B59E8' },
  { id: 'inspired',   label: 'Inspired',   emoji: '✨', genres: [99, 36, 10770],  color: '#E838C9' },
];

// ─── Watch Status ──────────────────────────────────────────────
export const WATCH_STATUS = {
  UNWATCHED:  'unwatched',
  WATCHLIST:  'watchlist',
  WATCHING:   'watching',
  WATCHED:    'watched',
};

export const STATUS_LABELS: Record<string, string> = {
  unwatched: 'Not Added',
  watchlist: 'Watchlist',
  watching:  'Watching',
  watched:   'Watched',
};

export const STATUS_COLORS: Record<string, string> = {
  unwatched: COLORS.textMuted,
  watchlist: COLORS.blue,
  watching:  COLORS.accent,
  watched:   COLORS.green,
};
