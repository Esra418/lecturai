import { Innertube } from "youtubei.js";

export type TranscriptCue = { startSeconds: number; text: string };

export class TranscriptFetchError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "TranscriptFetchError";
  }
}

export function cuesToAnalystText(cues: TranscriptCue[]): string {
  return cues
    .map((c) => {
      const m = Math.floor(c.startSeconds / 60);
      const s = Math.floor(c.startSeconds % 60);
      return `[${m}:${s.toString().padStart(2, "0")}] ${c.text}`;
    })
    .join("\n");
}

const MAX_TRANSCRIPT_CHARS = 5_000;

export function truncateCuesForModel(cues: TranscriptCue[]): { text: string; truncated: boolean } {
  const full = cuesToAnalystText(cues);
  if (full.length <= MAX_TRANSCRIPT_CHARS) return { text: full, truncated: false };
  let acc = "";
  for (const cue of cues) {
    const m = Math.floor(cue.startSeconds / 60);
    const s = Math.floor(cue.startSeconds % 60);
    const line = `[${m}:${s.toString().padStart(2, "0")}] ${cue.text}\n`;
    if (acc.length + line.length > MAX_TRANSCRIPT_CHARS) break;
    acc += line;
  }
  return { text: acc.trimEnd(), truncated: true };
}

export async function getTranscriptCues(videoId: string): Promise<TranscriptCue[]> {
  let yt: Awaited<ReturnType<typeof Innertube.create>>;
  try {
    yt = await Innertube.create({
      retrieve_player: false,
      generate_session_locally: true,
    });
  } catch {
    throw new TranscriptFetchError("VIDEO_UNAVAILABLE", "YouTube bağlantısı kurulamadı.");
  }

  let info: any;
  try {
    info = await yt.getInfo(videoId);
  } catch {
    throw new TranscriptFetchError("VIDEO_UNAVAILABLE", "Video bilgisi alınamadı. Video herkese açık olmalı.");
  }

  // Transkript al
  let transcriptData: any;
  try {
    transcriptData = await info.getTranscript();
  } catch {
    throw new TranscriptFetchError(
      "TRANSCRIPT_MISSING",
      "Bu videoda altyazı bulunamadı. Lütfen altyazısı olan bir video deneyin."
    );
  }

  if (!transcriptData) {
    throw new TranscriptFetchError(
      "TRANSCRIPT_MISSING",
      "Bu videoda altyazı bulunamadı. Lütfen altyazısı olan bir video deneyin."
    );
  }

  // Segmentleri çıkar
  const segments =
    transcriptData?.transcript?.content?.body?.initial_segments ??
    transcriptData?.content?.body?.initial_segments ??
    [];

  if (!segments || segments.length === 0) {
    throw new TranscriptFetchError("TRANSCRIPT_EMPTY", "Altyazı boş döndü.");
  }

  const cues: TranscriptCue[] = segments
    .filter((seg: any) => seg?.snippet?.text)
    .map((seg: any) => {
      const startMs = seg.start_ms ?? seg.startMs ?? 0;
      const startSeconds = Number(startMs) / 1000;
      const text = (seg.snippet?.text ?? "")
        .replace(/[\n\r]+/g, " ")
        .trim();
      return { startSeconds, text };
    })
    .filter((c: TranscriptCue) => c.text.length > 0);

  if (cues.length === 0) {
    throw new TranscriptFetchError("TRANSCRIPT_EMPTY", "Altyazı içeriği boş.");
  }

  return cues;
}
