"use client";

import * as React from "react";
import { Search, X, ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  "Linen Co-ord Sets",
  "Cotton Midi Dresses",
  "Straight Kurtas",
  "Wide Leg Trousers",
  "Embroidered Tunics",
  "Soft Loungewear",
];

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClose = React.useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "unset";
      };
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // In Phase 2, this will navigate to /search?q=...
    console.log("Search query submitted:", query);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search catalog"
      className="bg-brand-dark/60 animate-in fade-in-0 fixed inset-0 z-50 flex flex-col justify-start backdrop-blur-md duration-200"
    >
      {/* Backdrop clickable area */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Search Header Container */}
      <div className="bg-brand-cream border-brand-border/80 relative w-full border-b py-6 font-sans shadow-2xl sm:py-8">
        <Container size="md">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-brand-accent flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Search Collections
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="text-brand-muted hover:text-brand-dark hover:bg-brand-light/40 focus-visible:ring-brand-gold rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="text-brand-accent pointer-events-none absolute left-4 h-6 w-6" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dresses, kurtas, co-ords, trousers..."
              className="border-brand-border bg-brand-card text-brand-dark placeholder:text-brand-subtle focus-visible:border-brand-gold focus-visible:ring-brand-gold/30 h-14 w-full rounded-xl border pr-12 pl-14 text-base shadow-inner focus-visible:ring-2 focus-visible:outline-none sm:text-lg"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-brand-muted hover:text-brand-dark absolute right-4 rounded-full p-1"
                aria-label="Clear search input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Popular Search Suggestions */}
          <div className="mt-5 space-y-2">
            <p className="text-brand-muted text-[11px] font-semibold tracking-wider uppercase">
              Popular Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="border-brand-border/80 bg-brand-card hover:bg-brand-light/30 hover:border-brand-gold text-brand-dark inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors"
                >
                  <span>{term}</span>
                  <ArrowRight className="text-brand-accent h-3 w-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
