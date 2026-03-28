import { NextResponse } from "next/server";
import { z } from "zod";

import { runGeminiAnalysis } from "@/lib/analysis";
import {
  getTranscriptCues,
  TranscriptFetchError,
  truncateCuesForModel,
  type TranscriptCue,
} from "@/lib/transcript";
import { extractYouTubeVideoId } from "@/lib/youtube";

const bodySchema = z.object({
  url: z.string().min(1),
});

const MAX_VIDEO_SECONDS = 2 * 60 * 60; // user-flow.md

function formatTranscriptForClient(cues: TranscriptCue[], maxLines = 200) {
  const slice = cues.length > maxLines ? cues.slice(0, maxLines) : cues;
  return {
    lines: slice.map((c) => {
      const m = Math.floor(c.startSeconds / 60);
      const s = Math.floor(c.startSeconds % 60);
      return {
        timestamp: `${m}:${s.toString().padStart(2, "0")}`,
        startSeconds: c.startSeconds,
        text: c.text,
      };
    }),
    truncated: cues.length > maxLines,
    totalCues: cues.length,
  };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "YouTube URL gerekli." }, { status: 400 });
  }

  const { url } = parsed.data;
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "Lütfen geçerli bir YouTube linki girin." },
      { status: 400 },
    );
  }

  let cues: TranscriptCue[];
  try {
    cues = await getTranscriptCues(videoId);
  } catch (err) {
    if (err instanceof TranscriptFetchError) {
      const status = err.code === "TRANSCRIPT_RATE" ? 429 : 422;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    throw err;
  }

  const lastStart = cues[cues.length - 1]!.startSeconds;
  if (lastStart > MAX_VIDEO_SECONDS) {
    return NextResponse.json(
      { error: "Video 2 saatten kısa olmalı.", code: "VIDEO_TOO_LONG" },
      { status: 400 },
    );
  }

  const { text: transcriptBlock, truncated: transcriptTruncated } = truncateCuesForModel(cues);

  let analysis;
  try {
    analysis = await runGeminiAnalysis(transcriptBlock);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: "Bir sorun oluştu, tekrar deneyin." }, { status: 502 });
  }

  return NextResponse.json({
    videoId,
    analysis,
    transcript: formatTranscriptForClient(cues),
    meta: {
      transcriptTruncatedForModel: transcriptTruncated,
    },
  });
}
