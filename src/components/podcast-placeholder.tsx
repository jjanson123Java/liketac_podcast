import { CatalogPreview } from "./catalog-preview";

export function PodcastPlaceholder({ subject, catalogPreview = false }: { subject: string; catalogPreview?: boolean }) {
  return (
    <article className="podcastPlaceholder">
      {catalogPreview ? <CatalogPreview src="/media/podcast-opener/like-tac-podcast-opener.mp4" title={subject} hasPodcast={false} kind="video" /> : <video
        aria-label={`${subject} podcast preview`}
        controls
        playsInline
        preload="metadata"
        src="/media/podcast-opener/like-tac-podcast-opener.mp4"
      >
        Your browser does not support the video player.
      </video>}
      <div className="podcastPlaceholderCopy">
        <span className="tag">Preview reel</span>
        <h3>Podcast coming soon</h3>
        <p>
          This Like TAC opening reel marks the place for the upcoming podcast. It will be replaced by the
          complete episode—with this intro and a closing credits reel—when production is finished.
        </p>
      </div>
    </article>
  );
}
