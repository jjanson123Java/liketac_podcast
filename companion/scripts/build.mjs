import { build } from "esbuild";
import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/main", { recursive: true });
await mkdir("dist/preload", { recursive: true });
await mkdir("dist/renderer/assets", { recursive: true });
await build({ entryPoints: ["src/main/index.ts"], bundle: true, platform: "node", format: "cjs", external: ["electron"], outfile: "dist/main/index.cjs" });
await build({ entryPoints: ["src/preload/runtime.ts"], bundle: true, platform: "node", format: "cjs", external: ["electron"], outfile: "dist/preload/index.cjs" });
await build({ entryPoints: ["src/renderer/app.ts"], bundle: true, platform: "browser", format: "iife", outfile: "dist/renderer/app.js" });
await cp("src/renderer/index.html", "dist/renderer/index.html");
await cp("src/renderer/styles.css", "dist/renderer/styles.css");
await cp("../public/media/podcast-opener/visual/liketac-banner-hd.png", "dist/renderer/assets/liketac-banner-hd.png");
await cp("../public/media/podcast-opener/like-tac-podcast-opener.mp4", "dist/renderer/assets/like-tac-podcast-opener.mp4");
await cp("../public/media/podcast-opener/like-tac-podcast-opener-companion.webm", "dist/renderer/assets/like-tac-podcast-opener-companion.webm");
await cp("../public/media/podcast-opener/visual/like-tac-podcast-opener-visual-only.mp4", "dist/renderer/assets/like-tac-podcast-opener-visual-only.mp4");
await cp("../public/media/podcast-opener/audio/like-tac-podcast-opener-original.wav", "dist/renderer/assets/like-tac-podcast-opener-original.wav");
