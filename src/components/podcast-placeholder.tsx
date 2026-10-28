export function PodcastPlaceholder({ subject }: { subject: string }) {
  return (
    <article className="podcastPlaceholder">
      <video
        aria-label={`${subject} podcast preview`}
        controls
        playsInline
        preload="metadata"
        src="/media/podcast-opener/like-tac-podcast-opener.mp4"
      >
        Your browser does not support the video player.
      </video>
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
