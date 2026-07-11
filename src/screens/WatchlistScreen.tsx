import type { WatchlistItem, Rating } from "../lib/supabase"
import { posterUrl } from "../lib/tmdb"
import { StarRating } from "../components/StarRating"

interface Props {
  watchlist: WatchlistItem[]
  ratings: Rating[]
  onRemove: (movie: WatchlistItem) => void
  onRate: (movie: WatchlistItem, rating: number) => void
}

export function WatchlistScreen({ watchlist, ratings, onRemove, onRate }: Props) {
  const getRating = (movieId: number) =>
    ratings.find((r) => r.movie_id === movieId)?.rating ?? 0

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 animate-fade-in">
        <svg className="w-12 h-12 mx-auto mb-3 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p className="text-sm">Your watchlist is empty.</p>
        <p className="text-xs mt-1 text-gray-600">Search for movies and save them here.</p>
      </div>
    )
  }

  return (
    <div className="pt-4 animate-fade-in">
      <h2 className="text-sm font-medium text-gray-400 mb-3">My Watchlist</h2>
      <div className="space-y-3">
        {watchlist.map((item) => (
          <div key={item.id} className="card flex gap-3 p-3 animate-slide-up">
            <img
              src={posterUrl(item.poster_path, "w200")}
              alt={item.title}
              className="w-20 rounded-lg object-cover flex-shrink-0 bg-charcoal-800"
              style={{ height: "120px" }}
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-tight">{item.title}</h3>
                <button
                  onClick={() => onRemove(item)}
                  className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {item.release_date && (
                <span className="text-xs text-gray-500">{item.release_date.split("-")[0]}</span>
              )}
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {item.overview || "No description."}
              </p>
              <div className="mt-2">
                <span className="text-xs text-gray-500 mr-2">Rate:</span>
                <StarRating value={getRating(item.movie_id)} onChange={(r) => onRate(item, r)} size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {ratings.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-gray-400 mt-6 mb-3">Rated Movies</h2>
          <div className="space-y-2">
            {ratings.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-charcoal-900 rounded-xl p-2.5 border border-charcoal-800">
                <img
                  src={posterUrl(r.poster_path, "w200")}
                  alt={r.title}
                  className="w-10 h-14 rounded object-cover flex-shrink-0 bg-charcoal-800"
                  loading="lazy"
                />
                <span className="text-sm flex-1 truncate">{r.title}</span>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-sm font-bold">{r.rating}</span>
                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
