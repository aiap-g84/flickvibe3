import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY") ?? "";
const TMDB_BASE = "https://api.themoviedb.org/3";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const OMDB_API_KEY = Deno.env.get("OMDB_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MOOD_GENRES: Record<string, number[]> = {
  cozy: [35, 18, 10751],
  thrilled: [28, 53],
  "mind-bent": [878, 53, 9648],
  romantic: [10749, 18, 35],
  scared: [27, 53],
  happy: [35, 16, 10751],
  adventurous: [12, 28, 14],
  nostalgic: [18, 10402, 35],
};

interface WatchlistEntry { movie_id: number; title: string }
interface RatingEntry { movie_id: number; title: string; rating: number }
interface RecommendRequest {
  mood: string; time: string; location: string; era_preference: string;
  watchlist: WatchlistEntry[]; ratings: RatingEntry[];
}

interface EraFilter {
  gte?: string;
  lte?: string;
  label: string;
  geminiHint: string;
}

interface WatchData {
  hasProviders: boolean;
  links: { provider: string; url: string; logo_path: string | null; type: string }[];
}

function getEraFilter(era: string): EraFilter {
  const now = new Date();
  const year = now.getFullYear();

  const normalized = (era ?? "").toLowerCase().trim();
  if (normalized.includes("latest") || normalized.includes("new")) {
    return {
      gte: `${year - 2}-01-01`,
      label: "latest",
      geminiHint: `Prefer films released in ${year - 1} or ${year}. Choose very recent releases.`,
    };
  }
  if (normalized.includes("recent") || normalized.includes("last 5")) {
    return {
      gte: `${year - 5}-01-01`,
      label: "recent",
      geminiHint: `Prefer films released within the last 5 years (${year - 5}–${year}).`,
    };
  }
  if (normalized.includes("classic")) {
    return {
      lte: "2000-01-01",
      label: "classic",
      geminiHint: "Prefer films released before the year 2000. Classic cinema only.",
    };
  }
  return { label: "any", geminiHint: "" };
}

async function tmdbDiscover(mood: string, eraFilter: EraFilter, count: number): Promise<any[]> {
  const lowerMood = mood.toLowerCase().trim();
  const genreIds = MOOD_GENRES[lowerMood] ?? [28, 18];
  const withGenres = genreIds.slice(0, 2).join(",");

  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    with_genres: withGenres,
    sort_by: "popularity.desc",
    "vote_count.gte": "500",
    "vote_average.gte": "6.0",
    include_adult: "false",
    page: "1",
  });
  if (eraFilter.gte) params.set("primary_release_date.gte", eraFilter.gte);
  if (eraFilter.lte) params.set("primary_release_date.lte", eraFilter.lte);

  const res = await fetch(`${TMDB_BASE}/discover/movie?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.results ?? []) as any[]).filter((r: any) => r.poster_path).slice(0, count);
}

// Maps TMDB provider_name (normalized to lower-case) to a direct search URL builder.
const PROVIDER_URL_MAP: Record<string, (encodedTitle: string) => string> = {
  "netflix":                   (t) => `https://www.netflix.com/search?q=${t}`,
  "amazon prime video":        (t) => `https://www.amazon.com/gp/video/search?phrase=${t}`,
  "prime video":               (t) => `https://www.amazon.com/gp/video/search?phrase=${t}`,
  "disney plus":               (t) => `https://www.disneyplus.com/search?q=${t}`,
  "disney+":                   (t) => `https://www.disneyplus.com/search?q=${t}`,
  "hulu":                      (t) => `https://www.hulu.com/search?q=${t}`,
  "apple tv+":                 (t) => `https://tv.apple.com/search?term=${t}`,
  "apple tv plus":             (t) => `https://tv.apple.com/search?term=${t}`,
  "max":                       (t) => `https://www.max.com/search?q=${t}`,
  "hbo max":                   (t) => `https://www.max.com/search?q=${t}`,
  "peacock":                   (t) => `https://www.peacocktv.com/search?q=${t}`,
  "peacock premium":           (t) => `https://www.peacocktv.com/search?q=${t}`,
  "paramount plus":            (t) => `https://www.paramountplus.com/search/?q=${t}`,
  "paramount+":                (t) => `https://www.paramountplus.com/search/?q=${t}`,
  "starz":                     (t) => `https://www.starz.com/search?q=${t}`,
  "showtime":                  (t) => `https://www.sho.com/search?q=${t}`,
  "mgm plus":                  (t) => `https://www.mgmplus.com/search?q=${t}`,
  "tubi tv":                   (t) => `https://tubitv.com/search/${t}`,
  "tubi":                      (t) => `https://tubitv.com/search/${t}`,
  "fubotv":                    (t) => `https://www.fubo.tv/stream/search?q=${t}`,
  "fubo":                      (t) => `https://www.fubo.tv/stream/search?q=${t}`,
  "amc+":                      (t) => `https://www.amcplus.com/search?q=${t}`,
  "mubi":                      (t) => `https://mubi.com/search/${t}`,
  "crunchyroll":               (t) => `https://www.crunchyroll.com/search?q=${t}`,
  "shudder":                   (t) => `https://www.shudder.com/search?q=${t}`,
  "criterion channel":         (t) => `https://www.criterionchannel.com/search?q=${t}`,
  "starz apple tv channel":    (t) => `https://tv.apple.com/search?term=${t}`,
};

