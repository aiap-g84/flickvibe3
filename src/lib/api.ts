const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const headers: HeadersInit = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};

export interface WatchLink {
  provider: string;
  url: string;
  logo_path?: string | null;
  type: "streaming" | "theatre";
}

export interface Recommendation {
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number | null;
  vote_count: number | null;
  explanation: string;
  watch_links: WatchLink[];
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  noPicksMessage?: string;
}

export async function getRecommendation(
  mood: string,
  time: string,
  location: string,
  era: string,
  watchlist: { movie_id: number; title: string }[],
  ratings: { movie_id: number; title: string; rating: number }[],
): Promise<RecommendationResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/recommend`, {
    method: "POST",
    headers,
    body: JSON.stringify({ mood, time, location, era_preference: era, watchlist, ratings }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Recommendation failed" }));
    throw new Error(err.error || "Recommendation failed");
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  // Support both legacy array response and new object response
  if (Array.isArray(data)) return { recommendations: data };
  return { recommendations: data.recommendations ?? [], noPicksMessage: data.noPicksMessage };
}

export async function fetchTmdbMovieRating(
  movieId: number,
): Promise<{ movie_id: number; vote_average: number | null; vote_count: number | null } | null> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/movie-search?movie_id=${movieId}`,
    { headers },
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.id) return null;
  return {
    movie_id: data.id,
    vote_average: data.vote_average ?? null,
    vote_count: data.vote_count ?? null,
  };
}
