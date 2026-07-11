import { useState } from "react";
import type { WatchlistItem, Rating } from "../lib/supabase";

interface Props {
  watchlist: WatchlistItem[];
  ratings: Rating[];
  loading: boolean;
  onRecommend: (mood: string, time: string, location: string, era: string) => void;
}

const MOOD_PRESETS = ["Cozy", "Thrilled", "Mind-bent", "Romantic", "Scared", "Happy", "Adventurous", "Nostalgic"];
const TIME_PRESETS = ["~90 min", "2 hours", "All night", "Quick watch"];
const LOCATION_PRESETS = ["At home on the couch", "In bed", "Out with friends", "On a trip"];
const ERA_PRESETS = ["Latest releases", "Recent (last 5 years)", "Classic", "No preference"];

export function VibeScreen({ watchlist, ratings, loading, onRecommend }: Props) {
  const [mood, setMood] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [era, setEra] = useState("No preference");

  const canRecommend = (mood || time || location).trim().length > 0;
  const tasteCount = ratings.length + watchlist.length;

  return (
    <div className="pt-4 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold mb-1">What's your vibe?</h2>
        <p className="text-sm text-gray-500">Tell me your mood, time, and setting. I'll pick one movie — the right one.</p>
      </div>

      {/* Mood */}
      <div className="mb-5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Mood</label>
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="How are you feeling?"
          className="input-field mt-2"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {MOOD_PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m.toLowerCase())}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 active:scale-95 ${
                mood === m.toLowerCase()
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-charcoal-800 text-gray-400 border-charcoal-700 hover:border-charcoal-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="mb-5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Available Time</label>
        <input
          type="text"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="How much time do you have?"
          className="input-field mt-2"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {TIME_PRESETS.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 active:scale-95 ${
                time === t
                  ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                  : "bg-charcoal-800 text-gray-400 border-charcoal-700 hover:border-charcoal-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="mb-5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Where are you watching?"
          className="input-field mt-2"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {LOCATION_PRESETS.map((l) => (
            <button
              key={l}
              onClick={() => setLocation(l)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 active:scale-95 ${
                location === l
                  ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                  : "bg-charcoal-800 text-gray-400 border-charcoal-700 hover:border-charcoal-500"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Era */}
      <div className="mb-6">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Era</label>
        <input
          type="text"
          value={era === "No preference" ? "" : era}
          onChange={(e) => setEra(e.target.value || "No preference")}
          placeholder="Latest or old movie?"
          className="input-field mt-2"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {ERA_PRESETS.map((e_) => (
            <button
              key={e_}
              onClick={() => setEra(e_)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 active:scale-95 ${
                era === e_
                  ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                  : "bg-charcoal-800 text-gray-400 border-charcoal-700 hover:border-charcoal-500"
              }`}
            >
              {e_}
            </button>
          ))}
        </div>
      </div>

      {/* Taste profile indicator */}
      <div className="bg-charcoal-900 rounded-xl p-3 mb-4 border border-charcoal-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Your taste profile</span>
          <span className={`text-xs font-bold ${tasteCount > 0 ? "text-amber-400" : "text-gray-600"}`}>
            {tasteCount} {tasteCount === 1 ? "movie" : "movies"}
          </span>
        </div>
        {tasteCount === 0 && (
          <p className="text-xs text-gray-600 mt-1">
            Rate and save movies to get better picks. For now, I'll recommend something broadly great.
          </p>
        )}
        {tasteCount > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            Your watchlist and ratings will inform this pick.
          </p>
        )}
      </div>

      <button
        onClick={() => onRecommend(mood, time, location, era)}
        disabled={!canRecommend || loading}
        className="btn-primary w-full text-lg py-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
            Finding your pick...
          </span>
        ) : (
          "Give me one pick"
        )}
      </button>
    </div>
  );
}