function providerUrl(providerName: string, movieTitle: string): string {
  const key = providerName.toLowerCase().trim();
  const encoded = encodeURIComponent(movieTitle);
  const builder = PROVIDER_URL_MAP[key];
  if (builder) return builder(encoded);
  return `https://www.google.com/search?q=${encodeURIComponent(movieTitle + " " + providerName + " streaming")}`;
}

// Fetches watch provider data for a movie and returns both the availability flag
// and the card-display links. The hasProviders flag considers ALL provider types
// (streaming, rent, buy, theatre) so movies unavailable on any platform are excluded.
async function fetchWatchData(movie: any): Promise<WatchData> {
  const res = await fetch(`${TMDB_BASE}/movie/${movie.id}/watch/providers?api_key=${TMDB_API_KEY}`);
  if (!res.ok) return { hasProviders: false, links: [] };

  const data = await res.json();
  const usData = data.results?.US;

  const flatrate: any[] = usData?.flatrate ?? [];
  const rent: any[] = usData?.rent ?? [];
  const buy: any[] = usData?.buy ?? [];

  const releaseDate = movie.release_date ? new Date(movie.release_date) : null;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const isInTheatres = !!(releaseDate && releaseDate > ninetyDaysAgo);

  // Any provider type counts toward availability
  const hasProviders = flatrate.length > 0 || rent.length > 0 || buy.length > 0 || isInTheatres;

  // Card links: up to 5 streaming chips + theatre button
  const links: WatchData["links"] = flatrate.slice(0, 5).map((p: any) => ({
    provider: p.provider_name,
    url: providerUrl(p.provider_name, movie.title),
    logo_path: p.logo_path ?? null,
    type: "streaming",
  }));

  if (isInTheatres) {
    links.push({
      provider: "Find nearby showtimes",
      url: `https://www.google.com/search?q=showtimes+${encodeURIComponent(movie.title)}+near+me`,
      logo_path: null,
      type: "theatre",
    });
  }

  return { hasProviders, links };
}

// Returns the TMDB overview, falling back to OMDB Plot if TMDB's is empty
// and OMDB_API_KEY is configured.
async function getOverview(movie: any): Promise<string> {
  if (movie.overview?.trim()) return movie.overview.trim();
  if (!OMDB_API_KEY) return "";
  const year = movie.release_date?.split("-")[0] ?? "";
  const params = new URLSearchParams({ t: movie.title, apikey: OMDB_API_KEY });
  if (year) params.set("y", year);
  try {
    const res = await fetch(`https://www.omdbapi.com/?${params}`);
    if (!res.ok) return "";
    const data = await res.json();
    if (data.Plot && data.Plot !== "N/A") return data.Plot;
  } catch { /* ignore */ }
  return "";
}

