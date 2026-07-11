import type { WatchlistItem, Rating, MovieRatingCache } from "../lib/supabase";
import { TmdbRating } from "../components/TmdbRating";

interface Props {
  watchlist: WatchlistItem[];
  ratings: Rating[];
  movieRatingsCache: Map<number, MovieRatingCache>;
  onRemoveFromWatchlist: (movieId: number) => void;
}

export function ProfileScreen({ watchlist, ratings, movieRatingsCache, onRemoveFromWatchlist }: Props) {
  const loved = ratings.filter((r) => r.rating >= 4);
  const liked = ratings.filter((r) => r.rating === 3);
  const disliked = ratings.filter((r) => r.rating <= 2);

  return (
    <div className="pt-4 animate-fade-in">
      <h2 className="font-display text-2xl font-bold mb-4">Your Taste Profile</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{ratings.length}</p>
          <p className="text-xs text-gray-500 mt-1">Rated</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-teal-400">{watchlist.length}</p>
          <p className="text-xs text-gray-500 mt-1">Watchlist</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-gray-300">{loved.length}</p>
          <p className="text-xs text-gray-500 mt-1">Loved</p>
        </div>
      </div>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Watchlist</h3>
          <div className="space-y-2">
            {watchlist.map((item) => {
              const cached = movieRatingsCache.get(item.movie_id);
              const personalRating = ratings.find((r) => r.movie_id === item.movie_id)?.rating;
              return (
                <div key={item.id} className="flex items-center gap-3 bg-charcoal-900 border border-charcoal-800 rounded-xl p-2">
                  {item.poster_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                      alt={item.title}
                      className="w-10 h-14 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <TmdbRating
                        voteAverage={cached?.vote_average}
                        voteCount={cached?.vote_count}
                      />
                      {personalRating && (
                        <span className="text-xs text-amber-400">
                          {"★".repeat(personalRating)}{"☆".repeat(5 - personalRating)} <span className="text-gray-600">yours</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveFromWatchlist(item.movie_id)}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loved */}
      {loved.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-amber-400 mb-2 uppercase tracking-wide">Loved ★★★★+</h3>
          <div className="flex flex-wrap gap-2">
            {loved.map((r) => (
              <span key={r.id} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                {r.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Liked */}
      {liked.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-teal-400 mb-2 uppercase tracking-wide">Liked ★★★</h3>
          <div className="flex flex-wrap gap-2">
            {liked.map((r) => (
              <span key={r.id} className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300">
                {r.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disliked */}
      {disliked.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Not for me ★★-</h3>
          <div className="flex flex-wrap gap-2">
            {disliked.map((r) => (
              <span key={r.id} className="text-xs px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-gray-400">
                {r.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {ratings.length === 0 && watchlist.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No ratings or watchlist yet.</p>
          <p className="text-gray-600 text-xs mt-1">Get a recommendation and rate it to build your profile.</p>
        </div>
      )}
    </div>
  );
}
