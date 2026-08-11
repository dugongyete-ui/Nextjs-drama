import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Supported platforms */
export type Platform = "dramabox" | "pinedrama" | "iqiyi";

export const PLATFORMS: { id: Platform; name: string; logo: string }[] = [
  { id: "dramabox", name: "DramaBox", logo: "/dramabox-logo.png" },
  { id: "pinedrama", name: "PineDrama", logo: "/pinedrama-logo.png" },
  { id: "iqiyi", name: "iQIYI", logo: "/iqiyi-logo.png" },
];

interface AppState {
  lang: string;
  setLang: (lang: string) => void;
  platform: Platform;
  setPlatform: (platform: Platform) => void;
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: "id",
      setLang: (lang) => set({ lang }),
      platform: "dramabox" as Platform,
      setPlatform: (platform) => set({ platform }),
      searchHistory: [],
      addSearchHistory: (query) =>
        set((state) => {
          const filtered = state.searchHistory.filter((h) => h !== query);
          return { searchHistory: [query, ...filtered].slice(0, 10) };
        }),
      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: "dramabox-app-store", // localStorage key
      partialize: (state) => ({
        lang: state.lang,
        platform: state.platform,
      }), // only persist lang and platform
    }
  )
);
