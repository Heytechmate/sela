import axios from 'axios';
import { TMDB_BASE_URL, TMDB_API_KEY, TMDB_READ_TOKEN } from '../utils/constants';

const api = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Use API key for all requests
api.interceptors.request.use((config) => {
  if (!config.params) config.params = {};
  config.params.api_key = TMDB_API_KEY;
  config.params.language = 'en-US';

  // Only add Bearer token if it looks like a valid long TMDB v4 token
  if (TMDB_READ_TOKEN && TMDB_READ_TOKEN.length > 100) {
    config.headers.Authorization = `Bearer ${TMDB_READ_TOKEN}`;
  }

  return config;
});

export interface TMDbResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDbMovie {
  id: number;
  title?: string;
  name?: string; // TV shows use name instead of title
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string; // TV shows use first_air_date
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[]; // TV shows
  tagline?: string;
  status?: string;
  original_language?: string;
  popularity?: number;
  budget?: number;
  revenue?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
  }[];
  imdb_id?: string | null;
  production_companies?: { name: string; logo_path: string | null }[];
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProvidersResponse {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface TMDbCredits {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }[];
}

export interface TMDbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

// ── Search ────────────────────────────────────────────────────
export const searchMulti = async (query: string, page = 1): Promise<TMDbResponse<TMDbMovie & { media_type: string }>> => {
  const res = await api.get('/search/multi', {
    params: { query, page, include_adult: false },
  });
  return res.data;
};

export const searchMovies = async (query: string, page = 1): Promise<TMDbResponse<TMDbMovie>> => {
  const res = await api.get('/search/movie', {
    params: { query, page, include_adult: false },
  });
  return res.data;
};

export const searchTV = async (query: string, page = 1): Promise<TMDbResponse<TMDbMovie>> => {
  const res = await api.get('/search/tv', {
    params: { query, page, include_adult: false },
  });
  return res.data;
};

// ── Discover / Browse ────────────────────────────────────────
export const getTrending = async (type: 'movie' | 'tv' | 'all' = 'movie', timeWindow: 'day' | 'week' = 'week', page = 1): Promise<TMDbResponse<TMDbMovie>> => {
  const res = await api.get(`/trending/${type}/${timeWindow}`, { params: { page } });
  return res.data;
};

export const getNowPlaying = async (page = 1): Promise<TMDbResponse<TMDbMovie>> => {
  const res = await api.get('/movie/now_playing', { params: { page } });
  return res.data;
};

export const getPopular = async (type: 'movie' | 'tv' = 'movie', page = 1): Promise<TMDbResponse<TMDbMovie>> => {
  const res = await api.get(`/${type}/popular`, { params: { page } });
  return res.data;
};

export const getTopRated = async (type: 'movie' | 'tv' = 'movie', page = 1): Promise<TMDbResponse<TMDbMovie>> => {
  const res = await api.get(`/${type}/top_rated`, { params: { page } });
  return res.data;
};

export const getOnTheAir = async (page = 1): Promise<TMDbResponse<TMDbMovie>> => {
  const res = await api.get('/tv/on_the_air', { params: { page } });
  return res.data;
};

export const getUpcoming = async (page = 1) => {
  const res = await api.get('/movie/upcoming', { params: { page } });
  return res.data;
};

// ── Mood / Genre Discovery ───────────────────────────────────
export const discoverByGenres = async (genreIds: number[], isTV = false, page = 1) => {
  const endpoint = isTV ? '/discover/tv' : '/discover/movie';
  const res = await api.get(endpoint, {
    params: {
      with_genres: genreIds.join('|'),
      sort_by: 'popularity.desc',
      'vote_count.gte': isTV ? 50 : 100,
      page,
    },
  });
  return res.data;
};

export const discoverByFilters = async (filters: {
  genres?: number[];
  year?: number;
  minRating?: number;
  maxRating?: number;
  sortBy?: string;
  page?: number;
  language?: string;
  region?: string;
  isTV?: boolean;
}) => {
  const endpoint = filters.isTV ? '/discover/tv' : '/discover/movie';
  const params: Record<string, any> = {
    sort_by: filters.sortBy || 'popularity.desc',
    page: filters.page || 1,
    include_adult: false,
    'vote_count.gte': filters.language ? 10 : 50,
  };
  if (filters.genres?.length) params.with_genres = filters.genres.join(',');
  if (filters.year) params.primary_release_year = filters.year;
  if (filters.minRating) params['vote_average.gte'] = filters.minRating;
  if (filters.maxRating) params['vote_average.lte'] = filters.maxRating;
  if (filters.language) params.with_original_language = filters.language;
  if (filters.region) params.region = filters.region;

  const res = await api.get(endpoint, { params });
  return res.data;
};

// ── Movie Detail ─────────────────────────────────────────────
export const getMovieDetail = async (movieId: number): Promise<TMDbMovie> => {
  const res = await api.get(`/movie/${movieId}`);
  return res.data;
};

