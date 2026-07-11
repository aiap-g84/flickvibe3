/*
# Create FlickVibe schema (single-tenant, no auth)

## Overview
Creates tables for storing a user's movie watchlist and ratings. Since this is a no-auth MVP,
all data is shared/public (single anonymous user per device), so policies use `TO anon, authenticated`.

## New Tables

### watchlist
- `id` (uuid, primary key)
- `movie_id` (integer, TMDB movie ID, not null)
- `title` (text, not null)
- `poster_path` (text, nullable — TMDB poster path)
- `release_date` (text, nullable)
- `overview` (text, nullable)
- `created_at` (timestamptz, default now())

### ratings
- `id` (uuid, primary key)
- `movie_id` (integer, TMDB movie ID, not null)
- `title` (text, not null)
- `poster_path` (text, nullable)
- `rating` (integer, 1-5, not null)
- `created_at` (timestamptz, default now())
- Unique constraint on movie_id to prevent duplicate ratings per movie

## Security
- RLS enabled on both tables.
- All CRUD policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because the data is intentionally public/shared in this no-auth single-tenant app.
*/

CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer NOT NULL,
  title text NOT NULL,
  poster_path text,
  release_date text,
  overview text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer NOT NULL,
  title text NOT NULL,
  poster_path text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE (movie_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_movie_id ON watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Watchlist policies
DROP POLICY IF EXISTS "anon_select_watchlist" ON watchlist;
CREATE POLICY "anon_select_watchlist" ON watchlist FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_watchlist" ON watchlist;
CREATE POLICY "anon_insert_watchlist" ON watchlist FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_watchlist" ON watchlist;
CREATE POLICY "anon_update_watchlist" ON watchlist FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_watchlist" ON watchlist;
CREATE POLICY "anon_delete_watchlist" ON watchlist FOR DELETE
  TO anon, authenticated USING (true);

-- Ratings policies
DROP POLICY IF EXISTS "anon_select_ratings" ON ratings;
CREATE POLICY "anon_select_ratings" ON ratings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ratings" ON ratings;
CREATE POLICY "anon_insert_ratings" ON ratings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ratings" ON ratings;
CREATE POLICY "anon_update_ratings" ON ratings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ratings" ON ratings;
CREATE POLICY "anon_delete_ratings" ON ratings FOR DELETE
  TO anon, authenticated USING (true);
