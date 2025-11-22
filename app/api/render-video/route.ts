// app/api/render-video/route.ts
export const runtime = "nodejs";

process.env.FFMPEG_BINARY = "C:\\ffmpeg-2025-11-17-git-e94439e49b-full_build\\bin\\ffmpeg.exe";
process.env.FFPROBE_BINARY = "C:\\ffmpeg-2025-11-17-git-e94439e49b-full_build\\bin\\ffprobe.exe";

import { type NextRequest, NextResponse } from "next/server";
import path from "path";
import os from "os";
import fsPromises from "fs/promises";
import fs from "fs";
import { spawn } from "child_process";

function isWindowsAbsolute(p: string) {
  return /^[A-Za-z]:\\/.test(p);
}
function secToSrtTime(secNum: number) {
  const totalMs = Math.max(0, Math.round(secNum * 1000));
  const ms = totalMs % 1000;
  const s = Math.floor((totalMs / 1000) % 60);
  const m = Math.floor((totalMs / 1000 / 60) % 60);
  const h = Math.floor(totalMs / 1000 / 3600);
  const pad = (n: number, z = 2) => String(n).padStart(z, "0");
  const msPad = String(ms).padStart(3, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${msPad}`;
}
function captionsToSRT(captions: Array<{ text: string; start: number; end: number }>) {
  return captions
    .map((c, i) => {
      const s = secToSrtTime(c.start);
      const e = secToSrtTime(c.end);
      const text = (c.text || "").replace(/\r/g, "").trim();
      return `${i + 1}\n${s} --> ${e}\n${text}\n`;
    })
    .join("\n");
}
async function downloadUrlToFile(url: string, destPath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const ab = await res.arrayBuffer();
  await fsPromises.writeFile(destPath, Buffer.from(ab));
  return destPath;
}

export async function POST(request: NextRequest) {
  let tmp = "";
  try {
    const body = await request.json();
    const { captions, inputVideoUrl = "" } = body;

    if (!captions || !Array.isArray(captions)) {
      return NextResponse.json({ error: "Invalid captions" }, { status: 400 });
    }
    const ffmpegPath = process.env.FFMPEG_BINARY || "C:\\ffmpeg\\bin\\ffmpeg.exe";

    // temp dir
    const baseTmp = os.tmpdir();
    tmp = await fsPromises.mkdtemp(path.join(baseTmp, "caption-render-"));
    const srtPath = path.join(tmp, `captions-${Date.now()}.srt`);
    const outputPath = path.join(tmp, `output-${Date.now()}.mp4`);

    // prepare input
    let inputPath = "";
    try {
      if (!inputVideoUrl) throw new Error("No inputVideoUrl provided");
      if (typeof inputVideoUrl === "string" && inputVideoUrl.startsWith("file://")) {
        let p = inputVideoUrl.replace("file://", "");
        if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1);
        p = p.replace(/\//g, path.sep);
        if (!(await fsPromises.stat(p).catch(() => false))) throw new Error("Local file not found: " + p);
        const dest = path.join(tmp, path.basename(p));
        await fsPromises.copyFile(p, dest);
        inputPath = dest;
      } else if (isWindowsAbsolute(inputVideoUrl)) {
        const p = inputVideoUrl;
        if (!(await fsPromises.stat(p).catch(() => false))) throw new Error("Local file not found: " + p);
        const dest = path.join(tmp, path.basename(p));
        await fsPromises.copyFile(p, dest);
        inputPath = dest;
      } else if (typeof inputVideoUrl === "string" && (inputVideoUrl.startsWith("http://") || inputVideoUrl.startsWith("https://"))) {
        const dest = path.join(tmp, `input-${Date.now()}.mp4`);
        await downloadUrlToFile(inputVideoUrl, dest);
        inputPath = dest;
      } else {
        throw new Error("Unsupported inputVideoUrl format");
      }
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to prepare input video", details: String(e) }, { status: 400 });
    }

    // write SRT
    const srt = captionsToSRT(captions);
    await fsPromises.writeFile(srtPath, srt, "utf-8");

    // ffmpeg args
    const srtForFilter = srtPath.replace(/\\/g, "/").replace(/'/g, "\\'");
    const vfArg = `subtitles='${srtForFilter}':force_style='FontName=DejaVuSans,FontSize=36'`;

    const args = [
      "-y",
      "-i", inputPath,
      "-vf", vfArg,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "copy",
      outputPath,
    ];

    console.log("[ffmpeg] running:", ffmpegPath, args.join(" "));

    await new Promise<void>((resolve, reject) => {
      const child = spawn(ffmpegPath, args, { windowsHide: true });
      child.stdout?.on("data", (d) => console.log("[ffmpeg stdout]", d.toString()));
      child.stderr?.on("data", (d) => console.log("[ffmpeg stderr]", d.toString()));
      child.on("error", (err) => reject(err));
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error("ffmpeg exited with code " + code));
      });
    });

    // move to public/exports
    const exportsDir = path.join(process.cwd(), "public", "exports");
    await fsPromises.mkdir(exportsDir, { recursive: true });
    const fileName = `video-with-captions-${Date.now()}.mp4`;
    const dest = path.join(exportsDir, fileName);

    try {
      await fsPromises.rename(outputPath, dest);
    } catch (errMove) {
      const data = await fsPromises.readFile(outputPath);
      await fsPromises.writeFile(dest, data);
      await fsPromises.unlink(outputPath);
    }

    const url = `/exports/${fileName}`;
    console.log("[render-video] Render completed. public URL:", url);
    return NextResponse.json({ success: true, url, captionsProcessed: captions.length });
  } catch (err: any) {
    console.error("[render-video] unexpected error:", err);
    return NextResponse.json({ error: "Failed to process render request", details: String(err) }, { status: 500 });
  } finally {
    // optional cleanup of tmp for debugging purposes, keep if you want to inspect
    // try { if (tmp) await fsPromises.rm(tmp, { recursive: true, force: true }); } catch(e) {}
  }
}
