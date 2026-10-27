"use client";

import { useRef, useState } from "react";

export function MediaPlayer({ src, kind, title, teaser = false }: { src: string; kind: "audio" | "video"; title: string; teaser?: boolean }) {
  const stage = useRef<HTMLDivElement>(null); const media = useRef<HTMLMediaElement>(null); const [muted, setMuted] = useState(teaser);
  const shared = { ref: media as never, src, controls: true, muted, loop: teaser, onTimeUpdate: () => { if (teaser && media.current && media.current.currentTime >= 45) media.current.currentTime = 0; } };
  return <div className="mediaStage" ref={stage}><div className="mediaFrame">{kind === "video" ? <video {...shared} aria-label={title} playsInline /> : <audio {...shared} aria-label={title} />}</div><div className="mediaActions">{teaser && <button className="button quiet" type="button" onClick={() => setMuted((value) => !value)}>{muted ? "Unmute teaser" : "Mute teaser"}</button>}<button className="button outline" type="button" onClick={() => stage.current?.requestFullscreen()}>Full screen</button></div><p className="mediaHint">Press Escape to leave full screen.</p></div>;
}
