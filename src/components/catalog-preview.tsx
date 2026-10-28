"use client";

import { useRef, useState } from "react";

const PODCAST_SEGMENTS = [
  { start: 0, end: 7, label: "0:00" },
  { start: 17, end: 20, label: "0:17" },
  { start: 27, end: 30, label: "0:27" },
] as const;
const OPENER_SEGMENTS = [PODCAST_SEGMENTS[0]];

export function CatalogPreview({ src, title, hasPodcast }: { src: string; title: string; hasPodcast: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const segmentRef = useRef(0);
  const [muted, setMuted] = useState(true);
  const [segmentLabel, setSegmentLabel] = useState("0:00");
  const segments = hasPodcast ? PODCAST_SEGMENTS : OPENER_SEGMENTS;

  function advancePreview(resumeAfterSeek = false) {
    const video = videoRef.current;
    if (!video || video.currentTime < segments[segmentRef.current].end) return;
    segmentRef.current = (segmentRef.current + 1) % segments.length;
    const next = segments[segmentRef.current];
    video.currentTime = next.start;
    setSegmentLabel(next.label);
    if (resumeAfterSeek) {
      const playback = video.play();
      if (playback) void playback.catch(() => undefined);
    }
  }

  function honorReducedMotion() {
    const video = videoRef.current;
    if (!video || !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    video.pause();
    video.currentTime = 0;
  }

  function toggleMuted() {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
  }

  return (
    <div className="catalogPreview">
      <video
        ref={videoRef}
        aria-label={`${title} ${hasPodcast ? "catalog preview" : "opening reel placeholder"}`}
        autoPlay
        muted={muted}
        onEnded={() => advancePreview(true)}
        onLoadedMetadata={honorReducedMotion}
        onTimeUpdate={() => advancePreview()}
        playsInline
        preload="metadata"
        src={src}
      >
        Your browser does not support the video preview.
      </video>
      <div className="catalogPreviewControls">
        <span>Preview {segmentLabel}</span>
        <button className="button quiet" type="button" onClick={toggleMuted}>
          {muted ? "Unmute preview" : "Mute preview"}
        </button>
      </div>
    </div>
  );
}
