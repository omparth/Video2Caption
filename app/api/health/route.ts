//app/api/health/route.ts

import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      whisper_api: process.env.OPENAI_API_KEY ? "configured" : "not_configured",
      remotion: "available",
    },
  })
}
