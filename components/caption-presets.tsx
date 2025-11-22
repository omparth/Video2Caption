"use client"

import { useState } from "react"
import { Save, MoreVertical } from "lucide-react"

interface CaptionPreset {
  id: string
  name: string
  description: string
  config: {
    fontFamily: string
    fontSize: number
    backgroundColor: string
    textColor: string
    opacity: number
    position: "bottom" | "top" | "center"
  }
}

const DEFAULT_PRESETS: CaptionPreset[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional white text on black background",
    config: {
      fontFamily: "noto-sans",
      fontSize: 32,
      backgroundColor: "#000000",
      textColor: "#FFFFFF",
      opacity: 0.8,
      position: "bottom",
    },
  },
  {
    id: "news",
    name: "News Style",
    description: "Blue bar at top with white text",
    config: {
      fontFamily: "noto-sans",
      fontSize: 28,
      backgroundColor: "#0080FF",
      textColor: "#FFFFFF",
      opacity: 0.95,
      position: "top",
    },
  },
  {
    id: "karaoke",
    name: "Karaoke",
    description: "Yellow highlight effect",
    config: {
      fontFamily: "mixed",
      fontSize: 36,
      backgroundColor: "#FFC800",
      textColor: "#000000",
      opacity: 0.95,
      position: "bottom",
    },
  },
  {
    id: "hindi",
    name: "Hindi Optimized",
    description: "Designed for Devanagari script",
    config: {
      fontFamily: "noto-devanagari",
      fontSize: 34,
      backgroundColor: "#1a1a1a",
      textColor: "#FFFFFF",
      opacity: 0.85,
      position: "bottom",
    },
  },
]

interface CaptionPresetsProps {
  onPresetSelect?: (preset: CaptionPreset) => void
}

export default function CaptionPresets({ onPresetSelect }: CaptionPresetsProps) {
  const [presets, setPresets] = useState<CaptionPreset[]>(DEFAULT_PRESETS)
  const [savedPresets, setSavedPresets] = useState<CaptionPreset[]>([])

  const handleSavePreset = (name: string, config: any) => {
    const newPreset: CaptionPreset = {
      id: `custom-${Date.now()}`,
      name,
      description: "Custom preset",
      config,
    }
    setSavedPresets([...savedPresets, newPreset])
  }

  return (
    <div className="space-y-4 rounded-lg bg-card p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Save className="h-5 w-5 text-primary" />
        Caption Presets
      </h3>

      <div className="space-y-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onPresetSelect?.(preset)}
            className="w-full text-left rounded-lg p-3 transition-colors border border-border bg-background hover:bg-secondary"
          >
            <div className="font-medium text-foreground">{preset.name}</div>
            <div className="text-xs text-muted-foreground">{preset.description}</div>
          </button>
        ))}
      </div>

      {savedPresets.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="text-sm font-medium text-foreground mb-2">Saved Presets</div>
          <div className="space-y-2">
            {savedPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onPresetSelect?.(preset)}
                className="w-full text-left rounded-lg p-3 transition-colors border border-border bg-background hover:bg-secondary flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-foreground">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">Custom</div>
                </div>
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
