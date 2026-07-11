import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Uses service_role key so writes bypass RLS — the anon client has no direct write access.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type Action =
  | { action: "add_watchlist"; movie_id: number; title: string; poster_path: string | null }
  | { action: "remove_watchlist"; movie_id: number }
  | { action: "upsert_rating"; movie_id: number; title: string; rating: number }
  | { action: "upsert_ratings_cache"; entries: { movie_id: number; vote_average: number | null; vote_count: number | null }[] };

function isValidMovieId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Action;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    switch (body.action) {
      case "add_watchlist": {
        if (!isValidMovieId(body.movie_id) || typeof body.title !== "string" || !body.title.trim()) {
          return new Response(JSON.stringify({ error: "Invalid payload" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await supabase.from("watchlist").insert({
          movie_id: body.movie_id,
          title: body.title.trim().slice(0, 500),
          poster_path: typeof body.poster_path === "string" ? body.poster_path : null,
        });
        if (error) throw error;
        break;
      }

      case "remove_watchlist": {
        if (!isValidMovieId(body.movie_id)) {
          return new Response(JSON.stringify({ error: "Invalid payload" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await supabase.from("watchlist").delete().eq("movie_id", body.movie_id);
        if (error) throw error;
        break;
      }

      case "upsert_rating": {
        if (!isValidMovieId(body.movie_id) || typeof body.title !== "string" || !body.title.trim()) {
          return new Response(JSON.stringify({ error: "Invalid payload" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
          return new Response(JSON.stringify({ error: "Rating must be integer 1–5" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await supabase.from("ratings").upsert(
          { movie_id: body.movie_id, title: body.title.trim().slice(0, 500), rating: body.rating },
          { onConflict: "movie_id" },
        );
        if (error) throw error;
        break;
      }

      case "upsert_ratings_cache": {
        if (!Array.isArray(body.entries) || body.entries.length === 0) break;
        const rows = body.entries
          .filter((e) => isValidMovieId(e.movie_id))
          .map((e) => ({
            movie_id: e.movie_id,
            vote_average: typeof e.vote_average === "number" ? e.vote_average : null,
            vote_count: typeof e.vote_count === "number" ? e.vote_count : null,
            updated_at: new Date().toISOString(),
          }));
        if (rows.length > 0) {
          const { error } = await supabase.from("movie_ratings_cache").upsert(rows, { onConflict: "movie_id" });
          if (error) throw error;
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