function parseGeminiArray(content: string): { title: string; explanation: string }[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
  } catch { /* fall through */ }

  const match = content.match(/\[[\s\S]*?\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  return [];
}

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RecommendRequest = await req.json();
    const { mood, time, location, era_preference, watchlist, ratings } = body;

    if (!mood && !time && !location) {
      return new Response(
        JSON.stringify({ error: "Please describe your mood, time, or location." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const eraFilter = getEraFilter(era_preference ?? "");

    const loved = ratings.filter((r) => r.rating >= 4).map((r) => r.title);
    const liked = ratings.filter((r) => r.rating === 3).map((r) => r.title);
    const disliked = ratings.filter((r) => r.rating <= 2).map((r) => r.title);
    const watchlistTitles = watchlist.map((w) => w.title);

    const tasteProfile = [
      loved.length > 0 ? `Loved: ${loved.join(", ")}` : "",
      liked.length > 0 ? `Liked: ${liked.join(", ")}` : "",
      disliked.length > 0 ? `Disliked: ${disliked.join(", ")}` : "",
      watchlistTitles.length > 0 ? `Wants to watch: ${watchlistTitles.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const eraInstructions = eraFilter.geminiHint
      ? `\n- Era preference: ${era_preference}. ${eraFilter.geminiHint}`
      : "";

    const eraPhrase =
      eraFilter.label === "latest" ? "Since you wanted something recent, "
      : eraFilter.label === "recent" ? "Since you wanted a film from the last few years, "
      : eraFilter.label === "classic" ? "Since you wanted a classic, "
      : "";

    // ── Step 1: Fetch a candidate pool and check watch availability ──────────
    const rawCandidates = await tmdbDiscover(mood, eraFilter, 25);

    const candidateResults = await Promise.allSettled(
      rawCandidates.map(async (movie) => {
        const watchData = await fetchWatchData(movie);
        return { movie, watchData };
      }),
    );

    // Only keep movies with confirmed watch-provider data in the user's region
    const validCandidates = candidateResults
      .filter((r): r is PromiseFulfilledResult<{ movie: any; watchData: WatchData }> =>
        r.status === "fulfilled" && r.value.watchData.hasProviders,
      )
      .map((r) => r.value);

    // ── Step 2: No valid candidates ──────────────────────────────────────────
    if (validCandidates.length === 0) {
      return new Response(
        JSON.stringify({
          recommendations: [],
          noPicksMessage: "No available picks match your vibe right now — try adjusting your filters.",
        }),
        { headers: jsonHeaders },
      );
    }

    // ── Step 3: Gemini curates picks from the validated pool ─────────────────
    const geminiPool = validCandidates.slice(0, 15);
    let pickedCandidates: ({ movie: any; watchData: WatchData; explanation: string })[] = [];

    if (GEMINI_API_KEY && geminiPool.length > 0) {
      const candidateList = geminiPool
        .map((c, i) =>
          `${i + 1}. "${c.movie.title}" (${c.movie.release_date?.split("-")[0] ?? "?"}) — ${c.movie.vote_average?.toFixed(1) ?? "?"}/10`,
        )
        .join("\n");

      const prompt = `You are a movie recommendation expert. From the following list of currently available movies, choose up to 5 that best match the user's mood and taste. You MUST only select titles from the provided list — do not invent or substitute other movies.

Available movies:
${candidateList}

User's situation:
- Mood: ${mood || "unspecified"}
- Available time: ${time || "unspecified"}
- Location: ${location || "unspecified"}${eraInstructions}

User's taste profile:
${tasteProfile || "No ratings yet — recommend broadly popular picks."}

Return a JSON array of up to 5 objects. Use titles EXACTLY as they appear in the list above. Vary picks across different tones and styles. ${eraPhrase ? `Start each explanation with "${eraPhrase.trim()}" when relevant.` : ""} Each explanation is 1-2 sentences:
[{"title": "Exact Movie Title", "explanation": "Why this fits."}, ...]`;

      const geminiRes = await fetch(`${GEMINI_BASE}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
          },
        }),
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (content) {
          const aiPicks = parseGeminiArray(content);
          const matchedIds = new Set<number>();
          for (const pick of aiPicks) {
            if (pickedCandidates.length >= 5) break;
            const candidate = geminiPool.find(
              (c) => c.movie.title.toLowerCase() === pick.title.toLowerCase() && !matchedIds.has(c.movie.id),
            );
            if (candidate) {
              pickedCandidates.push({ ...candidate, explanation: pick.explanation });
              matchedIds.add(candidate.movie.id);
            }
          }
        }
      }
    }

    // ── Step 4: Fill remaining slots from valid candidates (no AI key or < 5 matched) ──
    const existingIds = new Set(pickedCandidates.map((p) => p.movie.id));
    for (const vc of validCandidates) {
      if (pickedCandidates.length >= 5) break;
      if (!existingIds.has(vc.movie.id)) {
        pickedCandidates.push({
          ...vc,
          explanation: `${eraPhrase}a top-rated pick that matches your ${mood || "vibe"}.`,
        });
        existingIds.add(vc.movie.id);
      }
    }

    // ── Step 5: Enrich with overviews and return ─────────────────────────────
    const recommendations = await Promise.all(
      pickedCandidates.map(async (picked) => {
        const overview = await getOverview(picked.movie);
        return {
          movie_id: picked.movie.id,
          title: picked.movie.title,
          poster_path: picked.movie.poster_path,
          release_date: picked.movie.release_date,
          overview,
          vote_average: picked.movie.vote_average ?? null,
          vote_count: picked.movie.vote_count ?? null,
          explanation: picked.explanation,
          watch_links: picked.watchData.links,
        };
      }),
    );

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: jsonHeaders },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
