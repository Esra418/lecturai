import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  type TranscriptResponse,
} from "youtube-transcript";

export type TranscriptCue = { startSeconds: number; text: string };

/**
 * youtube-transcript mixes classic XML (seconds, often fractional) with srv3 (ms integers).
 */
function cueStartSeconds(offset: number, duration: number): number {
  const offsetInteger = Number.isInteger(offset);
  const durInteger = Number.isInteger(duration);
  if (offsetInteger && durInteger && duration >= 100) {
    return offset / 1000;
  }
  return offset;
}

export function cuesToAnalystText(cues: TranscriptCue[]): string {
  return cues
    .map((c) => {
      const m = Math.floor(c.startSeconds / 60);
      const s = Math.floor(c.startSeconds % 60);
      const stamp = `${m}:${s.toString().padStart(2, "0")}`;
      return `[${stamp}] ${c.text}`;
    })
    .join("\n");
}

const MAX_TRANSCRIPT_CHARS = 120_000;

export async function getTranscriptCues(videoId: string): Promise<TranscriptCue[]> {
  let raw: TranscriptResponse[];
  try {
   try {
  raw = await fetchTranscript(videoId, [{ lang: "tr" }]);
} catch {
  try {
    raw = await fetchTranscript(videoId, [{ lang: "en" }]);
  } catch {
    raw = await fetchTranscript(videoId);
  }
}
  } catch (err) {
    if (err instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new TranscriptFetchError("VIDEO_UNAVAILABLE", "Video erişilemiyor veya kaldırılmış olabilir.");
    }
    if (err instanceof YoutubeTranscriptDisabledError) {
      throw new TranscriptFetchError("TRANSCRIPT_DISABLED", "Bu videoda altyazı/transkript kapalı.");
    }
    if (err instanceof YoutubeTranscriptNotAvailableError) {
      throw new TranscriptFetchError("TRANSCRIPT_MISSING", "Bu video için transkript bulunamadı.");
    }
    if (err instanceof YoutubeTranscriptNotAvailableLanguageError) {
      throw new TranscriptFetchError(
        "TRANSCRIPT_LANG",
        "İstenen dilde transkript yok; başka bir video deneyin.",
      );
    }
    if (err instanceof YoutubeTranscriptTooManyRequestError) {
      throw new TranscriptFetchError("TRANSCRIPT_RATE", "YouTube istek sınırı — biraz sonra tekrar deneyin.");
    }
    throw new TranscriptFetchError("TRANSCRIPT_UNKNOWN", "Transkript alınırken bir hata oluştu.");
  }

  const cues: TranscriptCue[] = raw
    .map((r) => {
      const startSeconds = cueStartSeconds(r.offset, r.duration);
      const text = r.text.replace(/\s+/g, " ").trim();
      return { startSeconds, text };
    })
    .filter((c) => c.text.length > 0);

  if (cues.length === 0) {
    throw new TranscriptFetchError("TRANSCRIPT_EMPTY", "Transkript boş döndü.");
  }

  return cues;
}

export function truncateCuesForModel(cues: TranscriptCue[]): { text: string; truncated: boolean } {
  const full = cuesToAnalystText(cues);
  if (full.length <= MAX_TRANSCRIPT_CHARS) {
    return { text: full, truncated: false };
  }
  let acc = "";
  for (const cue of cues) {
    const line = `[${Math.floor(cue.startSeconds / 60)}:${Math.floor(cue.startSeconds % 60)
      .toString()
      .padStart(2, "0")}] ${cue.text}\n`;
    if (acc.length + line.length > MAX_TRANSCRIPT_CHARS) {
      break;
    }
    acc += line;
  }
  return { text: acc.trimEnd(), truncated: true };
}

export class TranscriptFetchError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "TranscriptFetchError";
  }
}
