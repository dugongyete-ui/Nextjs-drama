"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search,
  Globe,
  Menu,
  X,
  Play,
  Compass,
  Flame,
  ChevronDown,
  Instagram,
} from "lucide-react";
import { useAppStore, PLATFORMS, type Platform } from "@/lib/store";
import { usePlatformApi } from "@/lib/platforms/adapter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const router = useRouter();
  const { lang, setLang, platform, setPlatform, searchHistory, addSearchHistory, clearSearchHistory } = useAppStore();
  const platformApi = usePlatformApi();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const platformRef = useRef<HTMLDivElement>(null);

  const { data: languagesData } = useQuery({
    queryKey: ["languages", platform],
    queryFn: () => platformApi.getLanguages(),
  });

  const languages = platformApi.extractLanguages((languagesData || {}) as any);

  // Close platform dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (platformRef.current && !platformRef.current.contains(e.target as Node)) {
        setPlatformOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const queryClient = useQueryClient();

  const handlePlatformSwitch = useCallback((p: Platform) => {
    setPlatform(p);
    setPlatformOpen(false);
    // Clear ALL query cache to prevent data from old platform bleeding in
    queryClient.clear();
    // Full page reload to ensure all components re-initialize with new platform
    window.location.href = "/";
  }, [setPlatform, queryClient]);

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed) {
      addSearchHistory(trimmed);
      setSearchOpen(false);
      setQuery("");
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }, [query, addSearchHistory, router]);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const navLinks = [
    { href: "/", label: "Home", icon: Flame },
    { href: "/browse", label: "Explore", icon: Compass },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Instagram className="w-5 h-5 text-cinema" />
              <span className="text-lg font-bold text-foreground tracking-tight">
                <span className="text-muted-foreground text-sm font-normal">IG:</span> off.dzcx
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1 ml-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Platform Switcher */}
              <div ref={platformRef} className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setPlatformOpen(!platformOpen)}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 px-2 h-9"
                >
                  <Image
                    src={PLATFORMS.find(p => p.id === platform)?.logo || "/dramabox-logo.png"}
                    alt={PLATFORMS.find(p => p.id === platform)?.name || "Platform"}
                    width={20}
                    height={20}
                    className="rounded"
                  />
                  <span className="hidden sm:inline">{PLATFORMS.find(p => p.id === platform)?.name}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${platformOpen ? "rotate-180" : ""}`} />
                </Button>
                {platformOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 rounded-xl glass border border-white/10 shadow-xl overflow-hidden z-50">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handlePlatformSwitch(p.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                          platform === p.id
                            ? "bg-cinema/15 text-cinema"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        <Image
                          src={p.logo}
                          alt={p.name}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                        <span>{p.name}</span>
                        {platform === p.id && <span className="ml-auto w-2 h-2 rounded-full bg-cinema" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Language Switcher */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLangOpen(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <Globe className="w-5 h-5" />
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:text-foreground hover:bg-white/5"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-white/5 pt-3">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Search Dramas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search for dramas..."
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-cinema focus:ring-cinema/30"
              />
              <Button onClick={handleSearch} className="bg-cinema hover:bg-cinema/90 text-white shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {searchHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Searches</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearchHistory}
                    className="text-xs text-muted-foreground hover:text-cinema h-6 px-2"
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((h) => (
                    <button
                      key={h}
                      onClick={() => {
                        setQuery(h);
                        addSearchHistory(h);
                        setSearchOpen(false);
                        setQuery("");
                        router.push(`/search?q=${encodeURIComponent(h)}`);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-foreground transition-all"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Modal */}
      <Dialog open={langOpen} onOpenChange={setLangOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-cinema" />
              Language
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {(languages || []).map((l: Language) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setLangOpen(false);
                }}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  lang === l.code
                    ? "bg-cinema text-white glow-cinema"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
