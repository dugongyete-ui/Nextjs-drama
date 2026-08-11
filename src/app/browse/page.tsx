"use client";

import { useQuery } from "@tanstack/react-query";
import { usePlatformApi, type UnifiedDrama } from "@/lib/platforms/adapter";
import { useAppStore } from "@/lib/store";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DramaCard from "@/components/drama/DramaCard";
import { DramaCardGridSkeleton } from "@/components/drama/SkeletonLoaders";
import { Compass, ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

/**
 * Category option shape from the categories API response.
 */
interface CategoryOption {
  label: string;
  value: string;
}

interface CategoryGroup {
  name: string;
  options: CategoryOption[];
  type: number;
}

interface SimpleCategory {
  id: string;
  name: string;
}

export default function BrowsePage() {
  const { lang, platform } = useAppStore();
  const platformApi = usePlatformApi();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string>("");

  // Fetch categories for the filter bar
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", platform, lang],
    queryFn: () => platformApi.getCategories(lang),
  });

  // Extract genre options from categories response — platform-aware
  const categoriesResp = (categoriesData || {}) as Record<string, unknown>;

  // DramaBox: categories are grouped (genre, region, sort)
  // PineDrama: categories are a flat list [{id, name}]
  const isDramaBox = platform === "dramabox";

  const genreOptions: CategoryOption[] = isDramaBox
    ? (() => {
        const genreCategory = Array.isArray(categoriesResp.categories)
          ? (categoriesResp.categories as CategoryGroup[]).find((c) => c.name === "genre")
          : null;
        return genreCategory?.options?.filter((o) => o.value !== "") || [];
      })()
    : (() => {
        // PineDrama: flat categories → CategoryOption format
        const cats = platformApi.extractCategories(categoriesData);
        return (cats as SimpleCategory[]).map((c) => ({ label: c.name, value: c.id }));
      })();

  const regionOptions: CategoryOption[] = isDramaBox
    ? (() => {
        const regionCategory = Array.isArray(categoriesResp.categories)
          ? (categoriesResp.categories as CategoryGroup[]).find((c) => c.name === "region")
          : null;
        return regionCategory?.options?.filter((o) => o.value !== "") || [];
      })()
    : [];

  const sortOptions: CategoryOption[] = isDramaBox
    ? (() => {
        const sortCategory = Array.isArray(categoriesResp.categories)
          ? (categoriesResp.categories as CategoryGroup[]).find((c) => c.name === "sort")
          : null;
        return sortCategory?.options?.filter((o) => o.value !== "") || [];
      })()
    : [];

  /**
   * When a genre category is selected, use the search API with the genre label
   * because the browse API does NOT support genre filtering.
   * When "All" is selected, use the browse API with proper pagination.
   */
  const isCategorySearch = !!selectedCategory && isDramaBox;

  // Browse query — used when "All" or a genre is selected
  const { data: browseData, isLoading: browseLoading } = useQuery({
    queryKey: ["browse", platform, page, lang, selectedCategory],
    queryFn: () => platformApi.getBrowse(page, lang, selectedCategory || undefined),
  });

  // Category search query — fallback for DramaBox when browse doesn't return results
  const { data: categorySearchData, isLoading: categorySearchLoading } = useQuery({
    queryKey: ["browse-category", platform, selectedCategory, lang],
    queryFn: () => platformApi.search(selectedCategoryLabel, lang),
    enabled: isCategorySearch,
  });

  // Determine the current list of dramas
  const isLoading = isCategorySearch ? categorySearchLoading : browseLoading;
  const rawData = isCategorySearch ? categorySearchData : browseData;
  const dramaList = platformApi.extractList((rawData || {}) as Record<string, unknown>).map(platformApi.normalizeDrama);

  // Handle category selection — reset page to 1
  const handleCategorySelect = useCallback((value: string | null, label: string = "") => {
    setSelectedCategory(value);
    setSelectedCategoryLabel(label);
    setPage(1);
  }, []);

  // Handle page change — scroll to top
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-deep">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Compass className="w-8 h-8 text-cinema" />Explore
          </h1>
          <p className="text-muted-foreground mt-2">
            {isCategorySearch
              ? `Showing results for "${selectedCategoryLabel}"`
              : "Discover your next favorite drama from our complete catalog"}
          </p>
        </div>

        {/* Genre Filter Bar */}
        {genreOptions.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  !selectedCategory
                    ? "bg-cinema text-white glow-cinema"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                All
              </button>
              {genreOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleCategorySelect(opt.value, opt.label)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === opt.value
                      ? "bg-cinema text-white glow-cinema"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drama Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {isLoading ? (
            <DramaCardGridSkeleton count={18} />
          ) : dramaList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {dramaList.map((item, idx) => (
                <DramaCard
                  key={item.id || idx}
                  id={item.id}
                  title={item.title}
                  cover={item.cover}
                  coverVertical={item.coverVertical}
                  rating={item.rating}
                  episodes={item.episodes}
                  status={item.status}
                  genre={item.genre}
                  views={item.views}
                  tags={item.tags}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Compass className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No dramas found</h3>
              <p className="text-sm text-muted-foreground/60 mt-1">Try a different category or page</p>
            </div>
          )}
        </div>

        {/* Pagination — only show for "All" browse (not for category search) */}
        {!isCategorySearch && dramaList.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={page <= 1}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const pageNum = Math.max(1, page - 2) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        pageNum === page
                          ? "bg-cinema text-white"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(page + 1)}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Load More for category search results */}
        {isCategorySearch && dramaList.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex justify-center">
            <Button
              variant="outline"
              className="border-white/10 text-foreground hover:bg-white/5"
              onClick={() => handleCategorySelect(null)}
            >
              <Compass className="w-4 h-4 mr-2" />
              Browse All Dramas
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
