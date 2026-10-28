import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(projectRoot, "public", "media", "podcast-opener");
const audioDir = join(outputDir, "audio");
const visualDir = join(outputDir, "visual");
const audioPath = join(audioDir, "like-tac-podcast-opener-original.wav");
const videoPath = join(outputDir, "like-tac-podcast-opener.mp4");
const visualVideoPath = join(visualDir, "like-tac-podcast-opener-visual-only.mp4");
const bannerPath = join(visualDir, "liketac-banner-hd.png");
const fontPath = "C\\:/Windows/Fonts/segoeuib.ttf";

mkdirSync(outputDir, { recursive: true });
mkdirSync(audioDir, { recursive: true });
mkdirSync(visualDir, { recursive: true });

const sampleRate = 48_000;
const durationSeconds = 7;
const frameCount = sampleRate * durationSeconds;
const channels = 2;
const bitsPerSample = 16;
const audio = Buffer.alloc(frameCount * channels * (bitsPerSample / 8));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (start, end, value) => {
  const amount = clamp((value - start) / (end - start), 0, 1);
  return amount * amount * (3 - 2 * amount);
};
const bell = (time, start, length) => {
  const position = time - start;
  if (position < 0 || position > length) return 0;
  return smoothstep(0, 0.06, position) * Math.exp(-3.1 * position / length);
};

let noiseState = 0x4c494b45;
let filteredNoise = 0;
for (let frame = 0; frame < frameCount; frame += 1) {
  const time = frame / sampleRate;
  const fadeIn = smoothstep(0, 0.45, time);
  const fadeOut = 1 - smoothstep(6.35, 6.95, time);

  const warmPad =
    0.065 * Math.sin(2 * Math.PI * 110 * time) +
    0.028 * Math.sin(2 * Math.PI * 164.81 * time) +
    0.018 * Math.sin(2 * Math.PI * 220 * time);

  let pulse = 0;
  for (const start of [0.18, 0.62, 1.06, 1.5]) {
    const position = time - start;
    if (position >= 0 && position < 0.42) {
      pulse += 0.12 * Math.sin(2 * Math.PI * (145 + 45 * position) * position) * Math.exp(-8 * position);
    }
  }

  noiseState = (1664525 * noiseState + 1013904223) >>> 0;
  const whiteNoise = noiseState / 0xffffffff * 2 - 1;
  filteredNoise += 0.018 * (whiteNoise - filteredNoise);
  const whooshEnvelope = smoothstep(1.15, 2.25, time) * (1 - smoothstep(3.2, 4.1, time));
  const whoosh = filteredNoise * 0.115 * whooshEnvelope;

  const resolveOne = bell(time, 4.55, 1.7) * (
    0.17 * Math.sin(2 * Math.PI * 293.66 * (time - 4.55)) +
    0.07 * Math.sin(2 * Math.PI * 587.33 * (time - 4.55))
  );
  const resolveTwo = bell(time, 5.18, 1.6) * (
    0.19 * Math.sin(2 * Math.PI * 440 * (time - 5.18)) +
    0.055 * Math.sin(2 * Math.PI * 880 * (time - 5.18))
  );

  const center = (warmPad * fadeIn + pulse + whoosh + resolveOne + resolveTwo) * fadeOut;
  const left = Math.tanh(center * 1.45) * 0.82;
  const right = Math.tanh((center + resolveTwo * 0.08 - resolveOne * 0.04) * 1.45) * 0.82;
  audio.writeInt16LE(Math.round(clamp(left, -1, 1) * 32767), frame * 4);
  audio.writeInt16LE(Math.round(clamp(right, -1, 1) * 32767), frame * 4 + 2);
}

const wavHeader = Buffer.alloc(44);
const dataSize = audio.length;
wavHeader.write("RIFF", 0);
wavHeader.writeUInt32LE(36 + dataSize, 4);
wavHeader.write("WAVE", 8);
wavHeader.write("fmt ", 12);
wavHeader.writeUInt32LE(16, 16);
wavHeader.writeUInt16LE(1, 20);
wavHeader.writeUInt16LE(channels, 22);
wavHeader.writeUInt32LE(sampleRate, 24);
wavHeader.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
wavHeader.writeUInt16LE(channels * (bitsPerSample / 8), 32);
wavHeader.writeUInt16LE(bitsPerSample, 34);
wavHeader.write("data", 36);
wavHeader.writeUInt32LE(dataSize, 40);
writeFileSync(audioPath, Buffer.concat([wavHeader, audio]));

