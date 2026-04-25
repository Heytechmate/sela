import axios from 'axios';
import { TMDB_BASE_URL, TMDB_API_KEY, TMDB_READ_TOKEN } from '../utils/constants';

const api = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${TMDB_READ_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Fallback to API key param if token fails
api.interceptors.request.use((config) => {
  if (!config.params) config.params = {};
  config.params.api_key = TMDB_API_KEY;
  config.params.language = 'en-US';
  return config;
});

export interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
  status?: string;
  original_language?: string;
  popularity?: number;
  budget?: number;
  revenue?: number;
  production_companies?: { name: string; logo_path: string | null }[];
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
export const searchMovies = async (query: string, page = 1) => {
  const res = await api.get('/search/movie', {
    params: { query, page, include_adult: false },
  });
  return res.data;
};

// ── Discover / Browse ────────────────────────────────────────
export const getTrending = async (timeWindow: 'day' | 'week' = 'week') => {
  const res = await api.get(`/trending/movie/${timeWindow}`);
  return res.data.results as TMDbMovie[];
};

export const getNowPlaying = async (page = 1) => {
  const res = await api.get('/movie/now_playing', { params: { page } });
  return res.data.results as TMDbMovie[];
};

export const getPopular = async (page = 1) => {
  const res = await api.get('/movie/popular', { params: { page } });
  return res.data.results as TMDbMovie[];
};

export const getTopRated = async (page = 1) => {
  const res = await api.get('/movie/top_rated', { params: { page } });
  return res.data.results as TMDbMovie[];
};

export const getUpcoming = async (page = 1) => {
  const res = await api.get('/movie/upcoming', { params: { page } });
  return res.data.results as TMDbMovie[];
};

// ── Mood / Genre Discovery ───────────────────────────────────
export const discoverByGenres = async (genreIds: number[], page = 1) => {
  const res = await api.get('/discover/movie', {
    params: {
      with_genres: genreIds.join(','),
      sort_by: 'vote_average.desc',
      'vote_count.gte': 200,
      page,
    },
  });
  return res.data.results as TMDbMovie[];
};

export const discoverByFilters = async (filters: {
  genres?: number[];
  year?: number;
  minRating?: number;
  maxRating?: number;
  sortBy?: string;
  page?: number;
}) => {
  const params: Record<string, any> = {
    sort_by: filters.sortBy || 'popularity.desc',
    page: filters.page || 1,
    include_adult: false,
    'vote_count.gte': 50,
  };
  if (filters.genres?.length) params.with_genres = filters.genres.join(',');
  if (filters.year) params.primary_release_year = filters.year;
  if (filters.minRating) params['vote_average.gte'] = filters.minRating;
  if (filters.maxRating) params['vote_average.lte'] = filters.maxRating;

  const res = await api.get('/discover/movie', { params });
  return res.data;
};

// ── Movie Detail ─────────────────────────────────────────────
export const getMovieDetail = async (movieId: number): Promise<TMDbMovie> => {
  const res = await api.get(`/movie/${movieId}`);
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

export const getFullMovieData = async (movieId: number) => {
  const [detail, credits, videos, similar] = await Promise.all([
    getMovieDetail(movieId),
    getMovieCredits(movieId),
    getMovieVideos(movieId),
    getSimilarMovies(movieId),
  ]);
  return { detail, credits, videos, similar };
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
