import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CaptionStudio - AI Video Captioning",
  description: "Automatically generate and style captions for your videos with Hinglish support",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  )
}
