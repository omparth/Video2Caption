// components/export-dialog.tsx
"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Download, Link as LinkIcon, X } from "lucide-react";

interface Caption {
  text: string;
  start: number;
  end: number;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  captions: Caption[];
  style: "bottom" | "top" | "karaoke";
  inputVideoUrl?: string;
}

const ENTRY_PATH = "components/remotion-entry.tsx"; // update if your entry file is at src/components/...

export default function ExportDialog({
  open,
  onOpenChange,
  captions,
  style,
  inputVideoUrl = "",
}: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const localFileFallback =
    "file:///C:/Users/Life/Downloads/Simora_Assessment/The%203-2-1%20Speaking%20Trick%20That%20Forces%20You%20To%20Stop%20Rambling!.mp4";

  const getFinalInputVideoUrl = () => {
    try {
      if (inputVideoUrl && inputVideoUrl.trim()) return inputVideoUrl;
      // @ts-ignore
      if (typeof window !== "undefined" && (window as any).__uploadedVideoUrl) {
        // @ts-ignore
        return (window as any).__uploadedVideoUrl as string;
      }
    } catch (e) {}
    return localFileFallback;
  };

  async function tryDownloadFromStream(finalVideoUrl: string) {
    setStatusMsg("Rendering and streaming from server (may take a while)…");
    const resp = await fetch("/api/render-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        captions,
        style,
        entry: ENTRY_PATH,
        composition: "Main",
        inputVideoUrl: finalVideoUrl,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`Streaming endpoint failed: ${resp.status} ${txt || resp.statusText}`);
    }

    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "video-with-captions.mp4";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDownloadUrl(blobUrl);
  }

  async function tryDownloadFromUrlFlow(finalVideoUrl: string) {
    setStatusMsg("Requesting render (will return URL when complete)...");
    const resp = await fetch("/api/render-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        captions,
        style,
        entry: ENTRY_PATH,
        composition: "Main",
        inputVideoUrl: finalVideoUrl,
      }),
    });

    const json = await resp.json().catch(() => null);
    if (!resp.ok) {
      throw new Error(json?.error ?? `Render API failed: ${resp.status}`);
    }

    if (json?.url) {
      const absolute = json.url.startsWith("http") ? json.url : `${window.location.origin}${json.url}`;
      setDownloadUrl(absolute);
      try {
        window.open(absolute, "_blank");
      } catch (e) {}
      const a = document.createElement("a");
      a.href = absolute;
      a.download = "video-with-captions.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    throw new Error(json?.message || "Render completed but no download url returned.");
  }

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setExportComplete(false);
    setStatusMsg(null);
    setDownloadUrl(null);

    const finalVideoUrl = getFinalInputVideoUrl();
    console.log("ExportDialog: entry =", ENTRY_PATH, "using inputVideoUrl ->", finalVideoUrl);

    try {
      try {
        await tryDownloadFromStream(finalVideoUrl);
      } catch (streamErr) {
        console.warn("stream endpoint failed — falling back to url flow:", streamErr);
        await tryDownloadFromUrlFlow(finalVideoUrl);
      }

      setStatusMsg(null);
      setExportComplete(true);
      setIsExporting(false);
    } catch (err: any) {
      console.error("Export error:", err);
      setError(err?.message ?? String(err));
      setIsExporting(false);
      setStatusMsg(null);
      setExportComplete(false);
    }
  };

  const handleClose = () => {
    if (downloadUrl && downloadUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(downloadUrl);
      } catch (e) {}
    }
    setIsExporting(false);
    setError(null);
    setExportComplete(false);
    setDownloadUrl(null);
    setStatusMsg(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg p-6 max-w-lg w-full border border-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Export Video</h2>
            <p className="text-sm text-muted-foreground">Your captions will be baked into the exported MP4.</p>
          </div>
          <button onClick={handleClose} className="rounded p-1 hover:bg-secondary/60" aria-label="Close export dialog">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="bg-background rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Export Settings</div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <div className="font-medium">Captions: {captions.length}</div>
              <div className="font-medium">Style: {style.charAt(0).toUpperCase() + style.slice(1)}</div>
              <div className="font-medium">Format: MP4 (H.264)</div>
              <div className="font-medium">Video source: {getFinalInputVideoUrl() ? "Provided" : "Not provided"}</div>
            </div>
          </div>

          {statusMsg && <div className="text-sm text-muted-foreground">{statusMsg}</div>}

          {error && (
            <div className="flex gap-3 rounded-lg bg-destructive/10 p-3 text-destructive items-start">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {exportComplete && downloadUrl && (
            <div className="flex flex-col gap-2 items-start rounded-lg bg-green-50 p-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Video exported successfully</div>
                  <div className="text-sm text-muted-foreground">Click the link below to open or download.</div>
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded px-3 py-2 border border-border text-sm hover:bg-secondary transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  Open / Download
                </a>
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = downloadUrl!;
                    a.download = "video-with-captions.mp4";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                  className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-1">
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="flex-1 rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Rendering...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Now
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Rendering happens on your dev machine — it may take several seconds to minutes depending on video length. Check server terminal for logs.
          </p>
        </div>
      </div>
    </div>
  );
}
