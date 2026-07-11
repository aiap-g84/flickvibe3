import { useState, useEffect, useCallback } from "react";
import { VibeScreen } from "./screens/VibeScreen";
import { RecommendationScreen } from "./screens/RecommendationScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { getRecommendation, fetchTmdbMovieRating, type Recommendation } from "./lib/api";
import {
  fetchWatchlist, fetchRatings, fetchRatingsCache, upsertRatingsCache,
  addToWatchlist, removeFromWatchlist, upsertRating,
  type WatchlistItem, type Rating, type MovieRatingCache,
} from "./lib/supabase";

type Tab = "vibe" | "profile";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function App() {
  const [tab, setTab] = useState<Tab>("vibe");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [movieRatingsCache, setMovieRatingsCache] = useState<Map<number, MovieRatingCache>>(new Map());
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [noPicksMessage, setNoPicksMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [wl, rt] = await Promise.all([fetchWatchlist(), fetchRatings()]);
      setWatchlist(wl);
      setRatings(rt);

      const allIds = [...new Set([...wl.map((w) => w.movie_id), ...rt.map((r) => r.movie_id)])];
      if (allIds.length === 0) return;

      const cached = await fetchRatingsCache(allIds);
      const cacheMap = new Map(cached.map((c) => [c.movie_id, c]));

      // Find IDs that are missing or stale (> 30 days old)
      const staleIds = allIds.filter((id) => {
        const entry = cacheMap.get(id);
        if (!entry) return true;
        return Date.now() - new Date(entry.updated_at).getTime() > THIRTY_DAYS_MS;
      });

      if (staleIds.length > 0) {
        const refreshed = await Promise.allSettled(staleIds.map(fetchTmdbMovieRating));
        const toUpsert = refreshed
          .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof fetchTmdbMovieRating>>>> =>
            r.status === "fulfilled" && r.value !== null,
          )
          .map((r) => r.value);

        if (toUpsert.length > 0) {
          await upsertRatingsCache(toUpsert);
          toUpsert.forEach((entry) => {
            cacheMap.set(entry.movie_id, { ...entry, updated_at: new Date().toISOString() });
          });
        }
      }

      setMovieRatingsCache(cacheMap);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecommend = async (mood: string, time: string, location: string, era: string) => {
    setLoading(true);
    setError(null);
    setNoPicksMessage(null);
    try {
      const result = await getRecommendation(
        mood, time, location, era,
        watchlist.map((w) => ({ movie_id: w.movie_id, title: w.title })),
        ratings.map((r) => ({ movie_id: r.movie_id, title: r.title, rating: r.rating })),
      );
      setRecommendations(result.recommendations);
      setNoPicksMessage(result.noPicksMessage ?? null);

      // Cache TMDB ratings from the fresh recommendation payload
      const toCache = result.recommendations
        .filter((r) => r.vote_average != null)
        .map((r) => ({ movie_id: r.movie_id, vote_average: r.vote_average, vote_count: r.vote_count }));
      if (toCache.length > 0) {
        upsertRatingsCache(toCache).catch(console.error);
        setMovieRatingsCache((prev) => {
          const next = new Map(prev);
          toCache.forEach((e) => next.set(e.movie_id, { ...e, updated_at: new Date().toISOString() }));
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (rec: Recommendation) => {
    try {
      await addToWatchlist({ movie_id: rec.movie_id, title: rec.title, poster_path: rec.poster_path });
      await loadData();
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
    }
  };

  const handleRate = async (rec: Recommendation, rating: number) => {
    try {
      await upsertRating({ movie_id: rec.movie_id, title: rec.title, rating });
      await loadData();
    } catch (err) {
      console.error("Failed to save rating:", err);
    }
  };

  const handleRemoveFromWatchlist = async (movieId: number) => {
    try {
      await removeFromWatchlist(movieId);
      await loadData();
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col">
      <header className="sticky top-0 z-10 bg-charcoal-950/80 backdrop-blur-md border-b border-charcoal-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">
            <span className="text-amber-400">Flick</span>Vibe
          </h1>
          <nav className="flex gap-1">
            <button
              onClick={() => setTab("vibe")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === "vibe" ? "bg-charcoal-700 text-amber-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Vibe
            </button>
            <button
              onClick={() => setTab("profile")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === "profile" ? "bg-charcoal-700 text-amber-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Profile
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-8">
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        {tab === "vibe" && (
          recommendations ? (
            <RecommendationScreen
              recommendations={recommendations}
              noPicksMessage={noPicksMessage}
              watchlist={watchlist}
              ratings={ratings}
              onAddToWatchlist={handleAddToWatchlist}
              onRate={handleRate}
              onReset={() => { setRecommendations(null); setNoPicksMessage(null); }}
            />
          ) : (
            <VibeScreen
              watchlist={watchlist}
              ratings={ratings}
              loading={loading}
              onRecommend={handleRecommend}
            />
          )
        )}

        {tab === "profile" && (
          <ProfileScreen
            watchlist={watchlist}
            ratings={ratings}
            movieRatingsCache={movieRatingsCache}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
          />
        )}
      </main>

      <footer className="border-t border-charcoal-800 py-3">
        <p className="text-center text-xs text-gray-600">
          FlickVibe — Your next watch, sorted.
        </p>
      </footer>
    </div>
  );
}
