-- Remove unrestricted anon write policies from all three tables.
-- Writes now go through the mutations edge function (service_role key),
-- so no direct INSERT/UPDATE/DELETE from the anon client is needed.

-- watchlist
DROP POLICY IF EXISTS "anon_insert_watchlist" ON watchlist;
DROP POLICY IF EXISTS "anon_update_watchlist" ON watchlist;
DROP POLICY IF EXISTS "anon_delete_watchlist" ON watchlist;

-- ratings
DROP POLICY IF EXISTS "anon_insert_ratings" ON ratings;
DROP POLICY IF EXISTS "anon_update_ratings" ON ratings;
DROP POLICY IF EXISTS "anon_delete_ratings" ON ratings;

-- movie_ratings_cache
DROP POLICY IF EXISTS "anon_insert_movie_ratings_cache" ON movie_ratings_cache;
DROP POLICY IF EXISTS "anon_update_movie_ratings_cache" ON movie_ratings_cache;
DROP POLICY IF EXISTS "anon_delete_movie_ratings_cache" ON movie_ratings_cache;
