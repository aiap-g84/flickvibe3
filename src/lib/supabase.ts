import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mutationsHeaders: HeadersInit = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${supabaseAnonKey}`,
  apikey: supabaseAnonKey,
};

async function callMutation(body: object): Promise<void> {
  const res = await fetch(`${supabaseUrl}/functions/v1/mutations`, {
    method: "POST",
    headers: mutationsHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: "Unexpected response" }));
  if (!res.ok || data.error) throw new Error(data.error ?? "Mutation failed");
}

export interface MovieResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
}

export interface WatchlistItem {
  id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  rating: number;
  created_at: string;
}

export interface MovieRatingCache {
  movie_id: number;
  vote_average: number | null;
  vote_count: number | null;
  updated_at: string;
}

// ── Reads (anon SELECT policy) ───────────────────────────────────────────────

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRatings(): Promise<Rating[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRatingsCache(movieIds: number[]): Promise<MovieRatingCache[]> {
  if (movieIds.length === 0) return [];
  const { data, error } = await supabase
    .from("movie_ratings_cache")
    .select("*")
    .in("movie_id", movieIds);
  if (error) throw error;
  return data ?? [];
}

// ── Writes (routed through mutations edge function, service_role key) ─────────

export async function addToWatchlist(movie: {
  movie_id: number;
  title: string;
  poster_path: string | null;
}): Promise<void> {
  await callMutation({ action: "add_watchlist", ...movie });
}

export async function removeFromWatchlist(movieId: number): Promise<void> {
  await callMutation({ action: "remove_watchlist", movie_id: movieId });
}

export async function upsertRating(movie: {
  movie_id: number;
  title: string;
  rating: number;
}): Promise<void> {
  await callMutation({ action: "upsert_rating", ...movie });
}

export async function upsertRatingsCache(
  entries: { movie_id: number; vote_average: number | null; vote_count: number | null }[],
): Promise<void> {
  await callMutation({ action: "upsert_ratings_cache", entries });
}
