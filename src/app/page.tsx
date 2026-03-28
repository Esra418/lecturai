"use client";

import { useMemo, useState } from "react";
import { isYoutubeUrl } from "@/lib/youtube";

type Question = {
  question: string;
  options: string[];
  correct: number;
  timestamp: string;
};

type AnalysisResponse = {
  videoId: string;
  analysis: {
    summary: string;
    criticalMoments: { startSeconds: number; title: string; reason: string }[];
    difficulty: "kolay" | "orta" | "zor";
    questions?: Question[];
  };
  transcript: {
    lines: { timestamp: string; startSeconds: number; text: string }[];
    truncated: boolean;
    totalCues: number;
  };
  meta: { transcriptTruncatedForModel: boolean };
};

function youtubeDeepLink(videoId: string, startSeconds: number) {
  const t = Math.max(0, Math.floor(startSeconds));
  return `https://www.youtube.com/watch?v=${videoId}&t=${t}s`;
}

function difficultyLabel(d: AnalysisResponse["analysis"]["difficulty"]) {
  switch (d) {
    case "kolay": return "Kolay";
    case "orta": return "Orta";
    case "zor": return "Zor";
    default: return d;
  }
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const isValidYoutubeUrl = useMemo(() => isYoutubeUrl(videoUrl), [videoUrl]);

  async function handleAnalyze() {
    if (!isValidYoutubeUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl.trim() }),
      });
      const data = (await res.json()) as { error?: string } | AnalysisResponse;
      if (!res.ok) {
        setError("error" in data && data.error ? data.error : "Bir sorun olustu, tekrar deneyin.");
        return;
      }
      setResult(data as AnalysisResponse);
    } catch {
      setError("Ag hatasi — baglantiyi kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.14),transparent_35%)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-20 sm:px-10">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
          <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-zinc-300">
            AI Study Companion
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            LectuAI
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-zinc-300 sm:text-lg">
            YouTube ders videolarindaki kritik dakikalari saniyeler icinde bul, o ana atla ve sinava odaklan.
          </p>
          <div className="mt-10 flex w-full flex-col gap-3">
            <label htmlFor="youtube-link" className="text-sm text-zinc-400">YouTube linki</label>
            <input
              id="youtube-link"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              className="h-14 w-full rounded-2xl border border-white/15 bg-zinc-900/80 px-5 text-base text-white placeholder:text-zinc-500 outline-none ring-indigo-400/60 transition focus:border-indigo-400/70 focus:ring-2"
            />
            <button
              type="button"
              disabled={!isValidYoutubeUrl || loading}
              onClick={handleAnalyze}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:w-fit sm:min-w-40"
            >
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                  Analiz ediliyor…
                </>
              ) : "Analiz Et"}
            </button>
            {!isValidYoutubeUrl && videoUrl.trim().length > 0 ? (
              <p className="text-sm text-rose-300">Lutfen gecerli bir YouTube linki gir.</p>
            ) : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>

          {result ? (
            <div className="mt-10 space-y-8 border-t border-white/10 pt-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200">
                  Zorluk: {difficultyLabel(result.analysis.difficulty)}
                </span>
                {result.meta.transcriptTruncatedForModel ? (
                  <span className="text-xs text-amber-200/90">Uzun video: transkript kisaltildi.</span>
                ) : null}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">Ozet</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                  {result.analysis.summary}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">Kritik dakikalar</h2>
                <ul className="mt-3 space-y-3">
                  {result.analysis.criticalMoments.map((m) => (
                    <li key={`${m.startSeconds}-${m.title}`} className="rounded-2xl border border-rose-400/25 bg-rose-500/5 p-4">
                      <a href={youtubeDeepLink(result.videoId, m.startSeconds)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                        {m.title}{" "}
                        <span className="font-normal text-zinc-400">
                          ({Math.floor(m.startSeconds / 60)}:{(Math.floor(m.startSeconds) % 60).toString().padStart(2, "0")})
                        </span>
                      </a>
                      <p className="mt-1 text-sm text-zinc-400">{m.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {result.analysis.questions && result.analysis.questions.length > 0 ? (
                <div>
                  <h2 className="text-lg font-semibold text-white">Sinav sorulari</h2>
                  <ul className="mt-3 space-y-4">
                    {result.analysis.questions.map((q, qi) => (
                      <li key={qi} className="rounded-2xl border border-indigo-400/25 bg-indigo-500/5 p-4">
                        <p className="text-sm font-semibold text-white">{qi + 1}. {q.question}</p>
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, oi) => (
                            <li key={oi} className={`text-sm px-3 py-1 rounded-lg ${oi === q.correct ? "text-emerald-300 font-semibold" : "text-zinc-400"}`}>
                              {opt}
                            </li>
                          ))}
                        </ul>
                        {q.timestamp ? (
                          <p className="mt-2 text-xs text-indigo-300">Bu konuya git: {q.timestamp}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h2 className="text-lg font-semibold text-white">Transkript (onizleme)</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {result.transcript.totalCues} satir{result.transcript.truncated ? " — ilk 200 satir" : ""}
                </p>
                <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/50 p-4 text-sm">
                  <ul className="space-y-2">
                    {result.transcript.lines.map((line, i) => (
                      <li key={`${line.startSeconds}-${i}`} className="text-zinc-300">
                        <span className="font-mono text-xs text-indigo-300/90">{line.timestamp}</span>{" "}
                        {line.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
