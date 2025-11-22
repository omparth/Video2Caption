//app/api/caption-export/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { captionsToSRT, captionsToVTT } from "@/lib/caption-utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { captions, format } = body

    if (!captions || !Array.isArray(captions)) {
      return NextResponse.json({ error: "Invalid captions data" }, { status: 400 })
    }

    if (!format || !["srt", "vtt"].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use "srt" or "vtt"' }, { status: 400 })
    }

    let content: string
    let mimeType: string
    let filename: string

    if (format === "srt") {
      content = captionsToSRT(captions)
      mimeType = "application/x-subrip"
      filename = "captions.srt"
    } else {
      content = captionsToVTT(captions)
      mimeType = "text/vtt"
      filename = "captions.vtt"
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Caption export error:", error)
    return NextResponse.json({ error: "Failed to export captions" }, { status: 500 })
  }
}
