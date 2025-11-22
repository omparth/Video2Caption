// app/api/render-download/route.ts
export const runtime = "nodejs";

// Force Remotion to use your FFmpeg builds if PATH isn't set
process.env.FFMPEG_BINARY = "C:\\ffmpeg-2025-11-17-git-e94439e49b-full_build\\bin\\ffmpeg.exe";
process.env.FFPROBE_BINARY = "C:\\ffmpeg-2025-11-17-git-e94439e49b-full_build\\bin\\ffprobe.exe";

import path from "path";
import os from "os";
import fs from "fs";
import fsPromises from "fs/promises";
import { Readable } from "stream";

let bundler: any = null;
let renderer: any = null;

try {
  bundler = require("@remotion/bundler");
  renderer = require("@remotion/renderer");
} catch (e) {
  bundler = bundler ?? null;
  renderer = renderer ?? null;
}

function isWindowsAbsolute(p: string) {
  return /^[A-Za-z]:\\/.test(p);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      captions,
      entry = "components/remotion-entry.tsx",
      composition = "Main",
      inputVideoUrl = "",
      style = "bottom",
      fps = 30,
      width = 1280,
      height = 720,
    } = body;

    if (!captions || !Array.isArray(captions)) {
      return new Response(JSON.stringify({ error: "Invalid captions" }), { status: 400 });
    }

    if (!bundler || typeof bundler.bundle !== "function") {
      return new Response(JSON.stringify({ error: "Remotion bundler missing. Run: npm i @remotion/bundler" }), { status: 500 });
    }
    if (!renderer || typeof renderer.renderMedia !== "function") {
      return new Response(JSON.stringify({ error: "Remotion renderer missing. Run: npm i @remotion/renderer" }), { status: 500 });
    }

    // create temp dir
    const baseTmp = os.tmpdir();
    const tempDir = await fsPromises.mkdtemp(path.join(baseTmp, "remotion-"));
    const outPath = path.join(tempDir, `out-${Date.now()}.mp4`);

    // Resolve entry file and bundle
    const entryFile = path.join(process.cwd(), entry);
    console.log("[render-download] entryFile:", entryFile);

    let bundleResult: any;
    try {
      console.log("[render-download] Bundling entry (programmatic bundle with ignoreRegisterRootWarning)...");
      bundleResult = await bundler.bundle({
        entryPoint: entryFile,
        ignoreRegisterRootWarning: true,
        // Keep webpack config unchanged by default; customize here if needed
        webpackOverride: (config: any) => config,
      });
    } catch (err: any) {
      console.error("[render-download] bundling failed:", err);
      return new Response(JSON.stringify({ error: "Remotion bundling failed", details: String(err) }), { status: 500 });
    }

    let serveUrl = bundleResult?.serveUrl ?? bundleResult ?? `file://${process.cwd()}`;
    if (typeof serveUrl !== "string") serveUrl = `file://${process.cwd()}`;

    // Prepare finalVideoUrl: if local Windows path, copy into temp dir and use file://
    let finalVideoUrl = inputVideoUrl || "";
    try {
      if (typeof finalVideoUrl === "string" && finalVideoUrl.trim()) {
        if (finalVideoUrl.startsWith("file://")) {
          let p = finalVideoUrl.replace("file://", "");
          if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1);
          p = p.replace(/\//g, path.sep);
          if (await fsPromises.stat(p).catch(() => false)) {
            const destName = path.basename(p);
            const destPath = path.join(tempDir, destName);
            await fsPromises.copyFile(p, destPath);
            finalVideoUrl = `file://${destPath.replace(/\\/g, "/")}`;
            console.log("[render-download] Copied local file to temp:", destPath);
          }
        } else if (isWindowsAbsolute(finalVideoUrl)) {
          const p = finalVideoUrl;
          if (await fsPromises.stat(p).catch(() => false)) {
            const destName = path.basename(p);
            const destPath = path.join(tempDir, destName);
            await fsPromises.copyFile(p, destPath);
            finalVideoUrl = `file://${destPath.replace(/\\/g, "/")}`;
            console.log("[render-download] Copied local file to temp:", destPath);
          }
        } else {
          console.log("[render-download] Using remote video URL:", finalVideoUrl);
        }
      }
    } catch (copyErr) {
      console.warn("[render-download] error copying local file:", copyErr);
    }

    console.log("[render-download] Starting renderMedia...", { composition, outPath, serveUrl, finalVideoUrl });

    try {
      await renderer.renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: outPath,
        inputProps: { captions, videoUrl: finalVideoUrl, style, fps, width, height },
        overwrite: true,
      });
    } catch (err) {
      console.error("[render-download] renderMedia failed:", err);
      return new Response(JSON.stringify({ error: "renderMedia failed", details: String(err) }), { status: 500 });
    }

    // Stream file back
    const stat = await fsPromises.stat(outPath);
    const nodeStream = fs.createReadStream(outPath);

    // Prefer Readable.toWeb if available
    if ((Readable as any)?.toWeb && typeof (Readable as any).toWeb === "function") {
      const webStream = (Readable as any).toWeb(nodeStream) as unknown as ReadableStream;
      const headers = new Headers();
      headers.set("Content-Type", "video/mp4");
      headers.set("Content-Disposition", 'attachment; filename="video-with-captions.mp4"');
      headers.set("Content-Length", String(stat.size));
      console.log("[render-download] streaming back, size:", stat.size);
      return new Response(webStream, { headers });
    } else {
      // fallback: read buffer
      const buffer = await fsPromises.readFile(outPath);
      const headers = new Headers();
      headers.set("Content-Type", "video/mp4");
      headers.set("Content-Disposition", 'attachment; filename="video-with-captions.mp4"');
      headers.set("Content-Length", String(buffer.length));
      console.log("[render-download] returning buffer fallback, size:", buffer.length);
      return new Response(buffer, { headers });
    }
  } catch (err: any) {
    console.error("[render-download] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), { status: 500 });
  }
}
