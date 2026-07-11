import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { audio, mimeType } = await req.json();

    console.log("[STT-EDGE] Request received:", {
      hasAudio: !!audio,
      audioLength: audio?.length ?? 0,
      mimeType,
    });

    if (!audio || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing audio data or mimeType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Speech-to-text not configured (missing GEMINI_API_KEY)" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[STT-EDGE] Calling Gemini at:", GEMINI_BASE);

    const prompt = `You are a voice input parser for a movie recommendation app.

Listen to this audio and do two things:
1. Transcribe exactly what was said
2. Extract these three fields:
   - mood: the mood, genre, or feeling (e.g. "cozy", "thrilled", "romantic", "horror") — use the full transcript verbatim if nothing specific can be extracted
   - time_available: how much time they have (e.g. "2 hours", "90 minutes", "all night") — use "tonight" if not mentioned
   - location: where they are watching (e.g. "home", "in bed", "on a trip") — use null if not mentioned

Return ONLY valid JSON with exactly these 4 keys, no markdown, no explanation:
{"raw_transcript": "...", "mood": "...", "time_available": "...", "location": "...or null"}`;

    const geminiBody = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: audio } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
      },
    };

    const geminiRes = await fetch(`${GEMINI_BASE}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    console.log("[STT-EDGE] Gemini response status:", geminiRes.status);

    const geminiRawText = await geminiRes.text();
    console.log("[STT-EDGE] Gemini raw response (first 600 chars):", geminiRawText.slice(0, 600));

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiRes.status}`, detail: geminiRawText.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let geminiData: any;
    try {
      geminiData = JSON.parse(geminiRawText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid response from Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("[STT-EDGE] Raw content from Gemini:", rawContent);

    // Parse the structured JSON Gemini returned
    let parsed: { raw_transcript: string; mood: string; time_available: string; location: string | null };
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
      console.log("[STT-EDGE] Parsed fields:", JSON.stringify(parsed));
    } catch {
      // Fallback: treat entire content as raw transcript, put it in mood
      console.warn("[STT-EDGE] JSON parse failed, falling back to raw transcript in mood");
      const fallback = rawContent.trim();
      parsed = {
        raw_transcript: fallback,
        mood: fallback,
        time_available: "tonight",
        location: null,
      };
    }

    return new Response(
      JSON.stringify({
        raw_transcript: parsed.raw_transcript ?? "",
        mood: parsed.mood ?? parsed.raw_transcript ?? "",
        time_available: parsed.time_available ?? "tonight",
        location: parsed.location ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[STT-EDGE] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
