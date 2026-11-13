"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export function VisitorPlaybackNotice({ episodeTitle, onClose, open }: { episodeTitle: string; onClose: () => void; open: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) closeRef.current?.focus(); }, [open]);
  if (!open) return null;

  return <div className="visitorNoticeBackdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section aria-label={`${episodeTitle} requires membership`} aria-modal="true" className="visitorNotice" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }} role="dialog">
      <span className="eyebrow">Subscriber episode</span>
      <h2>You’re browsing as a visitor.</h2>
      <p><strong>{episodeTitle}</strong> is visible in the catalog, but full playback is available to Like TAC members. Membership is free.</p>
      <div className="buttonRow"><Link className="button primary" href="/signup">Sign Up Free</Link><button className="button outline" onClick={onClose} ref={closeRef} type="button">Keep Browsing</button></div>
    </section>
  </div>;
}
