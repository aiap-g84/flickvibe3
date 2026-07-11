CREATE TABLE IF NOT EXISTS movie_ratings_cache (
  movie_id integer PRIMARY KEY,
  vote_average numeric(3,1),
  vote_count integer,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE movie_ratings_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_movie_ratings_cache" ON movie_ratings_cache FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_movie_ratings_cache" ON movie_ratings_cache FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_movie_ratings_cache" ON movie_ratings_cache FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_movie_ratings_cache" ON movie_ratings_cache FOR DELETE
  TO anon, authenticated USING (true);
