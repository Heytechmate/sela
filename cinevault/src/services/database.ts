import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export const getDB = () => {
  if (!db) db = SQLite.openDatabaseSync('cinevault.db');
  return db;
};

export interface LocalMovie {
  id?: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  runtime: number;
  genres: string;           // JSON string of string names
  overview: string;
  status: 'watchlist' | 'watching' | 'watched';
  user_rating: number | null;
  user_notes: string | null;
  watch_date: string | null;
  date_added: string;
  rewatch_count: number;
  is_favourite: number;     // 0 or 1
  last_viewed: string;      // ISO date for pruning logic
  media_type: 'movie' | 'tv';
  imdb_id?: string | null;
  last_season_watched: number;
  last_episode_watched: number;
  total_seasons: number;
  total_episodes: number;
  diary_feeling?: string | null;
  diary_recommend?: number; // 0 or 1
  diary_special?: string | null;
}

// ── Init ─────────────────────────────────────────────────────
export const initDB = async () => {
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
      is_favourite INTEGER DEFAULT 0,
      last_viewed TEXT DEFAULT (datetime('now')),
      media_type TEXT DEFAULT 'movie',
      last_season_watched INTEGER DEFAULT 0,
      total_seasons INTEGER DEFAULT 0,
      diary_feeling TEXT,
      diary_recommend INTEGER DEFAULT 0,
      diary_special TEXT
    );
  `);

  // Migrations
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(movies)");

    // ... existing migration checks ...

    // Add Diary columns
    if (!tableInfo.some(col => col.name === 'diary_feeling')) {
      await db.execAsync("ALTER TABLE movies ADD COLUMN diary_feeling TEXT");
    }
    if (!tableInfo.some(col => col.name === 'diary_recommend')) {
      await db.execAsync("ALTER TABLE movies ADD COLUMN diary_recommend INTEGER DEFAULT 0");
    }
    if (!tableInfo.some(col => col.name === 'diary_special')) {
      await db.execAsync("ALTER TABLE movies ADD COLUMN diary_special TEXT");
    }
    if (!tableInfo.some(col => col.name === 'total_episodes')) {
      await db.execAsync("ALTER TABLE movies ADD COLUMN total_episodes INTEGER DEFAULT 0");
    }
    if (!tableInfo.some(col => col.name === 'last_episode_watched')) {
      await db.execAsync("ALTER TABLE movies ADD COLUMN last_episode_watched INTEGER DEFAULT 0");
    }
    if (!tableInfo.some(col => col.name === 'imdb_id')) {
      await db.execAsync("ALTER TABLE movies ADD COLUMN imdb_id TEXT");
    }
  } catch (e) {
    console.error('Migration Error:', e);
  }

  db.execSync(`
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
export const addMovie = async (movie: Omit<LocalMovie, 'id' | 'date_added' | 'rewatch_count' | 'is_favourite' | 'last_viewed' | 'last_episode_watched'>) => {
  const db = getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO movies
      (tmdb_id, title, poster_path, backdrop_path, release_date, vote_average, runtime, genres, overview, status, user_rating, user_notes, watch_date, last_viewed, media_type, imdb_id, last_season_watched, last_episode_watched, total_seasons, total_episodes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movie.tmdb_id, movie.title, movie.poster_path, movie.backdrop_path,
      movie.release_date, movie.vote_average, movie.runtime,
      movie.genres, movie.overview, movie.status,
      movie.user_rating, movie.user_notes, movie.watch_date,
      new Date().toISOString(), movie.media_type, movie.imdb_id || null,
      movie.last_season_watched || 0, 0, movie.total_seasons || 0,
      movie.total_episodes || 0
    ]
  );
};

export const getMovie = async (tmdbId: number): Promise<LocalMovie | null> => {
  const db = getDB();
  // Update last_viewed whenever a movie is accessed
  await db.runAsync('UPDATE movies SET last_viewed = ? WHERE tmdb_id = ?', [new Date().toISOString(), tmdbId]);
  return await db.getFirstAsync<LocalMovie>('SELECT * FROM movies WHERE tmdb_id = ?', [tmdbId]);
};

export const getAllMovies = async (status?: string): Promise<LocalMovie[]> => {
  const db = getDB();
  if (status) {
    return await db.getAllAsync<LocalMovie>('SELECT * FROM movies WHERE status = ? ORDER BY date_added DESC', [status]);
  }
  return await db.getAllAsync<LocalMovie>('SELECT * FROM movies ORDER BY date_added DESC');
};

export const updateMovieStatus = async (tmdbId: number, status: string) => {
  const db = getDB();
  if (status === 'watched') {
    await db.runAsync(
      'UPDATE movies SET status = ?, watch_date = ? WHERE tmdb_id = ?',
      [status, new Date().toISOString(), tmdbId]
    );
  } else {
    await db.runAsync(
      'UPDATE movies SET status = ?, watch_date = NULL WHERE tmdb_id = ?',
      [status, tmdbId]
    );
  }
};

