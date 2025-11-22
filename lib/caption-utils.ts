/**
 * Utility functions for caption processing and validation
 */

export interface Caption {
  text: string
  start: number
  end: number
}

/**
 * Validates caption timing
 */
export function isValidCaption(caption: Caption): boolean {
  return (
    caption.text.trim().length > 0 &&
    caption.start >= 0 &&
    caption.end > caption.start &&
    !isNaN(caption.start) &&
    !isNaN(caption.end)
  )
}

/**
 * Converts captions to SRT format for export
 */
export function captionsToSRT(captions: Caption[]): string {
  return captions
    .map((cap, idx) => {
      const startTime = formatSRTTime(cap.start)
      const endTime = formatSRTTime(cap.end)
      return `${idx + 1}\n${startTime} --> ${endTime}\n${cap.text}\n`
    })
    .join("\n")
}

/**
 * Converts captions to VTT format for export
 */
export function captionsToVTT(captions: Caption[]): string {
  let vtt = "WEBVTT\n\n"
  vtt += captions
    .map((cap) => {
      const startTime = formatSRTTime(cap.start)
      const endTime = formatSRTTime(cap.end)
      return `${startTime} --> ${endTime}\n${cap.text}`
    })
    .join("\n\n")
  return vtt
}

/**
 * Formats seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`
}

/**
 * Detects if text contains Devanagari script
 */
export function hasDevanagariScript(text: string): boolean {
  return /[\u0900-\u097F]/.test(text)
}

/**
 * Detects language from captions
 */
export function detectLanguage(captions: Caption[]): "en" | "hi" | "mixed" {
  let devanagariCount = 0
  let englishCount = 0

  captions.forEach((cap) => {
    if (hasDevanagariScript(cap.text)) devanagariCount++
    if (/[a-zA-Z]/.test(cap.text)) englishCount++
  })

  if (devanagariCount > 0 && englishCount > 0) return "mixed"
  if (devanagariCount > englishCount) return "hi"
  return "en"
}
