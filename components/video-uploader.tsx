//components/video-uploader.tsx

"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Upload, AlertCircle } from "lucide-react"

interface VideoUploaderProps {
  onFileUpload: (file: File) => void
}

export default function VideoUploader({ onFileUpload }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file")
      return false
    }
    if (file.size > 500 * 1024 * 1024) {
      setError("File size must be less than 500MB")
      return false
    }
    setError(null)
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0 && validateFile(files[0])) {
      onFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0 && validateFile(files[0])) {
      onFileUpload(files[0])
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
        }`}
      >
        <input ref={inputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />

        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

        <h2 className="text-2xl font-semibold text-foreground mb-2">Upload Your Video</h2>
        <p className="text-muted-foreground mb-6">Drag and drop your .mp4 file here, or click to select</p>

        <button
          onClick={() => inputRef.current?.click()}
          className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Choose File
        </button>

        <p className="mt-6 text-sm text-muted-foreground">Maximum file size: 500MB</p>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
