// app/api/generate-captions/route.ts
import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import fsPromises from "fs/promises";

/**
 * Upload ArrayBuffer to AssemblyAI and return upload_url
 * (use ArrayBuffer to satisfy TypeScript/DOM BodyInit)
 */
async function uploadArrayBufferToAssemblyAI(arrayBuffer: ArrayBuffer, apiKey: string) {
  const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/octet-stream",
    },
    // pass ArrayBuffer directly
    body: arrayBuffer,
  });

  if (!uploadRes.ok) {
    const txt = await uploadRes.text();
    throw new Error(`AssemblyAI upload failed: ${uploadRes.status} ${txt}`);
  }

  const uploadJson = await uploadRes.json();
  return uploadJson.upload_url as string;
}

async function createTranscript(assemblyApiKey: string, uploadUrl: string) {
  const payload = {
    audio_url: uploadUrl,
  };

  const createRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      authorization: assemblyApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const txt = await createRes.text();
    throw new Error(`AssemblyAI create transcript failed: ${createRes.status} ${txt}`);
  }

  const createJson = await createRes.json();
  return createJson.id as string;
}

async function pollTranscript(transcriptId: string, apiKey: string, interval = 2000, timeout = 1000 * 60 * 5) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { authorization: apiKey },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AssemblyAI poll failed: ${res.status} ${txt}`);
    }
    const json = await res.json();
    if (json.status === "completed") return json;
    if (json.status === "error") throw new Error(`Transcript error: ${json.error}`);
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("Transcript polling timed out");
}

function convertAssemblyToCaptions(transcriptJson: any) {
  const captions: Array<{ text: string; start: number; end: number }> = [];
  const words = transcriptJson.words || [];

  if (!Array.isArray(words) || words.length === 0) return captions;

  let current: string[] = [];
  let startMs = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (current.length === 0) startMs = w.start ?? w.s ?? 0;
    current.push(w.text);
    const punctuationEnd = w.punctuation === "." || w.punctuation === "!" || w.punctuation === "?";
    const shouldClose = current.length >= 10 || punctuationEnd;
    if (shouldClose) {
      const last = words[i];
      const endMs = last.end ?? last.e ?? (last.start ?? 0) + 500;
      captions.push({
        text: current.join(" "),
        start: Math.round(startMs) / 1000,
        end: Math.round(endMs) / 1000,
      });
      current = [];
    }
  }

  if (current.length > 0) {
    const lastWord = words[words.length - 1];
    const endMs = lastWord.end ?? lastWord.e ?? (lastWord.start ?? 0) + 1000;
    captions.push({
      text: current.join(" "),
      start: Math.round(startMs) / 1000,
      end: Math.round(endMs) / 1000,
    });
  }

  return captions;
}

function chunkTextToCaptions(fullText: string, durationSec = 60) {
  const captions: Array<{ text: string; start: number; end: number }> = [];
  if (!fullText || !fullText.trim()) return captions;

  const words = fullText.trim().split(/\s+/);
  const wordsPerCaption = 8; // tweak
  let i = 0;
  let startSec = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + wordsPerCaption).join(" ");
    const estDuration = Math.max(1.5, (wordsPerCaption / Math.max(1, words.length)) * durationSec);
    captions.push({
      text: chunk,
      start: Math.round(startSec * 1000) / 1000,
      end: Math.round((startSec + estDuration) * 1000) / 1000,
    });
    startSec += estDuration;
    i += wordsPerCaption;
  }

  return captions;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured. Set ASSEMBLYAI_API_KEY in .env.local" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    console.log("[assembly] uploading file:", file.name, file.size);

    // Get ArrayBuffer (we'll pass ArrayBuffer to fetch to satisfy TS)
    const arrayBuffer = await file.arrayBuffer();

    // Save uploaded file to a temp directory on the server so Remotion can later read it
    const baseTmp = os.tmpdir();
    const tmpDir = await fsPromises.mkdtemp(path.join(baseTmp, "caption-upload-"));
    // sanitize filename
    const safeName = (file.name || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const tmpFilePath = path.join(tmpDir, safeName);
    // write using Node Buffer
    await fsPromises.writeFile(tmpFilePath, Buffer.from(arrayBuffer));
    console.log("[assembly] saved uploaded file to:", tmpFilePath);

    // Upload ArrayBuffer to AssemblyAI
    const uploadUrl = await uploadArrayBufferToAssemblyAI(arrayBuffer, apiKey);
    console.log("[assembly] uploaded to:", uploadUrl);

    // Create transcript and poll
    const transcriptId = await createTranscript(apiKey, uploadUrl);
    console.log("[assembly] transcript id:", transcriptId);

    const transcriptJson = await pollTranscript(transcriptId, apiKey);
    console.log("[assembly] transcript completed, status text length:", transcriptJson?.text?.length ?? 0);

    // Build captions
    let captions = convertAssemblyToCaptions(transcriptJson);
    if ((!captions || captions.length === 0) && transcriptJson.text) {
      const durationSec = transcriptJson.audio_length_sec ?? transcriptJson.duration ?? 60;
      captions = chunkTextToCaptions(transcriptJson.text, durationSec);
      console.log("[assembly] fallback chunked captions count:", captions.length);
    } else {
      console.log("[assembly] captions from words count:", captions.length);
    }

    // Return both public upload URL and server-local path for rendering
    return NextResponse.json({
      captions,
      language: transcriptJson.language || "unknown",
      fullText: transcriptJson.text || (transcriptJson.words?.map((w: any) => w.text).join(" ") ?? ""),
      uploadUrl,
      localFilePath: tmpFilePath,
    });
  } catch (err: any) {
    console.error("[assembly] error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
