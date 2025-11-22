"use client"

import { useState } from "react"
import { Zap, Settings2, AlertCircle } from "lucide-react"

interface Caption {
  text: string
  start: number
  end: number
}

interface CaptionEditorProps {
  file: File | null
  onCaptionsUpdate: (captions: Caption[]) => void
  onStyleChange: (style: "bottom" | "top" | "karaoke") => void
  currentStyle: "bottom" | "top" | "karaoke"
  // NEW: callback to receive video URLs returned by server
  onVideoUrl?: (uploadUrl: string | null, localFilePath?: string | null) => void
}

export default function CaptionEditor({
  file,
  onCaptionsUpdate,
  onStyleChange,
  currentStyle,
  onVideoUrl,
}: CaptionEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [captions, setCaptions] = useState<Caption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState<string>("")

  const handleGenerateCaptions = async () => {
    if (!file) return
    setIsGenerating(true)
    setError(null)

    try {
      console.log("[v0] Uploading file:", file.name)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/generate-captions", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] API response status:", response.status)

      const contentType = response.headers.get("content-type")

      let data: any = null
      if (contentType?.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text)
        throw new Error(`Server returned an error (${response.status}).`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate captions (Error: ${response.status})`)
      }

      const newCaptions: Caption[] = data.captions || []

      console.log("[v0] Captions generated:", newCaptions.length)

      // --- ADDED: log + expose to dev console for quick copy/paste ---
      try {
        console.log("CAPTIONS ARRAY:", newCaptions)
        // @ts-ignore
        if (typeof window !== "undefined") (window as any).__CAPTIONS__ = newCaptions
      } catch (e) {
        // ignore errors when touching window in some environments
      }

      setCaptions(newCaptions)
      setLanguage(data.language || "")
      onCaptionsUpdate(newCaptions)

      // Notify caller about video URLs / local path for rendering
      try {
        if (onVideoUrl) {
          onVideoUrl(data.uploadUrl ?? null, data.localFilePath ?? null)
        } else {
          // fallback global var for older code (optional)
          // @ts-ignore
          if (typeof window !== "undefined") (window as any).__uploadedVideoUrl = data.uploadUrl ?? null
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      console.error("[v0] Error generating captions:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCaptionEdit = (index: number, field: "text" | "start" | "end", value: string) => {
    const newCaptions = [...captions]
    if (field === "text") {
      newCaptions[index].text = value
    } else {
      newCaptions[index][field] = Number.parseFloat(value) || 0
    }

    // --- ADDED: log + expose updated captions after manual edit ---
    try {
      console.log("CAPTIONS ARRAY (edited):", newCaptions)
      // @ts-ignore
      if (typeof window !== "undefined") (window as any).__CAPTIONS__ = newCaptions
    } catch (e) {
      // ignore
    }

    setCaptions(newCaptions)
    onCaptionsUpdate(newCaptions)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Auto-Generate Captions
        </h3>

        <button
          onClick={handleGenerateCaptions}
          disabled={isGenerating || !file}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? "Generating... (This may take a minute)" : "Generate Captions"}
        </button>

        {language && <p className="mt-2 text-xs text-muted-foreground">Detected language: {language}</p>}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Error generating captions</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-card p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Caption Style
        </h3>

        <div className="space-y-3">
          {[
            { value: "bottom" as const, label: "Bottom Centered", desc: "Standard subtitle style" },
            { value: "top" as const, label: "Top Bar", desc: "News-style captions" },
            { value: "karaoke" as const, label: "Karaoke", desc: "Highlighted text style" },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => onStyleChange(s.value)}
              className={`w-full text-left rounded-lg p-3 transition-colors border ${
                currentStyle === s.value ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary"
              }`}
            >
              <div className="font-medium text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {captions.length > 0 && (
        <div className="rounded-lg bg-card p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Generated Captions ({captions.length})</h3>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {captions.map((cap, idx) => (
              <div key={idx} className="rounded bg-background p-4 space-y-2 border border-border/50">
                <input
                  type="text"
                  value={cap.text}
                  onChange={(e) => handleCaptionEdit(idx, "text", e.target.value)}
                  className="w-full bg-input px-3 py-2 rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Caption text"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={cap.start}
                    onChange={(e) => handleCaptionEdit(idx, "start", e.target.value)}
                    className="bg-input px-3 py-1 rounded text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Start (s)"
                    step="0.1"
                  />
                  <input
                    type="number"
                    value={cap.end}
                    onChange={(e) => handleCaptionEdit(idx, "end", e.target.value)}
                    className="bg-input px-3 py-1 rounded text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="End (s)"
                    step="0.1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
