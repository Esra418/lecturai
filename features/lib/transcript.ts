// Artık youtube-transcript kütüphanesi kullanılmıyor.
// Transkript ve analiz doğrudan Gemini üzerinden yapılıyor (analysis.ts).

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
