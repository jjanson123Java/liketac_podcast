export type CompanionLaunchAction = "recording";
export type UploadLaunch = { origin: string; episodeId: string; secret: string };
export type CloseChoice = "close" | "cancel" | "leave-recording" | "stop-recording";

export function parseCompanionLaunch(input: string): CompanionLaunchAction | null {
  try {
    const url = new URL(input);
    if (url.protocol.toLowerCase() !== "liketac:" || url.hostname.toLowerCase() !== "recording") return null;
    if (url.pathname !== "" || url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "" || url.port !== "") return null;
    return "recording";
  } catch { return null; }
}

export function parseUploadLaunch(input: string, options: { allowLocalDevelopment?: boolean } = {}): UploadLaunch | null {
  try {
    const url = new URL(input);
    if (url.protocol.toLowerCase() !== "liketac:" || url.hostname.toLowerCase() !== "prepare-upload" || url.pathname !== "" || url.hash || url.username || url.password || url.port) return null;
    if ([...url.searchParams.keys()].sort().join(",") !== "episodeId,origin,secret") return null;
    const origin = new URL(url.searchParams.get("origin") ?? "");
    const trustedProduction = origin.protocol === "https:" && origin.hostname === "liketac.live" && !origin.port;
    const trustedLocal = origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname);
    const episodeId = url.searchParams.get("episodeId") ?? "";
    const secret = url.searchParams.get("secret") ?? "";
    if ((!trustedProduction && !(options.allowLocalDevelopment && trustedLocal)) || origin.pathname !== "/" || origin.search || origin.hash) return null;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(episodeId)) return null;
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(secret)) return null;
    return { origin: origin.origin, episodeId, secret };
  } catch {
    return null;
  }
}

export function allowedRendererNavigation(target: string, packagedRendererUrl: string) {
  return target === packagedRendererUrl;
}

export function resolveCloseAction(input: { recording: boolean; choice: CloseChoice }) {
  if (!input.recording) return "close" as const;
  if (input.choice === "stop-recording") return "stop-and-close" as const;
  if (input.choice === "leave-recording") return "close" as const;
  return "cancel" as const;
}
