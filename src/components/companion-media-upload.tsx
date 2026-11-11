"use client";

import { useEffect, useState } from "react";

type HandoffResponse = { id: string; secret: string; episodeId: string; expiresAt: string };

export function CompanionMediaUpload({ episodeId, hasFull, hasPreview, launch = (url) => { window.location.href = url; } }: { episodeId: string; hasFull: boolean; hasPreview: boolean; launch?: (url: string) => void }) {
  const [message, setMessage] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [handoffId, setHandoffId] = useState<string | null>(null);
  const [fullReady, setFullReady] = useState(hasFull);
  const [previewReady, setPreviewReady] = useState(hasPreview);

  useEffect(() => {
    if (!handoffId || (fullReady && previewReady)) return;
    let stopped = false;
    async function refreshStatus() {
      try {
        const response = await fetch(`/api/admin/podcasts/handoff?id=${encodeURIComponent(handoffId!)}`);
        if (!response.ok || stopped) return;
        const status = await response.json() as { fullComplete?: boolean; teaserComplete?: boolean; cancelled?: boolean };
        setFullReady(Boolean(status.fullComplete));
        setPreviewReady(Boolean(status.teaserComplete));
        if (status.fullComplete && status.teaserComplete) setMessage("Full episode and 45-second preview are ready. You can publish the episode.");
        else if (status.cancelled) setMessage("The upload handoff was cancelled. Prepare a new handoff to try again.");
      } catch { /* keep the last known status and try again */ }
    }
    void refreshStatus();
    const timer = window.setInterval(refreshStatus, 2000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [handoffId, fullReady, previewReady]);

  async function prepare() {
    if (preparing) return;
    setPreparing(true);
    setMessage("Creating a secure 10-minute handoff…");
    try {
      const response = await fetch("/api/admin/podcasts/handoff", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ episodeId }) });
      if (!response.ok) throw new Error("The secure handoff could not be created.");
      const handoff = await response.json() as HandoffResponse;
      setHandoffId(handoff.id);
      const query = new URLSearchParams({ origin: window.location.origin, episodeId: handoff.episodeId, secret: handoff.secret });
      launch(`liketac://prepare-upload?${query.toString()}`);
      setMessage("Handoff ready for 10 minutes. In Companion, choose the completed episode and follow the progress bars.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The secure handoff could not be created.");
    } finally {
      setPreparing(false);
    }
  }

  return <section className="stackedForm companionUpload"><div className="buttonRow" aria-label="Media readiness"><span className={`tag ${fullReady ? "ready" : ""}`}>{fullReady ? "Full episode ready" : "Full episode needed"}</span><span className={`tag ${previewReady ? "ready" : ""}`}>{previewReady ? "45-second preview ready" : "Preview needed"}</span></div><p>Select one finished recording. Companion creates the first 45 seconds locally and uploads both private files. RunPod is not used.</p><button className="button primary" type="button" disabled={preparing} onClick={prepare}>{preparing ? "Preparing secure handoff…" : "Prepare and upload with Like TAC Companion"}</button><output aria-live="polite">{message}</output></section>;
}
