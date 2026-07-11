import { useState, useRef, useCallback } from "react"
import { searchMovies } from "../lib/api"
import type { MovieResult } from "../lib/supabase"
import { MovieCard } from "../components/MovieCard"

interface Props {
  isInWatchlist: (id: number) => boolean
  toggleWatchlist: (movie: MovieResult) => void
  rateMovie: (movie: MovieResult, rating: number) => void
  getRating: (id: number) => number
}

export function SearchScreen({ isInWatchlist, toggleWatchlist, rateMovie, getRating }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MovieResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const movies = await searchMovies(q)
      setResults(movies)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const onInputChange = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(val), 350)
  }

  return (
    <div className="pt-4 animate-fade-in">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Search for a movie..."
          className="input-field pl-11"
          autoFocus
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-gray-500 py-12">No movies found. Try a different search.</p>
      )}

      {!loading && !searched && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Search for movies to add to your watchlist and rate them.</p>
          <p className="text-xs mt-2 text-gray-600">Your ratings power better recommendations.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              inWatchlist={isInWatchlist(movie.id)}
              onToggleWatchlist={() => toggleWatchlist(movie)}
              onRate={(r) => rateMovie(movie, r)}
              userRating={getRating(movie.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
