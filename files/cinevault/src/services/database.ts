import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export const getDB = () => {
  if (!db) db = SQLite.openDatabaseSync('cinevault.db');
  return db;
};

export interface LocalMovie {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  runtime: number;
  genres: string;           // JSON string
  overview: string;
  status: 'watchlist' | 'watching' | 'watched';
  user_rating: number | null;
  user_notes: string | null;
  watch_date: string | null;
  date_added: string;
  rewatch_count: number;
  is_favourite: number;     // 0 or 1
}

// ── Init ─────────────────────────────────────────────────────
export const initDB = () => {
  const db = getDB();
  db.execSync(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      release_date TEXT,
      vote_average REAL DEFAULT 0,
      runtime INTEGER DEFAULT 0,
      genres TEXT DEFAULT '[]',
      overview TEXT,
      status TEXT DEFAULT 'watchlist',
      user_rating REAL,
      user_notes TEXT,
      watch_date TEXT,
      date_added TEXT DEFAULT (datetime('now')),
      rewatch_count INTEGER DEFAULT 0,
      is_favourite INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#E8A838',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collection_movies (
      collection_id INTEGER,
      tmdb_id INTEGER,
      PRIMARY KEY (collection_id, tmdb_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );
  `);
};

// ── CRUD ──────────────────────────────────────────────────────
export const addMovie = (movie: Omit<LocalMovie, 'date_added' | 'rewatch_count' | 'is_favourite'>) => {
  const db = getDB();
  db.runSync(
    `INSERT OR REPLACE INTO movies
      (tmdb_id, title, poster_path, backdrop_path, release_date, vote_average, runtime, genres, overview, status, user_rating, user_notes, watch_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movie.tmdb_id, movie.title, movie.poster_path, movie.backdrop_path,
      movie.release_date, movie.vote_average, movie.runtime,
      movie.genres, movie.overview, movie.status,
      movie.user_rating, movie.user_notes, movie.watch_date,
    ]
  );
};

export const getMovie = (tmdbId: number): LocalMovie | null => {
  const db = getDB();
  return db.getFirstSync<LocalMovie>('SELECT * FROM movies WHERE tmdb_id = ?', [tmdbId]);
};

export const getAllMovies = (status?: string): LocalMovie[] => {
  const db = getDB();
  if (status) {
    return db.getAllSync<LocalMovie>('SELECT * FROM movies WHERE status = ? ORDER BY date_added DESC', [status]);
  }
  return db.getAllSync<LocalMovie>('SELECT * FROM movies ORDER BY date_added DESC');
};

export const updateMovieStatus = (tmdbId: number, status: string) => {
  const db = getDB();
  db.runSync('UPDATE movies SET status = ? WHERE tmdb_id = ?', [status, tmdbId]);
};

export const updateUserRating = (tmdbId: number, rating: number | null) => {
  const db = getDB();
  db.runSync('UPDATE movies SET user_rating = ? WHERE tmdb_id = ?', [rating, tmdbId]);
};

export const updateNotes = (tmdbId: number, notes: string) => {
  const db = getDB();
  db.runSync('UPDATE movies SET user_notes = ? WHERE tmdb_id = ?', [notes, tmdbId]);
};

export const toggleFavourite = (tmdbId: number, val: boolean) => {
  const db = getDB();
  db.runSync('UPDATE movies SET is_favourite = ? WHERE tmdb_id = ?', [val ? 1 : 0, tmdbId]);
};

export const markWatched = (tmdbId: number, date?: string) => {
  const db = getDB();
  db.runSync(
    'UPDATE movies SET status = ?, watch_date = ? WHERE tmdb_id = ?',
    ['watched', date || new Date().toISOString(), tmdbId]
  );
};

export const incrementRewatch = (tmdbId: number) => {
  const db = getDB();
  db.runSync('UPDATE movies SET rewatch_count = rewatch_count + 1 WHERE tmdb_id = ?', [tmdbId]);
};

export const removeMovie = (tmdbId: number) => {
  const db = getDB();
  db.runSync('DELETE FROM movies WHERE tmdb_id = ?', [tmdbId]);
};

export const isMovieSaved = (tmdbId: number): boolean => {
  const db = getDB();
  const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM movies WHERE tmdb_id = ?', [tmdbId]);
  return (row?.count ?? 0) > 0;
};

// ── Stats ─────────────────────────────────────────────────────
export const getStats = () => {
  const db = getDB();

  const counts = db.getFirstSync<{ total: number; watched: number; watchlist: number; watching: number }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'watched' THEN 1 ELSE 0 END) as watched,
      SUM(CASE WHEN status = 'watchlist' THEN 1 ELSE 0 END) as watchlist,
      SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END) as watching
    FROM movies`
  );

  const runtimeRow = db.getFirstSync<{ total_minutes: number }>(
    `SELECT SUM(runtime) as total_minutes FROM movies WHERE status = 'watched'`
  );

  const avgRating = db.getFirstSync<{ avg: number }>(
    `SELECT AVG(user_rating) as avg FROM movies WHERE user_rating IS NOT NULL`
  );

  const topGenres = db.getAllSync<{ genre: string; count: number }>(
    `SELECT genres, COUNT(*) as cnt FROM movies WHERE status = 'watched' GROUP BY genres`
  );

  const recentlyWatched = db.getAllSync<LocalMovie>(
    `SELECT * FROM movies WHERE status = 'watched' ORDER BY watch_date DESC LIMIT 5`
  );

  const favourites = db.getAllSync<LocalMovie>(
    `SELECT * FROM movies WHERE is_favourite = 1 ORDER BY date_added DESC`
  );

  const totalMinutes = runtimeRow?.total_minutes ?? 0;

  return {
    total: counts?.total ?? 0,
    watched: counts?.watched ?? 0,
    watchlist: counts?.watchlist ?? 0,
    watching: counts?.watching ?? 0,
    totalHours: Math.floor(totalMinutes / 60),
    totalDays: parseFloat((totalMinutes / 1440).toFixed(1)),
    avgRating: avgRating?.avg ? parseFloat(avgRating.avg.toFixed(1)) : null,
    recentlyWatched,
    favourites,
  };
};

// ── Search local ─────────────────────────────────────────────
export const searchLocalMovies = (query: string): LocalMovie[] => {
  const db = getDB();
  return db.getAllSync<LocalMovie>(
    `SELECT * FROM movies WHERE title LIKE ? ORDER BY date_added DESC`,
    [`%${query}%`]
  );
};

// ── Collections ───────────────────────────────────────────────
export const createCollection = (name: string, description?: string, color?: string) => {
  const db = getDB();
  db.runSync(
    'INSERT INTO collections (name, description, color) VALUES (?, ?, ?)',
    [name, description ?? '', color ?? '#E8A838']
  );
};

export const getCollections = () => {
  const db = getDB();
  return db.getAllSync('SELECT * FROM collections ORDER BY created_at DESC');
};
