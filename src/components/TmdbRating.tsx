interface Props {
  voteAverage: number | null | undefined;
  voteCount?: number | null;
  className?: string;
}

export function TmdbRating({ voteAverage, className = "" }: Props) {
  if (!voteAverage || voteAverage === 0) {
    return (
      <span className={`text-xs text-gray-600 ${className}`}>No rating available</span>
    );
  }

  const score = voteAverage.toFixed(1);
  // Color band: green ≥7.5, yellow ≥6, red below
  const color =
    voteAverage >= 7.5 ? "text-teal-400" :
    voteAverage >= 6.0 ? "text-amber-400" :
    "text-red-400";

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className={`text-xs font-bold ${color}`}>★ {score}</span>
      <span className="text-xs text-gray-600 font-normal">TMDB</span>
    </span>
  );
}
