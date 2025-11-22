
//components/caption-export.tsx
"use client"

import { useState } from "react"
import { Download, FileText } from "lucide-react"

interface Caption {
  text: string
  start: number
  end: number
}

interface CaptionExportProps {
  captions: Caption[]
}

export default function CaptionExport({ captions }: CaptionExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "srt" | "vtt") => {
    if (captions.length === 0) return

    setIsExporting(true)
    try {
      const response = await fetch("/api/caption-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captions, format }),
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `captions.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg bg-card p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Export Captions
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleExport("srt")}
          disabled={isExporting || captions.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground border border-border hover:bg-secondary disabled:opacity-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export SRT
        </button>
        <button
          onClick={() => handleExport("vtt")}
          disabled={isExporting || captions.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground border border-border hover:bg-secondary disabled:opacity-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export VTT
        </button>
      </div>

      <p className="text-xs text-muted-foreground">Export captions as subtitle files for use in video players</p>
    </div>
  )
}
