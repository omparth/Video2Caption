// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import VideoUploader from "@/components/video-uploader"
import CaptionEditor from "@/components/caption-editor"
import VideoPreview from "@/components/video-preview"
import CaptionStyleConfigurator from "@/components/caption-style-configurator"
import ExportDialog from "@/components/export-dialog"
import { Download } from "lucide-react"

interface Caption {
  text: string
  start: number
  end: number
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [captions, setCaptions] = useState<Caption[]>([])
  const [captionStyle, setCaptionStyle] = useState<"bottom" | "top" | "karaoke">("bottom")
  const [showExport, setShowExport] = useState(false)

  // public assembly ai upload url (optional)
  const [videoUrl, setVideoUrl] = useState<string>("")
  // server local file path returned by /api/generate-captions (preferred for render)
  const [localVideoPath, setLocalVideoPath] = useState<string>("")

  // create object URL for preview (local)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>("")
  useEffect(() => {
    if (!uploadedFile) {
      setLocalPreviewUrl("")
      setVideoUrl("")
      setLocalVideoPath("")
      return
    }
    const url = URL.createObjectURL(uploadedFile)
    setLocalPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [uploadedFile])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Parth V2C</h1>
            <p className="text-sm text-muted-foreground">AI-powered video captioning</p>
          </div>
          {uploadedFile && captions.length > 0 && (
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Video
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {!uploadedFile ? (
          <VideoUploader onFileUpload={setUploadedFile} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <VideoPreview file={uploadedFile} captions={captions} style={captionStyle} />
              <CaptionStyleConfigurator />
            </div>
            <div className="space-y-6">
              <CaptionEditor
                file={uploadedFile}
                onCaptionsUpdate={(c) => setCaptions(c)}
                onStyleChange={(s) => setCaptionStyle(s)}
                currentStyle={captionStyle}
                onVideoUrl={(uploadUrl, localPath) => {
                  if (uploadUrl) {
                    console.log("Received public upload url:", uploadUrl)
                    setVideoUrl(uploadUrl)
                  }
                  if (localPath) {
                    console.log("Received server-local file path:", localPath)
                    setLocalVideoPath(localPath)
                  }
                }}
              />
              {uploadedFile && (
                <button
                  onClick={() => {
                    setUploadedFile(null)
                    setVideoUrl("")
                    setCaptions([])
                    setLocalVideoPath("")
                  }}
                  className="w-full rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  Upload Different Video
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Export Dialog */}
      {/* Prefer server-local path first -> then public upload url -> then preview */}
      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        captions={captions}
        style={captionStyle}
        inputVideoUrl={localVideoPath || videoUrl || localPreviewUrl}
      />
    </div>
  )
}
