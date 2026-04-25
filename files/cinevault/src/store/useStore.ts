import { create } from 'zustand';
import { LocalMovie, getAllMovies, getStats } from '../services/database';

interface StoreState {
  // Library
  library: LocalMovie[];
  refreshLibrary: () => void;

  // Stats
  stats: ReturnType<typeof getStats> | null;
  refreshStats: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Active filters
  activeGenres: number[];
  setActiveGenres: (g: number[]) => void;

  // UI
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  library: [],
  refreshLibrary: () => {
    const movies = getAllMovies();
    set({ library: movies });
  },

  stats: null,
  refreshStats: () => {
    const stats = getStats();
    set({ stats });
  },

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  activeGenres: [],
  setActiveGenres: (g) => set({ activeGenres: g }),

  activeTab: 'home',
  setActiveTab: (t) => set({ activeTab: t }),
}));
