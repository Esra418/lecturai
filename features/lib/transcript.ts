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

const MAX_TRANSCRIPT_CHARS = 15_000;

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

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
};

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" = otomatik
}

/** YouTube video sayfasından captionTracks listesini çeker */
async function getCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: FETCH_HEADERS,
  });

  if (!res.ok) {
    throw new TranscriptFetchError("VIDEO_UNAVAILABLE", "Video sayfasına erişilemedi.");
  }

  const html = await res.text();

  // ytInitialPlayerResponse içindeki captionTracks'i bul
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
  if (!playerMatch) {
    throw new TranscriptFetchError("TRANSCRIPT_MISSING", "Video verisi bulunamadı.");
  }

  let playerData: any;
  try {
    playerData = JSON.parse(playerMatch[1]);
  } catch {
    throw new TranscriptFetchError("TRANSCRIPT_MISSING", "Video verisi ayrıştırılamadı.");
  }

  const tracks: CaptionTrack[] =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  return tracks;
}

/** Bir caption URL'sinden cue listesi çeker (XML formatı) */
async function fetchCuesFromUrl(baseUrl: string): Promise<TranscriptCue[]> {
  // json3 formatını tercih et, olmazsa xml'e dön
  const url = baseUrl.includes("fmt=")
    ? baseUrl
    : `${baseUrl}&fmt=json3`;

  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error("Caption fetch failed: " + res.status);

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("json") || url.includes("fmt=json3")) {
    try {
      const data = await res.json();
      return parseJson3(data);
    } catch {
      // json3 başarısız olursa xml dene
    }
  }

  // XML fallback
  const xmlUrl = baseUrl.replace(/&fmt=[^&]*/g, "") + "&fmt=xml";
  const xmlRes = await fetch(xmlUrl, { headers: FETCH_HEADERS });
  if (!xmlRes.ok) throw new Error("XML caption fetch failed");
  const xml = await xmlRes.text();
  return parseXml(xml);
}

function parseJson3(data: any): TranscriptCue[] {
  const events = data?.events ?? [];
  const cues: TranscriptCue[] = [];
  for (const event of events) {
    if (!event.segs) continue;
    const startSeconds = (event.tStartMs ?? 0) / 1000;
    const text = event.segs
      .map((s: any) => s.utf8 ?? "")
      .join("")
      .replace(/[\n\r]+/g, " ")
      .trim();
    if (text && text !== "\n") {
      cues.push({ startSeconds, text });
    }
  }
  return cues;
}

function parseXml(xml: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  const regex = /<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const startSeconds = parseFloat(match[1]);
    const text = match[2]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text) cues.push({ startSeconds, text });
  }
  return cues;
}

/** Dil öncelik sırasına göre en uygun track'i seçer */
function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;

  const priority = ["tr", "en"];

  // Önce manuel (non-asr) Türkçe/İngilizce
  for (const lang of priority) {
    const manual = tracks.find((t) => t.languageCode === lang && t.kind !== "asr");
    if (manual) return manual;
  }

  // Sonra otomatik Türkçe/İngilizce
  for (const lang of priority) {
    const asr = tracks.find((t) => t.languageCode === lang);
    if (asr) return asr;
  }

  // Son çare: ilk track
  return tracks[0];
}

export async function getTranscriptCues(videoId: string): Promise<TranscriptCue[]> {
  let tracks: CaptionTrack[];
  try {
    tracks = await getCaptionTracks(videoId);
  } catch (err) {
    if (err instanceof TranscriptFetchError) throw err;
    throw new TranscriptFetchError(
      "VIDEO_UNAVAILABLE",
      "Video sayfasına erişilemedi. Video herkese açık olmalı."
    );
  }

  if (tracks.length === 0) {
    throw new TranscriptFetchError(
      "TRANSCRIPT_MISSING",
      "Bu videoda altyazı bulunamadı. Lütfen altyazısı olan bir video deneyin."
    );
  }

  const track = pickBestTrack(tracks);
  if (!track) {
    throw new TranscriptFetchError("TRANSCRIPT_MISSING", "Uygun altyazı bulunamadı.");
  }

  let cues: TranscriptCue[];
  try {
    cues = await fetchCuesFromUrl(track.baseUrl);
  } catch {
    throw new TranscriptFetchError(
      "TRANSCRIPT_UNKNOWN",
      "Altyazı verisi alınırken hata oluştu. Tekrar deneyin."
    );
  }

  if (cues.length === 0) {
    throw new TranscriptFetchError("TRANSCRIPT_EMPTY", "Altyazı boş döndü.");
  }

  return cues;
}
