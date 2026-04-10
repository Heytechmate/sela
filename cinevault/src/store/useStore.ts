import { create } from 'zustand';
import { LocalMovie, getAllMovies, getStats } from '../services/database';

type Stats = Awaited<ReturnType<typeof getStats>>;

interface StoreState {
  // Library
  library: LocalMovie[];
  refreshLibrary: () => Promise<void>;

  // Global Content Mode
  contentMode: 'all' | 'movie' | 'tv';
  setContentMode: (m: 'all' | 'movie' | 'tv') => void;

  // Vault
  vaultUnlocked: boolean;
  setVaultUnlocked: (u: boolean) => void;

  // Stats
  stats: Stats | null;
  refreshStats: () => Promise<void>;

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
  refreshLibrary: async () => {
    try {
      const movies = await getAllMovies();
      set({ library: movies });
    } catch (error) {
      console.error('Failed to refresh library:', error);
    }
  },

  contentMode: 'all',
  setContentMode: (m) => set({ contentMode: m }),

  vaultUnlocked: false,
  setVaultUnlocked: (u) => set({ vaultUnlocked: u }),

  stats: null,
  refreshStats: async () => {
    try {
      const stats = await getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  },

  searchQuery: '',
  setSearchQuery: (q) => set({ setSearchQuery: q }),

  activeGenres: [],
  setActiveGenres: (g) => set({ activeGenres: g }),

  activeTab: 'home',
  setActiveTab: (t) => set({ activeTab: t }),
}));
