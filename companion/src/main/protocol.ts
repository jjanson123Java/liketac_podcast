export type CompanionLaunchAction = "recording";
export type CloseChoice = "close" | "cancel" | "leave-recording" | "stop-recording";

export function parseCompanionLaunch(input: string): CompanionLaunchAction | null {
  try {
    const url = new URL(input);
    if (url.protocol.toLowerCase() !== "liketac:" || url.hostname.toLowerCase() !== "recording") return null;
    if (url.pathname !== "" || url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "" || url.port !== "") return null;
    return "recording";
  } catch { return null; }
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
