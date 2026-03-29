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

const MAX_TRANSCRIPT_CHARS = 120_000;

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

/**
 * RapidAPI bazen milisaniye bazen saniye döndürür.
 * İlk segmentin değerine bakarak otomatik tespit eder.
 */
function toSeconds(value: number, isMilli: boolean): number {
  return isMilli ? value / 1000 : value;
}

export async function getTranscriptCues(videoId: string): Promise<TranscriptCue[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new TranscriptFetchError("CONFIG_ERROR", "RAPIDAPI_KEY tanımlı değil.");
  }

  const url = `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });
  } catch {
    throw new TranscriptFetchError("TRANSCRIPT_UNKNOWN", "Transkript servisine bağlanılamadı.");
  }

  if (res.status === 404) {
    throw new TranscriptFetchError("TRANSCRIPT_MISSING", "Bu videoda altyazı bulunamadı. Lütfen altyazısı olan bir video deneyin.");
  }

  if (!res.ok) {
    throw new TranscriptFetchError("TRANSCRIPT_UNKNOWN", "Transkript alınırken hata oluştu. Tekrar deneyin.");
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new TranscriptFetchError("TRANSCRIPT_UNKNOWN", "Transkript verisi okunamadı.");
  }

  const segments: any[] = data?.transcript ?? data?.results ?? data ?? [];

  if (!Array.isArray(segments) || segments.length === 0) {
    throw new TranscriptFetchError("TRANSCRIPT_EMPTY", "Altyazı boş döndü.");
  }

  // İlk segment'in offset değerine bak:
  // Eğer 1000'den büyükse milisaniye, küçükse saniye kabul et
  const firstOffset = Number(segments[0]?.offset ?? segments[0]?.start ?? segments[0]?.startTime ?? 0);
  // Video genelde 0'dan başlar, 2. segmente bak daha güvenli
  const secondOffset = Number(segments[1]?.offset ?? segments[1]?.start ?? segments[1]?.startTime ?? 0);
  const isMilli = secondOffset > 1000;

  const cues: TranscriptCue[] = segments
    .map((seg: any) => {
      const raw = Number(seg.offset ?? seg.start ?? seg.startTime ?? 0);
      const startSeconds = toSeconds(raw, isMilli);
      const text = String(seg.text ?? seg.content ?? "").replace(/[\n\r]+/g, " ").trim();
      return { startSeconds, text };
    })
    .filter((c: TranscriptCue) => c.text.length > 0);

  if (cues.length === 0) {
    throw new TranscriptFetchError("TRANSCRIPT_EMPTY", "Altyazı içeriği boş.");
  }

  return cues;
}