const alpha = (start, fullyVisible, fadeStart, end) =>
  `if(lt(t,${start}),0,if(lt(t,${fullyVisible}),(t-${start})/${(fullyVisible - start).toFixed(2)},if(lt(t,${fadeStart}),1,if(lt(t,${end}),(${end}-t)/${(end - fadeStart).toFixed(2)},0))))`;

const filters = [
  "[0:v]format=rgba",
  "drawbox=x=0:y=0:w=iw:h=ih:color=0x052f37:t=fill",
  "drawbox=x=1280:y=-170:w=820:h=820:color=0x008d9a@0.16:t=fill",
  "drawbox=x=-250:y=800:w=1200:h=320:color=0x003f49@0.9:t=fill",
  "drawbox=x='-400+340*t':y=0:w=220:h=ih:color=0x00a0ad@0.08:t=fill:enable='between(t,0,2.2)'",
  "drawbox=x=760:y=458:w=10:h=80:color=0xffd232@0.95:t=fill:enable='between(t,0.2,1.85)'",
  "drawbox=x=786:y=430:w=10:h=136:color=0xffd232@0.95:t=fill:enable='between(t,0.34,1.85)'",
  "drawbox=x=812:y=394:w=10:h=208:color=0xffd232@0.95:t=fill:enable='between(t,0.48,1.85)'",
  "drawbox=x=838:y=442:w=10:h=112:color=0xffd232@0.95:t=fill:enable='between(t,0.62,1.85)'",
  "drawbox=x=864:y=410:w=10:h=176:color=0xffd232@0.95:t=fill:enable='between(t,0.76,1.85)'",
  "drawbox=x=890:y=464:w=10:h=68:color=0xffd232@0.95:t=fill:enable='between(t,0.9,1.85)'",
  `drawtext=fontfile='${fontPath}':text='CLEAR CONVERSATIONS.':fontcolor=white:fontsize=78:x=(w-text_w)/2:y=380:alpha='${alpha(1.35, 1.75, 3.55, 4.0)}'`,
  `drawtext=fontfile='${fontPath}':text='NO TECH HEADACHE.':fontcolor=0xffd232:fontsize=86:x=(w-text_w)/2:y=485:alpha='${alpha(1.9, 2.3, 3.75, 4.2)}'`,
  "drawbox=x=520:y=600:w='880*min(max((t-2.05)/1.15,0),1)':h=5:color=0xffd232:t=fill:enable='between(t,2.05,4.15)'[base]",
  "[1:v]format=rgba,scale=1920:-1,crop=1920:1080:0:(ih-1080)/2,fade=t=in:st=4.25:d=0.65:alpha=1,fade=t=out:st=6.75:d=0.2:alpha=1[banner]",
  "[base][banner]overlay=x=0:y=0:enable='between(t,4.2,7)'",
  `drawtext=fontfile='${fontPath}':text='SERIOUS TECH.':fontcolor=white:fontsize=58:x=(w-text_w)/2:y=720:alpha='${alpha(4.65, 5.05, 6.65, 6.95)}'`,
  `drawtext=fontfile='${fontPath}':text='FOR THE REST OF US.':fontcolor=0xffd232:fontsize=64:x=(w-text_w)/2:y=790:alpha='${alpha(4.9, 5.3, 6.65, 6.95)}'`,
  "format=yuv420p[v]",
].join(",");

const renderResult = spawnSync("ffmpeg", [
  "-y",
  "-f", "lavfi",
  "-i", `color=c=0x052f37:s=1920x1080:r=30:d=${durationSeconds}`,
  "-loop", "1",
  "-i", bannerPath,
  "-i", audioPath,
  "-filter_complex", filters,
  "-map", "[v]",
  "-map", "2:a",
  "-t", String(durationSeconds),
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "18",
  "-c:a", "aac",
  "-b:a", "192k",
  "-movflags", "+faststart",
  videoPath,
], { encoding: "utf8" });

if (renderResult.status !== 0) {
  process.stderr.write(renderResult.stderr);
  process.exit(renderResult.status ?? 1);
}

const visualResult = spawnSync("ffmpeg", [
  "-y",
  "-i", videoPath,
  "-map", "0:v:0",
  "-c:v", "copy",
  "-an",
  "-movflags", "+faststart",
  visualVideoPath,
], { encoding: "utf8" });

if (visualResult.status !== 0) {
  process.stderr.write(visualResult.stderr);
  process.exit(visualResult.status ?? 1);
}

process.stdout.write(`${videoPath}\n${visualVideoPath}\n${audioPath}\n`);
