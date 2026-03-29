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

// YouTube'un resmi timedtext API'si üzerinden altyazı çeker
// Key gerektirmez, Vercel'den çalışır
async function fetchTimedText(videoId: string, lang: string): Promise<TranscriptCue[] | null> {
  try {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "tr,en;q=0.9" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const events = data?.events;
    if (!Array.isArray(events) || events.length === 0) return null;

    const cues: TranscriptCue[] = [];
    for (const event of events) {
      if (!event.segs) continue;
      const startSeconds = (event.tStartMs ?? 0) / 1000;
      const text = event.segs
        .map((s: any) => s.utf8 ?? "")
        .join("")
        .replace(/\s+/g, " ")
        .trim();
      if (text && text !== "\n") {
        cues.push({ startSeconds, text });
      }
    }
    return cues.length > 0 ? cues : null;
  } catch {
    return null;
  }
}

// YouTube watch sayfasından mevcut altyazı listesini çeker
async function fetchAvailableTracks(videoId: string): Promise<string[]> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "tr,en;q=0.9",
      },
    });
    const html = await res.text();

    // captionTracks listesini bul
    const match = html.match(/"captionTracks":(\[.*?\])/);
    if (!match) return [];

    const tracks = JSON.parse(match[1]);
    return tracks.map((t: any) => t.languageCode ?? "");
  } catch {
    return [];
  }
}

export async function getTranscriptCues(videoId: string): Promise<TranscriptCue[]> {
  // Önce mevcut dilleri öğren
  const availableLangs = await fetchAvailableTracks(videoId);

  // Deneme sırası: tr, a.tr (otomatik Türkçe), en, a.en
  const tryOrder = ["tr", "a.tr", "en", "a.en", ...availableLangs];
  const seen = new Set<string>();

  for (const lang of tryOrder) {
    if (seen.has(lang)) continue;
    seen.add(lang);

    const cues = await fetchTimedText(videoId, lang);
    if (cues && cues.length > 0) return cues;
  }

  throw new TranscriptFetchError(
    "TRANSCRIPT_MISSING",
    "Bu video için altyazı bulunamadı. Lütfen altyazısı olan bir video deneyin."
  );
}
