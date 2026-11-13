"use client";

import { useRef, useState } from "react";

export function MediaPlayer({ src, kind, title, teaser = false }: { src: string; kind: "audio" | "video"; title: string; teaser?: boolean }) {
  const media = useRef<HTMLMediaElement>(null); const [muted, setMuted] = useState(teaser);
  const shared = { ref: media as never, src, controls: true, muted, loop: teaser, onTimeUpdate: () => { if (teaser && media.current && media.current.currentTime >= 45) media.current.currentTime = 0; } };
  return <div className="mediaStage"><div className="mediaFrame">{kind === "video" ? <video {...shared} aria-label={title} playsInline /> : <audio {...shared} aria-label={title} />}</div>{teaser && <div className="mediaActions"><button className="button quiet" type="button" onClick={() => setMuted((value) => !value)}>{muted ? "Unmute teaser" : "Mute teaser"}</button></div>}</div>;
}
