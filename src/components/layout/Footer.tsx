import Link from "next/link";
import { Instagram, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Instagram className="w-5 h-5 text-cinema" />
              <span className="text-lg font-bold text-foreground">
                <span className="text-muted-foreground text-sm font-normal">IG:</span> off.dzcx
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your premium destination for drama streaming. Discover trending, popular, and exclusive content.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Explore</h4>
            <div className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/browse", label: "Browse All" },
                { href: "/search?q=trending", label: "Trending" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-muted-foreground hover:text-cinema transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Genres</h4>
            <div className="space-y-3">
              {["Romance", "Action", "Fantasy", "Historical", "Thriller"].map((genre) => (
                <Link
                  key={genre}
                  href={`/search?q=${genre.toLowerCase()}`}
                  className="block text-sm text-muted-foreground hover:text-cinema transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">About</h4>
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-4 h-4 text-cinema" />
              <span className="text-sm text-muted-foreground">Made with passion for drama lovers</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://instagram.com/off.dzcx" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cinema transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} off.dzcx. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Premium streaming experience
          </p>
        </div>
      </div>
    </footer>
  );
}
