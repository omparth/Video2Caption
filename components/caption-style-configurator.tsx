"use client"

import { useState } from "react"
import { Palette, Type } from "lucide-react"

interface CaptionStyleConfig {
  fontFamily: "noto-sans" | "noto-devanagari" | "mixed"
  fontSize: number
  backgroundColor: string
  textColor: string
  opacity: number
  position: "bottom" | "top" | "center"
  padding: number
  borderRadius: number
}

interface CaptionStyleConfiguratorProps {
  onConfigUpdate?: (config: CaptionStyleConfig) => void
}

export default function CaptionStyleConfigurator({ onConfigUpdate }: CaptionStyleConfiguratorProps) {
  const [config, setConfig] = useState<CaptionStyleConfig>({
    fontFamily: "mixed",
    fontSize: 32,
    backgroundColor: "#000000",
    textColor: "#FFFFFF",
    opacity: 0.8,
    position: "bottom",
    padding: 12,
    borderRadius: 4,
  })

  const handleUpdate = (updates: Partial<CaptionStyleConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigUpdate?.(newConfig)
  }

  return (
    <div className="space-y-6 rounded-lg bg-card p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        Caption Styling
      </h3>

      {/* Font Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Type className="h-4 w-4" />
          Font Family
        </label>
        <select
          value={config.fontFamily}
          onChange={(e) => handleUpdate({ fontFamily: e.target.value as any })}
          className="w-full rounded-lg bg-input px-3 py-2 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="noto-sans">Noto Sans (English)</option>
          <option value="noto-devanagari">Noto Sans Devanagari (Hindi)</option>
          <option value="mixed">Mixed (Hinglish)</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Font Size: {config.fontSize}px</label>
        <input
          type="range"
          min="16"
          max="72"
          value={config.fontSize}
          onChange={(e) => handleUpdate({ fontSize: Number.parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Text Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={config.textColor}
              onChange={(e) => handleUpdate({ textColor: e.target.value })}
              className="h-10 w-16 rounded cursor-pointer"
            />
            <input
              type="text"
              value={config.textColor}
              onChange={(e) => handleUpdate({ textColor: e.target.value })}
              className="flex-1 rounded bg-input px-3 py-2 text-xs text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Background Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={config.backgroundColor}
              onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
              className="h-10 w-16 rounded cursor-pointer"
            />
            <input
              type="text"
              value={config.backgroundColor}
              onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
              className="flex-1 rounded bg-input px-3 py-2 text-xs text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Opacity: {Math.round(config.opacity * 100)}%</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.opacity}
          onChange={(e) => handleUpdate({ opacity: Number.parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Position */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Position</label>
        <div className="grid grid-cols-3 gap-2">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => handleUpdate({ position: pos })}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                config.position === pos
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground border border-border hover:bg-secondary"
              }`}
            >
              {pos.charAt(0).toUpperCase() + pos.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 rounded-lg bg-background p-6 border border-border/50">
        <p className="text-xs text-muted-foreground mb-4">Live Preview</p>
        <div
          style={{
            backgroundColor: "#1a1a1a",
            height: "120px",
            display: "flex",
            alignItems: config.position === "top" ? "flex-start" : config.position === "center" ? "center" : "flex-end",
            justifyContent: "center",
            borderRadius: "8px",
            paddingTop: config.position === "top" ? config.padding : 0,
            paddingBottom: config.position === "bottom" ? config.padding : 0,
          }}
        >
          <div
            style={{
              backgroundColor: config.backgroundColor,
              color: config.textColor,
              opacity: config.opacity,
              fontSize: `${config.fontSize * 0.6}px`,
              fontFamily: config.fontFamily === "noto-devanagari" ? '"Noto Sans Devanagari"' : "Noto Sans",
              padding: `${config.padding / 2}px ${config.padding}px`,
              borderRadius: `${config.borderRadius}px`,
              textAlign: "center",
            }}
          >
            {config.fontFamily === "noto-devanagari" ? "यह एक परीक्षण कैप्शन है" : "This is a sample caption"}
          </div>
        </div>
      </div>
    </div>
  )
}
