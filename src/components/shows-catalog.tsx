"use client";

import { useRef, useState } from "react";
import { EpisodeCard } from "./episode-card";
import { PodcastPlaceholder } from "./podcast-placeholder";
import { VisitorPlaybackNotice } from "./visitor-playback-notice";

export type ShowsCatalogEpisode = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: Date | null;
  isStartHere: boolean;
  isCurrent: boolean;
  access: "full" | "teaser";
  hasMedia: boolean;
  previewMediaId: string | null;
  previewMediaKind?: "audio" | "video";
  isFreeClassification: boolean;
  isNonTechnical: boolean;
  isBeginner: boolean;
  isSeriously: boolean;
};

export type ShowsCatalogCategory = {
  id: string;
  name: string;
  description: string | null;
  episodes: ShowsCatalogEpisode[];
};

type FilterKey = "free" | "nonTechnical" | "beginner" | "seriously";
const filters: { key: FilterKey; label: string }[] = [
  { key: "free", label: "Free Episodes" },
  { key: "nonTechnical", label: "Non-Technical Episodes" },
  { key: "beginner", label: "Beginner Episodes" },
  { key: "seriously", label: "Seriously Episodes" },
];

function matches(episode: ShowsCatalogEpisode, active: Set<FilterKey>) {
  if (!active.size) return true;
  return (active.has("free") && episode.isFreeClassification)
    || (active.has("nonTechnical") && episode.isNonTechnical)
    || (active.has("beginner") && episode.isBeginner)
    || (active.has("seriously") && episode.isSeriously);
}

export function ShowsCatalog({ catalog, isSubscriber }: { catalog: ShowsCatalogCategory[]; isSubscriber: boolean }) {
  const [active, setActive] = useState<Set<FilterKey>>(() => new Set());
  const [lockedEpisode, setLockedEpisode] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  function toggle(key: FilterKey) { setActive((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; }); }
  function openNotice(title: string) { returnFocus.current = document.activeElement as HTMLElement | null; setLockedEpisode(title); }
  function closeNotice() { setLockedEpisode(null); requestAnimationFrame(() => returnFocus.current?.focus()); }

  return <>
    <div className="catalogFilters" role="group" aria-label="Filter episodes by learning level">
      {filters.map(({ key, label }) => <button className="catalogFilter" aria-pressed={active.has(key)} key={key} onClick={() => toggle(key)} type="button">{label}</button>)}
    </div>
    {catalog.map((category) => {
      const visible = category.episodes.filter((episode) => matches(episode, active));
      return <section className="catalogSection" key={category.id}><div className="sectionHeading"><div><h2>{category.name}</h2><p>{category.description}</p></div><span className="tag">{visible.length ? `${visible.length} episode${visible.length === 1 ? "" : "s"}` : active.size ? "No matches" : "Coming Soon"}</span></div>
        {visible.length ? <div className="cardGrid">{visible.map((episode) => <EpisodeCard isSubscriber={isSubscriber} key={episode.id} onLockedPlay={openNotice} episode={episode} />)}</div> : active.size && category.episodes.length ? <p className="catalogNoMatches">No episodes in this category match the selected filters.</p> : <PodcastPlaceholder subject={category.name} catalogPreview />}
      </section>;
    })}
    <VisitorPlaybackNotice episodeTitle={lockedEpisode ?? "This episode"} onClose={closeNotice} open={Boolean(lockedEpisode)} />
  </>;
}