export const getTVDetail = async (tvId: number): Promise<TMDbMovie> => {
  const res = await api.get(`/tv/${tvId}`);
  return res.data;
};

export const getMovieCredits = async (movieId: number): Promise<TMDbCredits> => {
  const res = await api.get(`/movie/${movieId}/credits`);
  return res.data;
};

export const getMovieVideos = async (movieId: number): Promise<TMDbVideo[]> => {
  const res = await api.get(`/movie/${movieId}/videos`);
  return res.data.results;
};

export const getSimilarMovies = async (movieId: number): Promise<TMDbMovie[]> => {
  const res = await api.get(`/movie/${movieId}/similar`);
  return res.data.results;
};

export const getMovieRecommendations = async (movieId: number): Promise<TMDbMovie[]> => {
  const res = await api.get(`/movie/${movieId}/recommendations`);
  return res.data.results;
};

export const getTVRecommendations = async (tvId: number): Promise<TMDbMovie[]> => {
  const res = await api.get(`/tv/${tvId}/recommendations`);
  return res.data.results;
};

export const getWatchProviders = async (id: number, type: 'movie' | 'tv'): Promise<WatchProvidersResponse | null> => {
  const res = await api.get(`/${type}/${id}/watch/providers`);
  // Default to India (IN) for JioHotstar context, or generic fallback
  return res.data.results?.IN || res.data.results?.US || null;
};

/**
 * Generates personalized recommendations based on library history.
 * Uses a mix of recent additions and random library items for variety.
 */
export const getRecommendationsForLibrary = async (library: { tmdb_id: number; media_type?: string; user_rating?: number | null; is_favourite?: number }[]) => {
  if (library.length === 0) return [];

  // Create a pool of potential seeds: Recent, Favourites, and High Rated
  const favorites = library.filter(m => m.is_favourite === 1);
  const highRated = library.filter(m => (m.user_rating || 0) >= 8);
  const recent    = library.slice(0, 10);

  const pool = [...new Set([...recent, ...favorites, ...highRated])];

  // Pick 3 random items from this quality pool to serve as "Seeds"
  const seeds = pool.sort(() => 0.5 - Math.random()).slice(0, 3);

  const recs = await Promise.all(
    seeds.map(item =>
      item.media_type === 'tv'
        ? getTVRecommendations(item.tmdb_id)
        : getMovieRecommendations(item.tmdb_id)
    )
  );

  const all = recs.flat();
  const unique = Array.from(new Map(all.map(m => [m.id, m])).values());

  const libIds = new Set(library.map(l => l.tmdb_id));
  const filtered = unique.filter(m => !libIds.has(m.id));

  // Return a shuffled slice
  return filtered.sort(() => 0.5 - Math.random()).slice(0, 20);
};

export const getIndianCinema = async (page = 1) => {
  const res = await api.get('/discover/movie', {
    params: {
      with_original_language: 'hi|te|ta|ml|kn',
      sort_by: 'popularity.desc',
      'vote_count.gte': 10,
      page,
    },
  });
  return res.data;
};

export const getHiddenGems = async (type: 'movie' | 'tv' = 'movie', page = 1) => {
  const res = await api.get(`/discover/${type}`, {
    params: {
      sort_by: 'vote_average.desc',
      'vote_count.gte': 50,
      'vote_count.lte': 500,
      'vote_average.gte': 7.5,
      page,
    },
  });
  return res.data;
};

export const getKDramas = async (page = 1): Promise<TMDbResponse<TMDbMovie>> => {
  const res = await api.get('/discover/tv', {
    params: {
      with_original_language: 'ko',
      sort_by: 'popularity.desc',
      page,
    },
  });
  return res.data;
};

export const getTVSeasonDetail = async (tvId: number, seasonNumber: number) => {
  const res = await api.get(`/tv/${tvId}/season/${seasonNumber}`);
  return res.data;
};

export const getFullMovieData = async (id: number, type: 'movie' | 'tv' = 'movie') => {
  const isTV = type === 'tv';
  const [detail, credits, videos, similar, watchProviders, externalIds] = await Promise.all([
    isTV ? getTVDetail(id) : getMovieDetail(id),
    api.get(`/${type}/${id}/credits`).then(r => r.data),
    api.get(`/${type}/${id}/videos`).then(r => r.data.results),
    api.get(`/${type}/${id}/similar`).then(r => r.data.results),
    getWatchProviders(id, type),
    api.get(`/${type}/${id}/external_ids`).then(r => r.data),
  ]);

  // Attach imdb_id to detail
  if (externalIds?.imdb_id) {
    detail.imdb_id = externalIds.imdb_id;
  }

  return { detail, credits, videos, similar, watchProviders };
};

// ── Genres List ──────────────────────────────────────────────
export const getGenres = async () => {
  const res = await api.get('/genre/movie/list');
  return res.data.genres as { id: number; name: string }[];
};

// ── Person ───────────────────────────────────────────────────
export const getPersonMovies = async (personId: number) => {
  const res = await api.get(`/person/${personId}/movie_credits`);
  return res.data;
};