export const updateUserRating = async (tmdbId: number, rating: number | null) => {
  const db = getDB();
  await db.runAsync('UPDATE movies SET user_rating = ? WHERE tmdb_id = ?', [rating, tmdbId]);
};

export const updateNotes = async (tmdbId: number, notes: string) => {
  const db = getDB();
  await db.runAsync('UPDATE movies SET user_notes = ? WHERE tmdb_id = ?', [notes, tmdbId]);
};

export const updateDiary = async (
  tmdbId: number,
  diary: { feeling?: string | null; recommend?: number; special?: string | null; notes?: string | null }
) => {
  const db = getDB();
  await db.runAsync(
    `UPDATE movies SET
      diary_feeling = ?,
      diary_recommend = ?,
      diary_special = ?,
      user_notes = ?
     WHERE tmdb_id = ?`,
    [diary.feeling, diary.recommend ?? 0, diary.special, diary.notes, tmdbId]
  );
};

export const updateTVProgress = async (tmdbId: number, season: number, episode?: number) => {
  const db = getDB();
  if (episode !== undefined) {
    await db.runAsync(
      'UPDATE movies SET last_season_watched = ?, last_episode_watched = ? WHERE tmdb_id = ?',
      [season, episode, tmdbId]
    );
  } else {
    await db.runAsync('UPDATE movies SET last_season_watched = ? WHERE tmdb_id = ?', [season, tmdbId]);
  }
};

export const toggleFavourite = async (tmdbId: number, val: boolean) => {
  const db = getDB();
  await db.runAsync('UPDATE movies SET is_favourite = ? WHERE tmdb_id = ?', [val ? 1 : 0, tmdbId]);
};

export const markWatched = async (tmdbId: number, date?: string) => {
  const db = getDB();
  await db.runAsync(
    'UPDATE movies SET status = ?, watch_date = ? WHERE tmdb_id = ?',
    ['watched', date || new Date().toISOString(), tmdbId]
  );
};

export const incrementRewatch = async (tmdbId: number) => {
  const db = getDB();
  await db.runAsync('UPDATE movies SET rewatch_count = rewatch_count + 1 WHERE tmdb_id = ?', [tmdbId]);
};

export const removeMovie = async (tmdbId: number) => {
  const db = getDB();
  await db.runAsync('DELETE FROM movies WHERE tmdb_id = ?', [tmdbId]);
};

export const isMovieSaved = async (tmdbId: number): Promise<boolean> => {
  const db = getDB();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM movies WHERE tmdb_id = ?', [tmdbId]);
  return (row?.count ?? 0) > 0;
};

