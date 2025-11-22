// components/video-preview.tsx
"use client"

import { useEffect, useRef, useState } from "react"

interface Caption {
  text: string
  start: number
  end: number
}

interface VideoPreviewProps {
  file: File
  captions: Caption[]
  style: "bottom" | "top" | "karaoke"
}

export default function VideoPreview({ file, captions, style }: VideoPreviewProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!file) {
      setVideoUrl(null)
      setVideoDuration(0)
      return
    }

    const url = URL.createObjectURL(file)
    setVideoUrl(url)

    // get duration using a temp video element
    const temp = document.createElement("video")
    temp.src = url
    const onLoaded = () => {
      setVideoDuration(Math.ceil(temp.duration || 0))
    }
    temp.addEventListener("loadedmetadata", onLoaded)

    return () => {
      temp.removeEventListener("loadedmetadata", onLoaded)
      try {
        URL.revokeObjectURL(url)
      } catch (e) {}
      setVideoUrl(null)
      setVideoDuration(0)
      setCurrentTime(0)
    }
  }, [file])

  // attach timeupdate only when real video element is mounted
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime || 0)
    v.addEventListener("timeupdate", onTime)
    return () => {
      v.removeEventListener("timeupdate", onTime)
    }
  }, [videoRef, videoUrl])

  // pick active caption based on currentTime
  const activeCaption = captions.find((c) => currentTime >= c.start && currentTime <= c.end)

  // caption base style
  const captionBoxStyle: React.CSSProperties = {
    position: "absolute",
    left: "5%",
    width: "90%",
    padding: "10px 18px",
    fontWeight: 600,
    textAlign: "center",
    pointerEvents: "none",
    borderRadius: 6,
    textShadow: "2px 2px 8px rgba(0,0,0,0.6)",
    maxHeight: "40%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }

  // dynamic caption style
  let styleObj: React.CSSProperties = {
    ...captionBoxStyle,
    bottom: "8%",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.65)",
    fontSize: "clamp(16px, 2.2vw, 28px)",
  }

  if (style === "top") {
    styleObj = {
      ...captionBoxStyle,
      top: "6%",
      color: "#fff",
      backgroundColor: "rgba(0,128,255,0.9)",
      fontSize: "clamp(14px, 1.8vw, 24px)",
    }
  } else if (style === "karaoke") {
    styleObj = {
      ...captionBoxStyle,
      bottom: "12%",
      color: "#000",
      backgroundColor: "rgba(255,200,0,0.95)",
      fontSize: "clamp(16px, 2.2vw, 28px)",
    }
  }

  return (
    <div className="rounded-lg bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Preview with Captions</h3>

        <div className="relative overflow-hidden rounded-lg bg-black aspect-video" style={{ minHeight: 360 }}>
          {/* Render video only when we have a valid URL */}
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full object-cover"
              style={{ display: "block", backgroundColor: "black" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Loading video...
            </div>
          )}

          {/* Caption overlay */}
          {activeCaption && (
            <div style={styleObj}>
              <div style={{ transition: "opacity 200ms ease", opacity: 1 }}>{activeCaption.text}</div>
            </div>
          )}

          {!activeCaption && captions.length > 0 && (
            <div style={{ ...captionBoxStyle, bottom: "8%", color: "rgba(255,255,255,0.6)", backgroundColor: "transparent", fontSize: 14 }}>
              (No caption for current time)
            </div>
          )}
        </div>
      </div>

      {/* Native Video Info */}
      <div className="mt-4 p-4 bg-background rounded-lg border border-border">
        <p className="text-xs text-muted-foreground mb-2">Native Video Preview</p>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-foreground">Duration: {formatTime(videoDuration)}</div>
          <div className="text-xs text-muted-foreground">Time: {formatTime(Math.floor(currentTime))}</div>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
