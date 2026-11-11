export type EpisodeAccessInput = { accessLevel: "public" | "subscriber"; isStartHere: boolean; isCurrent: boolean };
export type Viewer = { role: "subscriber" | "admin"; status: "active" | "disabled" | "cancelled" } | null;

export function resolveEpisodeAccess(episode: EpisodeAccessInput, viewer: Viewer): "full" | "teaser" {
  if (episode.accessLevel === "public" || episode.isStartHere) return "full";
  return viewer?.status === "active" ? "full" : "teaser";
}
