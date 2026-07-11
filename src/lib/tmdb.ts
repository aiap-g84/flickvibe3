const TMDB_IMG_BASE = "https://image.tmdb.org/t/p"

export function posterUrl(path: string | null, size: "w200" | "w342" | "w500" | "w780" = "w342"): string {
  if (!path) return "/poster-placeholder.svg"
  return `${TMDB_IMG_BASE}/${size}${path}`
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return ""
  return `${TMDB_IMG_BASE}/${size}${path}`
}
