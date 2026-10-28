"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const PODCAST_SEGMENTS = [
  { start: 0, end: 7, label: "0:00" },
  { start: 17, end: 20, label: "0:17" },
  { start: 27, end: 30, label: "0:27" },
] as const;
const OPENER_SEGMENTS = [PODCAST_SEGMENTS[0]];

export function CatalogPreview({ src, title, hasPodcast, kind }: { src: string; title: string; hasPodcast: boolean; kind: "audio" | "video" }) {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const segmentRef = useRef(0);
  const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [segmentLabel, setSegmentLabel] = useState("0:00");
  const segments = hasPodcast ? PODCAST_SEGMENTS : OPENER_SEGMENTS;

  function stopPreviewMonitor() {
    if (monitorRef.current === null) return;
    clearInterval(monitorRef.current);
    monitorRef.current = null;
  }

  function finishPreview() {
    const media = mediaRef.current;
    if (!media) return;
    stopPreviewMonitor();
    media.pause();
    media.currentTime = 0;
    segmentRef.current = 0;
    completedRef.current = true;
    setSegmentLabel("complete · 0:00");
  }

  function advancePreview() {
    const media = mediaRef.current;
    if (!media || media.currentTime < segments[segmentRef.current].end) return;
    if (segmentRef.current === segments.length - 1) {
      finishPreview();
      return;
    }
    segmentRef.current += 1;
    const next = segments[segmentRef.current];
    media.currentTime = next.start;
    setSegmentLabel(next.label);
  }

  function honorReducedMotion() {
    const media = mediaRef.current;
    if (!media || !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    media.pause();
    media.currentTime = 0;
  }

  function startPreviewMonitor() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      honorReducedMotion();
      return;
    }
    stopPreviewMonitor();
    monitorRef.current = setInterval(advancePreview, 100);
  }

  function startCatalogPlayback() {
    const media = mediaRef.current;
    if (!media || completedRef.current || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const playback = media.play();
    if (playback) void playback.catch(() => undefined);
  }

  useEffect(() => () => stopPreviewMonitor(), []);

  function toggleMuted() {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (mediaRef.current) mediaRef.current.muted = nextMuted;
  }

  const mediaProps = {
    "aria-label": `${title} ${hasPodcast ? "catalog preview" : "opening reel placeholder"}`,
    autoPlay: true,
    muted,
    onCanPlay: startCatalogPlayback,
    onEnded: finishPreview,
    onLoadedMetadata: honorReducedMotion,
    onPause: stopPreviewMonitor,
    onPlay: startPreviewMonitor,
    onTimeUpdate: advancePreview,
    preload: "metadata" as const,
    src,
  };

  return (
    <div className="catalogPreview">
      {kind === "video" ? <video ref={mediaRef as RefObject<HTMLVideoElement | null>} {...mediaProps} playsInline>Your browser does not support the video preview.</video> : <><div className="audioPreviewArtwork" role="img" aria-label={`${title} audio preview artwork`}><strong>Like TAC</strong><span>Like TAC audio preview</span></div><audio ref={mediaRef as RefObject<HTMLAudioElement | null>} {...mediaProps}>Your browser does not support the audio preview.</audio></>}
      <div className="catalogPreviewControls">
        <span>Preview {segmentLabel}</span>
        <button className="button quiet" type="button" onClick={toggleMuted}>
          {muted ? "Unmute preview" : "Mute preview"}
        </button>
      </div>
    </div>
  );
}