// ── Stats ─────────────────────────────────────────────────────
export const getStats = async () => {
  const db = getDB();

  const [counts, runtimeRows, avgRating, recentlyWatched, favourites, watchedGenresRes] = await Promise.all([
    db.getFirstAsync<{ total: number; watched: number; watchlist: number; watching: number }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'watched' THEN 1 ELSE 0 END) as watched,
        SUM(CASE WHEN status = 'watchlist' THEN 1 ELSE 0 END) as watchlist,
        SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END) as watching
      FROM movies`
    ),
    db.getAllAsync<LocalMovie>(
      `SELECT runtime, media_type, last_season_watched, last_episode_watched, total_seasons, total_episodes, status
       FROM movies
       WHERE status IN ('watched', 'watching')`
    ),
    db.getFirstAsync<{ avg: number }>(
      `SELECT AVG(user_rating) as avg FROM movies WHERE user_rating IS NOT NULL`
    ),
    db.getAllAsync<LocalMovie>(
      `SELECT * FROM movies WHERE status = 'watched' ORDER BY watch_date DESC LIMIT 5`
    ),
    db.getAllAsync<LocalMovie>(
      `SELECT * FROM movies WHERE is_favourite = 1 ORDER BY date_added DESC`
    ),
    db.getAllAsync<{ genres: string }>(
      `SELECT genres FROM movies WHERE status = 'watched'`
    )
  ]);

  let totalMinutes = 0;
  (runtimeRows || []).forEach(m => {
    if (m.media_type === 'movie') {
      if (m.status === 'watched') totalMinutes += (m.runtime || 0);
    } else {
      // For TV: estimate based on seasons and episodes watched
      const epsPerSeason = m.total_seasons > 0 ? (m.total_episodes / m.total_seasons) : 0;
      let episodesWatched = 0;

      if (m.status === 'watched') {
        episodesWatched = m.total_episodes;
      } else {
        // Full seasons + current season episodes
        episodesWatched = (m.last_season_watched * epsPerSeason) + (m.last_episode_watched || 0);
      }

      totalMinutes += (episodesWatched * (m.runtime || 0));
    }
  });
  const watchedMovies = watchedGenresRes || [];

  // Process genres for stats
  const genreMap: { [key: string]: number } = {};
  watchedMovies.forEach(m => {
    try {
      const gs = JSON.parse(m.genres);
      gs.forEach((g: string) => {
        genreMap[g] = (genreMap[g] || 0) + 1;
      });
    } catch (e) {}
  });

  const sortedGenres = Object.entries(genreMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total: counts?.total ?? 0,
    watched: counts?.watched ?? 0,
    watchlist: counts?.watchlist ?? 0,
    watching: counts?.watching ?? 0,
    totalHours: Math.floor(totalMinutes / 60),
    totalDays: parseFloat((totalMinutes / 1440).toFixed(1)),
    avgRating: avgRating?.avg ? parseFloat(avgRating.avg.toFixed(1)) : null,
    recentlyWatched: recentlyWatched || [],
    favourites: favourites || [],
    topGenres: sortedGenres,
  };
};

export const getDBSize = async (): Promise<{ mb: number; formatted: string }> => {
  const db = getDB();
  try {
    const pageCountRes = await db.getFirstAsync<{ page_count: number }>('PRAGMA page_count');
    const pageSizeRes = await db.getFirstAsync<{ page_size: number }>('PRAGMA page_size');

    if (pageCountRes && pageSizeRes) {
      const bytes = pageCountRes.page_count * pageSizeRes.page_size;
      const mb = bytes / (1024 * 1024);
      return { mb, formatted: `${mb.toFixed(2)} MB` };
    }
  } catch (e) {
    console.error('Error getting DB size:', e);
  }
  return { mb: 0, formatted: 'Unknown' };
};

/**
 * Smart Pruning: If DB > 3.5MB, clear high-storage fields for movies not viewed in 30 days.
 */
export const runPruning = async () => {
  const { mb } = await getDBSize();
  if (mb < 3.5) return; // Only prune if approaching 4MB limit

  console.log(`[Storage] DB Size is ${mb.toFixed(2)}MB. Running pruning...`);
  const db = getDB();

  // Clear overview and backdrop for movies not viewed in 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const res = await db.runAsync(
    `UPDATE movies
     SET overview = '(Metadata pruned to save space)', backdrop_path = NULL
     WHERE last_viewed < ? AND is_favourite = 0`,
    [thirtyDaysAgo.toISOString()]
  );

  if (res.changes > 0) {
    console.log(`[Storage] Pruned metadata for ${res.changes} movies.`);
    await db.runAsync('VACUUM'); // Reclaim space
  }
};

// ── Batch Operations ──────────────────────────────────────────
export const batchUpdateStatus = async (ids: number[], status: string) => {
  const db = getDB();
  const placeholders = ids.map(() => '?').join(',');
  const watchDate = status === 'watched' ? new Date().toISOString() : null;

  if (status === 'watched') {
    await db.runAsync(
      `UPDATE movies SET status = ?, watch_date = ? WHERE tmdb_id IN (${placeholders})`,
      [status, watchDate, ...ids]
    );
  } else {
    await db.runAsync(
      `UPDATE movies SET status = ? WHERE tmdb_id IN (${placeholders})`,
      [status, ...ids]
    );
  }
};

export const batchDeleteMovies = async (ids: number[]) => {
  const db = getDB();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`DELETE FROM movies WHERE tmdb_id IN (${placeholders})`, ids);
};

export const batchToggleFav = async (ids: number[], isFav: boolean) => {
  const db = getDB();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE movies SET is_favourite = ? WHERE tmdb_id IN (${placeholders})`,
    [isFav ? 1 : 0, ...ids]
  );
};

export const getDiaryEntries = async (): Promise<LocalMovie[]> => {
  const db = getDB();
  return await db.getAllAsync<LocalMovie>(
    `SELECT * FROM movies
     WHERE (diary_feeling IS NOT NULL AND diary_feeling != '')
        OR (user_notes IS NOT NULL AND user_notes != '')
        OR (diary_special IS NOT NULL AND diary_special != '')
     ORDER BY watch_date DESC, date_added DESC`
  );
};

// ── Search local ─────────────────────────────────────────────
export const searchLocalMovies = async (query: string): Promise<LocalMovie[]> => {
  const db = getDB();
  return await db.getAllAsync<LocalMovie>(
    `SELECT * FROM movies WHERE title LIKE ? ORDER BY date_added DESC`,
    [`%${query}%`]
  );
};

// ── Collections ───────────────────────────────────────────────
export const createCollection = async (name: string, description?: string, color?: string) => {
  const db = getDB();
  await db.runAsync(
    'INSERT INTO collections (name, description, color) VALUES (?, ?, ?)',
    [name, description ?? '', color ?? '#E8A838']
  );
};

export const getCollections = async () => {
  const db = getDB();
  return await db.getAllAsync('SELECT * FROM collections ORDER BY created_at DESC');
};
