import type { Recommendation, WatchLink } from "../lib/api"
import type { MovieResult } from "../lib/supabase"
import { posterUrl } from "../lib/tmdb"
import { StarRating } from "../components/StarRating"

interface Props {
  recommendation: Recommendation
  onClose: () => void
  isInWatchlist: (id: number) => boolean
  toggleWatchlist: (movie: MovieResult) => void
  rateMovie: (movie: MovieResult, rating: number) => void
  getRating: (id: number) => number
}

export function ResultScreen({
  recommendation,
  onClose,
  isInWatchlist,
  toggleWatchlist,
  rateMovie,
  getRating,
}: Props) {
  const rec = recommendation
  const year = rec.release_date ? rec.release_date.split("-")[0] : ""
  const movieLike: MovieResult = {
    id: rec.movie_id,
    title: rec.title,
    poster_path: rec.poster_path,
    release_date: rec.release_date,
    overview: rec.overview,
  }

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-950/95 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="max-w-md mx-auto min-h-full flex flex-col px-4 py-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="self-end text-gray-500 hover:text-gray-300 transition-colors mb-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Confidence badge */}
        <div className="text-center mb-4 animate-slide-up">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
            Your Pick
          </span>
        </div>

        {/* Poster */}
        <div className="flex justify-center mb-4 animate-scale-in">
          <img
            src={posterUrl(rec.poster_path, "w500")}
            alt={rec.title}
            className="rounded-2xl shadow-2xl object-cover"
            style={{ maxHeight: "400px" }}
          />
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl font-bold text-center mb-1 animate-slide-up">
          {rec.title}
        </h2>
        {year && <p className="text-sm text-gray-500 text-center mb-3">{year}</p>}

        {/* AI Explanation */}
        <div className="bg-charcoal-900 rounded-xl p-4 mb-4 border border-charcoal-700 animate-slide-up">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm text-gray-300 leading-relaxed">{rec.explanation}</p>
          </div>
        </div>

        {/* Overview */}
        {rec.overview && (
          <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-4">{rec.overview}</p>
        )}

        {/* Actions: save + rate */}
        <div className="flex items-center justify-between mb-6 bg-charcoal-900 rounded-xl p-3 border border-charcoal-800">
          <StarRating
            value={getRating(rec.movie_id)}
            onChange={(r) => rateMovie(movieLike, r)}
            size="md"
          />
          <button
            onClick={() => toggleWatchlist(movieLike)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${
              isInWatchlist(rec.movie_id)
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "bg-charcoal-700 text-gray-300 border border-charcoal-600 hover:bg-charcoal-600"
            }`}
          >
            {isInWatchlist(rec.movie_id) ? "✓ In Watchlist" : "+ Save"}
          </button>
        </div>

        {/* Watch Now */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Watch Now</h3>
          <div className="space-y-2">
            {rec.watch_links.map((link: WatchLink, i: number) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
                  link.provider.includes("theatre")
                    ? "bg-charcoal-800 text-teal-400 border border-teal-500/30 hover:bg-charcoal-700"
                    : "bg-charcoal-800 text-gray-200 border border-charcoal-700 hover:bg-charcoal-700 hover:border-amber-500/30"
                }`}
              >
                <span className="text-sm font-medium">{link.provider}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Try again */}
        <button onClick={onClose} className="btn-secondary w-full">
          Try a different vibe
        </button>
      </div>
    </div>
  )
}
