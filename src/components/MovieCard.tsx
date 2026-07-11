import type { MovieResult } from "../lib/supabase"
import { posterUrl } from "../lib/tmdb"
import { StarRating } from "./StarRating"

interface Props {
  movie: MovieResult
  inWatchlist: boolean
  onToggleWatchlist: () => void
  onRate: (rating: number) => void
  userRating: number
}

export function MovieCard({ movie, inWatchlist, onToggleWatchlist, onRate, userRating }: Props) {
  const year = movie.release_date ? movie.release_date.split("-")[0] : ""
  const overview = movie.overview
    ? movie.overview.length > 150
      ? movie.overview.slice(0, 150) + "..."
      : movie.overview
    : "No description available."

  return (
    <div className="card flex gap-3 p-3 animate-slide-up">
      <img
        src={posterUrl(movie.poster_path, "w200")}
        alt={movie.title}
        className="w-20 h-30 rounded-lg object-cover flex-shrink-0 bg-charcoal-800"
        style={{ height: "120px" }}
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight">{movie.title}</h3>
          {year && <span className="text-xs text-gray-500 flex-shrink-0">{year}</span>}
        </div>
        <p className="text-xs text-gray-400 mt-1 line-clamp-3">{overview}</p>
        <div className="flex items-center justify-between mt-2">
          <StarRating value={userRating} onChange={onRate} size="sm" />
          <button
            onClick={onToggleWatchlist}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95 ${
              inWatchlist
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "bg-charcoal-700 text-gray-300 border border-charcoal-600 hover:bg-charcoal-600"
            }`}
          >
            {inWatchlist ? "✓ Saved" : "+ Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
