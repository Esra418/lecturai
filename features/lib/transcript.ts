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

// Deneyeceğimiz dil sırası:
// tr   → manuel Türkçe altyazı
// a.tr → YouTube otomatik Türkçe
// en   → manuel İngilizce
// a.en → YouTube otomatik İngilizce
const LANGUAGE_FALLBACK_CHAINS = [
  ["tr", "a.tr", "en", "a.en"],
  ["a.tr", "tr", "a.en", "en"],
  ["en", "a.en"],
];

async function tryFetchWithLanguages(
  videoId: string,
  languages: string[]
): Promise<TranscriptResponse[]> {
  // Önce hepsini birden dene (kütüphane ilk bulduğunu alır)
  try {
    return await (fetchTranscript as any)(videoId, { languages });
  } catch {
    // Tek tek dene
    for (const lang of languages) {
      try {
        return await (fetchTranscript as any)(videoId, { languages: [lang] });
      } catch {
        continue;
      }
    }
    throw new Error("Hiçbir dilde transkript bulunamadı.");
  }
}

export async function getTranscriptCues(videoId: string): Promise<TranscriptCue[]> {
  let raw: TranscriptResponse[];
  try {
    raw = await tryFetchWithLanguages(videoId, ["tr", "a.tr", "en", "a.en"]);
  } catch (err) {
    if (err instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new TranscriptFetchError("VIDEO_UNAVAILABLE", "Video erişilemiyor veya kaldırılmış olabilir.");
    }
    if (err instanceof YoutubeTranscriptDisabledError) {
      throw new TranscriptFetchError(
        "TRANSCRIPT_DISABLED",
        "Bu videoda altyazı/transkript kapalı. Lütfen altyazısı açık bir video deneyin."
      );
    }
    if (err instanceof YoutubeTranscriptNotAvailableError) {
      throw new TranscriptFetchError(
        "TRANSCRIPT_MISSING",
        "Bu video için transkript bulunamadı. Video sahibi altyazı eklememiş olabilir."
      );
    }
    if (err instanceof YoutubeTranscriptNotAvailableLanguageError) {
      throw new TranscriptFetchError(
        "TRANSCRIPT_LANG",
        "Bu videoda Türkçe veya İngilizce altyazı yok. Başka bir video deneyin."
      );
    }
    if (err instanceof YoutubeTranscriptTooManyRequestError) {
      throw new TranscriptFetchError(
        "TRANSCRIPT_RATE",
        "YouTube istek sınırına ulaşıldı. Birkaç dakika bekleyip tekrar deneyin."
      );
    }
    throw new TranscriptFetchError(
      "TRANSCRIPT_UNKNOWN",
      "Transkript alınırken bir hata oluştu. Video herkese açık ve altyazılı olmalı."
    );
  }

  const cues: TranscriptCue[] = raw
    .map((r) => {
      const startSeconds = cueStartSeconds(r.offset, r.duration);
      const text = r.text.replace(/\s+/g, " ").trim();
      return { startSeconds, text };
    })
    .filter((c) => c.text.length > 0);

  if (cues.length === 0) {
    throw new TranscriptFetchError(
      "TRANSCRIPT_EMPTY",
      "Transkript boş döndü. Video konuşma içermiyor olabilir."
    );
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
    const line = `[${Math.floor(cue.startSeconds / 60)}:${Math.floor(cue.startSeconds % 60).toString().padStart(2, "0")}] ${cue.text}\n`;
    if (acc.length + line.length > MAX_TRANSCRIPT_CHARS) break;
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
