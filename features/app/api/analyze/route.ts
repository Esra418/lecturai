import { NextResponse } from "next/server";
import { z } from "zod";

import { runGeminiAnalysis } from "@/lib/analysis";
import { extractYouTubeVideoId } from "@/lib/youtube";

const bodySchema = z.object({
  url: z.string().min(1),
  quizCount: z.number().optional().default(5),
  customInstructions: z.string().optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Gerekli alanlar eksik veya hatalı." }, { status: 400 });
  }

  const { url } = parsed.data;
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "Lütfen geçerli bir YouTube linki girin." },
      { status: 400 },
    );
  }

  // Temiz URL oluştur (playlist parametrelerini at)
  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let analysis;
  try {
    analysis = await runGeminiAnalysis(cleanUrl);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json(
      { error: "Video analiz edilemedi. Video herkese açık olmalı ve içerik politikasına uygun olmalı." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    videoId,
    analysis,
    transcript: { lines: [], truncated: false, totalCues: 0 },
    fullTranscript: "",
    meta: {
      transcriptTruncatedForModel: false,
      source: "gemini-video",
    },
  });
}
