import type { Recommendation, WatchLink } from "../lib/api";
import type { WatchlistItem, Rating } from "../lib/supabase";
import { TmdbRating } from "../components/TmdbRating";

const TMDB_LOGO_BASE = "https://image.tmdb.org/t/p/w45";

interface Props {
  recommendations: Recommendation[];
  noPicksMessage?: string | null;
  watchlist: WatchlistItem[];
  ratings: Rating[];
  onAddToWatchlist: (rec: Recommendation) => void;
  onRate: (rec: Recommendation, rating: number) => void;
  onReset: () => void;
}

function WatchChips({ links }: { links: WatchLink[] }) {
  const streaming = links.filter((l) => l.type === "streaming");
  const theatre = links.find((l) => l.type === "theatre");

  // No data at all — render nothing; the parent hides the section
  if (streaming.length === 0 && !theatre) return null;

  const visible = streaming.slice(0, 3);
  const overflow = streaming.length - visible.length;
  const justWatchUrl = visible[0]?.url ?? theatre?.url ?? "#";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-charcoal-700 border border-charcoal-600 hover:border-amber-500/40 transition-colors duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {link.logo_path && (
            <img
              src={`${TMDB_LOGO_BASE}${link.logo_path}`}
              alt={link.provider}
              className="w-4 h-4 rounded object-cover"
            />
          )}
          <span className="text-xs text-gray-300">{link.provider}</span>
        </a>
      ))}
      {overflow > 0 && (
        <a
          href={justWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-1"
          onClick={(e) => e.stopPropagation()}
        >
          +{overflow} more
        </a>
      )}
      {theatre && (
        <a
          href={theatre.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 transition-colors duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span className="text-xs text-teal-300">Showtimes</span>
        </a>
      )}
    </div>
  );
}

function MovieCard({
  rec,
  index,
  inWatchlist,
  currentRating,
  onAddToWatchlist,
  onRate,
}: {
  rec: Recommendation;
  index: number;
  inWatchlist: boolean;
  currentRating: number;
  onAddToWatchlist: () => void;
  onRate: (r: number) => void;
}) {
  const posterUrl = rec.poster_path
    ? `https://image.tmdb.org/t/p/w342${rec.poster_path}`
    : null;
  const year = rec.release_date?.split("-")[0] ?? "";
  const hasWatchLinks = rec.watch_links.length > 0;
  const summary = rec.overview?.trim() || "No summary available.";

  return (
    <div
      className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top: poster + header meta */}
      <div className="flex gap-3 p-3 pb-2">
        {/* Poster */}
        <div className="flex-shrink-0 w-16">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={rec.title}
              className="w-16 h-24 object-cover rounded-xl shadow-lg"
            />
          ) : (
            <div className="w-16 h-24 rounded-xl bg-charcoal-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
              </svg>
            </div>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base text-gray-100 leading-tight">{rec.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {year && <span className="text-xs text-gray-500">{year}</span>}
                <TmdbRating voteAverage={rec.vote_average} voteCount={rec.vote_count} />
              </div>
            </div>
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
          </div>

          {/* AI pick reason */}
          <p className="text-xs text-gray-500 italic leading-relaxed mt-1">{rec.explanation}</p>
        </div>
      </div>

      {/* Plot summary — full width below the poster row */}
      <div className="px-3 pb-2">
        <p className="text-xs text-gray-300 leading-relaxed">{summary}</p>
      </div>

      {/* Star rating */}
      <div className="px-3 pb-2 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            className={`text-base transition-all duration-100 active:scale-90 ${
              currentRating >= star ? "text-amber-400" : "text-charcoal-700 hover:text-charcoal-500"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Watch links + save — watch section only rendered when links exist */}
      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        {hasWatchLinks && (
          <div className="flex-1 min-w-0">
            <WatchChips links={rec.watch_links} />
          </div>
        )}
        <button
          onClick={onAddToWatchlist}
          disabled={inWatchlist}
          className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-95 ${
            hasWatchLinks ? "" : "ml-auto"
          } ${
            inWatchlist
              ? "bg-teal-500/15 text-teal-400 border-teal-500/30 cursor-default"
              : "bg-charcoal-700 text-gray-300 border-charcoal-600 hover:bg-charcoal-600 hover:border-amber-500/30"
          }`}
        >
          {inWatchlist ? "✓ Saved" : "+ Save"}
        </button>
      </div>
    </div>
  );
}

export function RecommendationScreen({ recommendations, noPicksMessage, watchlist, ratings, onAddToWatchlist, onRate, onReset }: Props) {
  return (
    <div className="pt-4 animate-fade-in">
      <div className="text-center mb-5">
        <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full mb-2">
          {recommendations.length} Picks for Your Vibe
        </span>
        <p className="text-sm text-gray-500">Save, rate, or jump straight in.</p>
      </div>

      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-charcoal-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 max-w-xs">
            {noPicksMessage ?? "No available picks match your vibe right now — try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <MovieCard
              key={rec.movie_id}
              rec={rec}
              index={i}
              inWatchlist={watchlist.some((w) => w.movie_id === rec.movie_id)}
              currentRating={ratings.find((r) => r.movie_id === rec.movie_id)?.rating ?? 0}
              onAddToWatchlist={() => onAddToWatchlist(rec)}
              onRate={(r) => onRate(rec, r)}
            />
          ))}
        </div>
      )}

      <button
        onClick={onReset}
        className="mt-5 w-full py-3 rounded-xl font-medium text-sm bg-charcoal-800 text-gray-300 border border-charcoal-700 hover:bg-charcoal-700 transition-all duration-200 active:scale-95"
      >
        Try a different vibe
      </button>
    </div>
  );
}
