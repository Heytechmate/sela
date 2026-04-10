// ─── TMDb Config ───────────────────────────────────────────────
export const TMDB_API_KEY = '8514773b31bcb2e70b7d4a18f70510a7';
export const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NTE0NzczYjMxYmNiMmU3MGI3ZDRhMThmNzA1MTBhNyIsIm5iZiI6MTc0NzAzMjcyNS4zNzUsInN1YiI6IjY4MjcyNS4zNzUsInN1YiI6IjY4MjcyNS4zNzUsInN1YiI6IjY4MjcyNS4zNzV9';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// ─── Anthropic Config ──────────────────────────────────────────
export const ANTHROPIC_API_KEY = ''; // Add your key here
export const CLAUDE_MODEL = 'claude-3-5-sonnet-20240620';

export const IMG = {
  poster_sm: `${TMDB_IMAGE_BASE}/w185`,
  poster_md: `${TMDB_IMAGE_BASE}/w342`,
  poster_lg: `${TMDB_IMAGE_BASE}/w500`,
  backdrop: `${TMDB_IMAGE_BASE}/w1280`,
  original: `${TMDB_IMAGE_BASE}/original`,
};

// ─── Color Palette ─────────────────────────────────────────────
export const COLORS = {
  bg:          '#050508',
  surface:     '#0F0F17',
  card:        '#161622',
  border:      '#232333',
  accent:      '#F59E0B',      // Updated to match the clapperboard icon (Amber/Orange Gold)
  accentDim:   '#F59E0B30',
  accentSoft:  '#F59E0B15',
  red:         '#EF4444',
  green:       '#10B981',
  blue:        '#3B82F6',
  purple:      '#8B5CF6',
  textPrimary: '#FFFFFF',
  textSec:     '#A0A0AB',
  textMuted:   '#60606C',
  white:       '#FFFFFF',
  overlay:     'rgba(5,5,8,0.85)',
};

// ─── Mood Map ──────────────────────────────────────────────────
export const MOODS = [
  { id: 'thrilling',  label: 'Thrilling',  icon: 'fire',          lib: 'MCI', genres: [28, 53, 80],     color: '#EF4444' },
  { id: 'cozy',       label: 'Cozy',       icon: 'coffee',        lib: 'MCI', genres: [35, 10751, 16],  color: '#F59E0B' },
  { id: 'emotional',  label: 'Emotional',  icon: 'drama-masks',   lib: 'MCI', genres: [18, 10749],      color: '#3B82F6' },
  { id: 'mindless',   label: 'Mindless',   icon: 'popcorn',       lib: 'MCI', genres: [28, 12, 878],    color: '#10B981' },
  { id: 'dark',       label: 'Dark',       icon: 'ghost',         lib: 'MCI', genres: [27, 9648, 53],   color: '#8B5CF6' },
  { id: 'inspired',   label: 'Inspired',   icon: 'auto-fix',      lib: 'MCI', genres: [99, 36, 10770],  color: '#E2B616' },
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
