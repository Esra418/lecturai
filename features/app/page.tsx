"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isYoutubeUrl } from "@/lib/youtube";
import { getProfile, saveVideoRecord, updateStreak } from "@/lib/storage";
type Question = {
  question: string;
  options: string[];
  correct: number;
  timestamp: string;
};

type StudySection = {
  heading: string;
  content: string;
  keyPoints: string[];
  timestamp: string;
  startSeconds: number;
};

type StudyNotes = {
  title: string;
  sections: StudySection[];
  importantTerms: { term: string; definition: string }[];
  conclusion: string;
};

type AnalysisResponse = {
  videoId: string;
  fullTranscript: string;
  analysis: {
    summary: string;
    studyNotes?: StudyNotes;
    criticalMoments: { startSeconds: number; title: string; reason: string }[];
    difficulty: "kolay" | "orta" | "zor";
    questions: Question[];
  };
  transcript: {
    lines: { timestamp: string; startSeconds: number; text: string }[];
    truncated: boolean;
    totalCues: number;
  };
  meta: { transcriptTruncatedForModel: boolean };
};

type ChatMessage = { role: "user" | "ai"; text: string };

const LOADING_STEPS = [
  { icon: "🎧", text: "Video transkripti alınıyor…" },
  { icon: "🧠", text: "İçerik analiz ediliyor…" },
  { icon: "🔥", text: "Kritik dakikalar tespit ediliyor…" },
  { icon: "📝", text: "Ders notları hazırlanıyor…" },
  { icon: "🎯", text: "Sınav soruları üretiliyor…" },
];

const COACH_TIPS = [
  "Sınava 2 gün mi kaldı? Panik yapma — doğru konulara odaklan.",
  "Kritik dakikaları izle, gerisini geç. Zaman senin en değerli varlığın.",
  "Yanlış cevaplar seni o konuya geri götürür. Hata yapmaktan korkma!",
  "Videoyu baştan sona izleme. Akıllı çalış, çok değil.",
  "Özet okumak güzel, soru çözmek daha güzel. Sınavı başlat!",
];

function youtubeDeepLink(videoId: string, timestamp: string) {
  const parts = timestamp.split(":");
  const seconds =
    parts.length === 2
      ? parseInt(parts[0]) * 60 + parseInt(parts[1])
      : parseInt(parts[0]);
  return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
}

function difficultyLabel(d: AnalysisResponse["analysis"]["difficulty"]) {
  switch (d) {
    case "kolay": return "Kolay";
    case "orta": return "Orta";
    case "zor": return "Zor";
    default: return d;
  }
}

// ── Loading Overlay ──────────────────────────────────────────────────────────
function LoadingOverlay() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((i) => (i + 1) % LOADING_STEPS.length);
    }, 2200);
    const progressInterval = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + 0.6));
    }, 80);
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const step = LOADING_STEPS[stepIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md">
      <div className="relative mb-10 flex items-center justify-center">
        <span className="absolute size-32 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDuration: "2.4s" }} />
        <span className="absolute size-24 rounded-full border border-indigo-400/30 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.3s" }} />
        <span className="absolute size-16 rounded-full border border-indigo-300/40 animate-ping" style={{ animationDuration: "1.2s", animationDelay: "0.6s" }} />
        <div className="relative z-10 flex size-20 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-400/40">
          <span className="text-3xl">{step.icon}</span>
        </div>
      </div>
      <p className="mb-2 text-xs font-medium tracking-widest text-indigo-400 uppercase">Lecturai</p>
      <p className="mb-8 text-lg font-medium text-white text-center px-8" style={{ minHeight: "1.8rem" }}>
        {step.text}
      </p>
      <div className="w-64 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-zinc-500">{Math.round(progress)}%</p>
    </div>
  );
}

// ── Coach Card ───────────────────────────────────────────────────────────────
function CoachCard() {
  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % COACH_TIPS.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-8 rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-5 flex gap-4 items-start">
      <div className="shrink-0 size-10 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg">
        🎓
      </div>
      <div>
        <p className="text-xs font-semibold text-indigo-400 mb-1 uppercase tracking-wide">Koçun diyor ki</p>
        <p
          className="text-sm leading-6 text-zinc-300 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {COACH_TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}

// ── PDF Print ────────────────────────────────────────────────────────────────
function printPDF(analysis: AnalysisResponse["analysis"], videoId: string) {
  const notes = analysis.studyNotes;
  const title = notes?.title || "Ders Notu";

  let html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${title}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a2e;background:white;padding:40px;line-height:1.7}.header{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:28px 32px;border-radius:12px;margin-bottom:28px}.header h1{font-size:22px;font-weight:700;margin-bottom:6px}.badge{display:inline-block;background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:20px;font-size:10px;margin-bottom:10px}.section-title{font-size:15px;font-weight:700;color:#4f46e5;border-bottom:2px solid #e0e7ff;padding-bottom:6px;margin:24px 0 12px;text-transform:uppercase}.summary-box{background:#f8f7ff;border-left:4px solid #4f46e5;padding:14px 18px;border-radius:0 8px 8px 0;color:#374151;margin-bottom:8px}.note-card{border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin-bottom:16px;page-break-inside:avoid}.timestamp-badge{background:#ede9fe;color:#5b21b6;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}.key-point{display:flex;gap:8px;margin-bottom:5px;color:#374151;font-size:12px}.key-point::before{content:"•";color:#4f46e5;font-weight:bold}.terms-box{background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:18px;margin-bottom:16px}.critical-item{border-left:3px solid #ef4444;padding:10px 14px;margin-bottom:10px;background:#fff5f5;border-radius:0 8px 8px 0;page-break-inside:avoid}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:11px}@media print{body{padding:20px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
  </head><body>
  <div class="header"><div class="badge">Lecturai — AI Study Companion</div><h1>${title}</h1><p>Video: youtube.com/watch?v=${videoId}</p></div>
  <div class="section-title">Genel Özet</div><div class="summary-box">${analysis.summary}</div>`;

  if (notes?.sections?.length) {
    html += `<div class="section-title">Ders Notları</div>`;
    notes.sections.forEach((s, i) => {
      const min = Math.floor(s.startSeconds / 60);
      const sec = (Math.floor(s.startSeconds) % 60).toString().padStart(2, "0");
      html += `<div class="note-card"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><h3 style="font-size:14px;font-weight:700;color:#1e1b4b">${i + 1}. ${s.heading}</h3><span class="timestamp-badge">${min}:${sec}</span></div><p style="color:#4b5563;margin-bottom:10px">${s.content}</p>${s.keyPoints?.length ? s.keyPoints.map(p => `<div class="key-point">${p}</div>`).join("") : ""}</div>`;
    });
  }

  if (notes?.importantTerms?.length) {
    html += `<div class="terms-box"><h2 style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:12px">📚 Önemli Terimler</h2>${notes.importantTerms.map(t => `<div style="margin-bottom:10px"><div style="font-weight:700;color:#78350f">${t.term}</div><div style="color:#57534e;font-size:12px">${t.definition}</div></div>`).join("")}</div>`;
  }

  if (analysis.criticalMoments?.length) {
    html += `<div class="section-title">Kritik Dakikalar</div>`;
    analysis.criticalMoments.forEach(m => {
      const min = Math.floor(m.startSeconds / 60);
      const sec = (Math.floor(m.startSeconds) % 60).toString().padStart(2, "0");
      html += `<div class="critical-item"><div style="font-size:11px;font-weight:700;color:#ef4444;margin-bottom:4px">[${min}:${sec}]</div><div style="font-weight:700;color:#1a1a2e;font-size:13px;margin-bottom:3px">${m.title}</div><div style="color:#6b7280;font-size:12px">${m.reason}</div></div>`;
    });
  }

  html += `<div class="footer">Bu ders notu <strong>Lecturai</strong> yapay zekası tarafından otomatik oluşturulmuştur.</div></body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ── Study Notes ──────────────────────────────────────────────────────────────
function StudyNotesSection({ notes, summary, videoId }: { notes?: StudyNotes; summary: string; videoId: string }) {
  if (!notes) return <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">{summary}</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm leading-7 text-zinc-400 italic">{summary}</p>
      {notes.sections.map((s, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{s.heading}</h3>
            <a href={`https://www.youtube.com/watch?v=${videoId}&t=${s.startSeconds}s`} target="_blank" rel="noreferrer"
              className="shrink-0 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300 hover:bg-indigo-500/20">
              {Math.floor(s.startSeconds / 60)}:{(Math.floor(s.startSeconds) % 60).toString().padStart(2, "0")} →
            </a>
          </div>
          <p className="mt-2 text-sm leading-7 text-zinc-300">{s.content}</p>
          {s.keyPoints?.length > 0 && (
            <ul className="mt-3 space-y-1">
              {s.keyPoints.map((p, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-indigo-400" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {notes.importantTerms?.length > 0 && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
          <h3 className="mb-3 text-base font-semibold text-amber-200">📚 Önemli Terimler</h3>
          <dl className="space-y-2">
            {notes.importantTerms.map((t, i) => (
              <div key={i}>
                <dt className="text-sm font-medium text-amber-300">{t.term}</dt>
                <dd className="text-sm text-zinc-400">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {notes.conclusion && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5">
          <h3 className="mb-2 text-base font-semibold text-emerald-200">✅ Sonuç</h3>
          <p className="text-sm leading-7 text-zinc-300">{notes.conclusion}</p>
        </div>
      )}
    </div>
  );
}


// ── Quiz Setup ───────────────────────────────────────────────────────────────
function QuizSetup({
  onStart,
}: {
  onStart: (count: number, difficulty: "kolay" | "orta" | "zor" | "karisik") => void;
}) {
  const [count, setCount] = useState(10);
  const [inputValue, setInputValue] = useState("10");
  const [difficulty, setDifficulty] = useState<"kolay" | "orta" | "zor" | "karisik">("karisik");

  const MAX = 50;

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1 && val <= MAX) {
      setCount(val);
    }
  }

  function handleInputBlur() {
    const val = parseInt(inputValue);
    if (isNaN(val) || val < 1) {
      setCount(1);
      setInputValue("1");
    } else if (val > MAX) {
      setCount(MAX);
      setInputValue(String(MAX));
    } else {
      setCount(val);
      setInputValue(String(val));
    }
  }

  const difficultyOptions = [
    { value: "kolay" as const, label: "😌 Kolay", desc: "Temel kavramlar" },
    { value: "orta" as const, label: "🤔 Orta", desc: "Anlama soruları" },
    { value: "zor" as const, label: "🔥 Zor", desc: "Derin analiz" },
    { value: "karisik" as const, label: "🎲 Karışık", desc: "Her seviyeden" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
      {/* Coach */}
      <div className="mb-6 flex gap-3 items-start rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-4">
        <span className="text-xl">🎓</span>
        <div>
          <p className="text-xs font-semibold text-indigo-400 mb-1">Koçun önerisi</p>
          <p className="text-sm text-zinc-300">
            Kısa sınavlar için 10, kapsamlı çalışma için 20-30 soru öneririm. Max 50 soru seçebilirsin!
          </p>
        </div>
      </div>

      {/* Soru sayısı */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-zinc-200">
          Soru sayısı <span className="text-zinc-500 text-xs">(1-50)</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={MAX}
            value={count}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCount(val);
              setInputValue(String(val));
            }}
            className="flex-1 accent-indigo-500"
          />
          <input
            type="number"
            min={1}
            max={MAX}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-16 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-center text-sm font-semibold text-indigo-400 outline-none focus:border-indigo-400/70"
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-zinc-500">
          <span>1</span>
          <span>50</span>
        </div>
      </div>

      {/* Zorluk */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-medium text-zinc-200">Zorluk seviyesi</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDifficulty(opt.value)}
              className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                difficulty === opt.value
                  ? "border-indigo-400/60 bg-indigo-500/20 text-white"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onStart(count, difficulty)}
        className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 transition"
      >
        Sınavı Başlat 🎯
      </button>
    </div>
  );
}
function QuizSection({
  questions,
  videoId,
  transcriptText,
}: {
  questions: Question[];
  videoId: string;
  transcriptText: string;
}) {
  const [phase, setPhase] = useState<"setup" | "quiz" | "finished" | "requiz">("setup");
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [requizRound, setRequizRound] = useState(0);
  const [requizLoading, setRequizLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<"kolay" | "orta" | "zor" | "karisik">("karisik");

  function handleStart(count: number, diff: "kolay" | "orta" | "zor" | "karisik") {
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, count);
    setActiveQuestions(shuffled);
    setDifficulty(diff);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setWrongQuestions([]);
    setRequizRound(0);
    setPhase("quiz");
  }

  async function handleRequiz() {
    if (requizRound >= 3) return;
    setRequizLoading(true);
    try {
      const res = await fetch("/api/requiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wrongTopics: wrongQuestions.map((q) => ({
            question: q.question,
            correctAnswer: q.options[q.correct],
            timestamp: q.timestamp,
          })),
          transcript: transcriptText,
          difficulty,
          round: requizRound + 1,
        }),
      });
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        setActiveQuestions(data.questions);
        setCurrent(0);
        setSelected(null);
        setScore(0);
        setWrongQuestions([]);
        setRequizRound((r) => r + 1);
        setPhase("quiz");
      }
    } catch {
      // sessizce geç
    } finally {
      setRequizLoading(false);
    }
  }

  if (phase === "setup") {
    return <QuizSetup onStart={handleStart} />;
  }

  if (phase === "finished") {
    const pct = Math.round((score / activeQuestions.length) * 100);
    const hasWrong = wrongQuestions.length > 0;
    const canRequiz = hasWrong && requizRound < 3;

    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-center">
        <div className="text-5xl mb-4">{pct === 100 ? "🏆" : pct >= 60 ? "💪" : "📚"}</div>
        <h3 className="text-2xl font-bold text-white">Sınav Bitti!</h3>
        <p className="mt-3 text-5xl font-semibold text-indigo-300">{score} / {activeQuestions.length}</p>

        {requizRound > 0 && (
          <p className="mt-2 text-xs text-zinc-500">{requizRound}. tekrar turu</p>
        )}

        <div className="mt-5 rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-4 text-left flex gap-3">
          <span className="text-xl">🎓</span>
          <p className="text-sm text-zinc-300">
            {pct === 100
              ? "Mükemmel! Tüm soruları doğru bildin. Bu videoyu tam anlamışsın!"
              : pct >= 60
              ? "İyi iş! Yanlış cevapladığın konuları tekrar çalışmanı öneririm."
              : "Henüz hazır değilsin. Kritik dakikaları bir daha izle ve tekrar dene."}
          </p>
        </div>

        {hasWrong && (
          <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/5 p-3 text-left">
            <p className="text-xs text-rose-300 font-medium mb-1">Yanlış yaptığın konular:</p>
            <ul className="space-y-1">
              {wrongQuestions.map((q, i) => (
                <li key={i} className="text-xs text-zinc-400">• {q.question.slice(0, 60)}...</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <button onClick={() => setPhase("setup")}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10">
            Ayarları Değiştir
          </button>
          <button onClick={() => handleStart(activeQuestions.length, difficulty)}
            className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-5 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/20">
            Aynı Soruları Tekrar Çöz
          </button>
          {canRequiz && (
            <button
              onClick={handleRequiz}
              disabled={requizLoading}
              className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {requizLoading
                ? "Yeni sorular hazırlanıyor…"
                : `Yanlış Konulardan Yeni Sorular (${3 - requizRound} hak kaldı)`}
            </button>
          )}
          {hasWrong && requizRound >= 3 && (
            <p className="w-full text-xs text-zinc-500 text-center">
              Maksimum tekrar hakkına ulaştın. Bu konuları videoda tekrar izlemeyi dene.
            </p>
          )}
        </div>
      </div>
    );
  }

  const q = activeQuestions[current];

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
      {requizRound > 0 && (
        <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-amber-300">🔄 {requizRound}. tekrar turu — yanlış yaptığın konulardan yeni sorular</p>
        </div>
      )}
      <div className="mb-5 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${(current / activeQuestions.length) * 100}%` }} />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-zinc-400">Soru {current + 1} / {activeQuestions.length}</span>
        <span className="text-xs text-indigo-300">Skor: {score}</span>
      </div>
      <p className="text-base font-medium text-white">{q.question}</p>
      <ul className="mt-4 space-y-2">
        {q.options.map((opt, idx) => {
          let cls = "w-full rounded-xl border px-4 py-3 text-left text-sm transition ";
          if (selected === null) cls += "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10";
          else if (idx === q.correct) cls += "border-emerald-400/60 bg-emerald-500/15 text-emerald-200";
          else if (idx === selected) cls += "border-rose-400/60 bg-rose-500/15 text-rose-200";
          else cls += "border-white/10 bg-white/5 text-zinc-500";
          return (
            <li key={idx}>
              <button className={cls} onClick={() => {
                if (selected !== null) return;
                setSelected(idx);
                if (idx === q.correct) {
                  setScore((s) => s + 1);
                } else {
                  setWrongQuestions((prev) => [...prev, q]);
                }
              }}>{opt}</button>
            </li>
          );
        })}
      </ul>
      {selected !== null && (
        <div className="mt-4 space-y-3">
          {(q as any).explanation && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-2">
              <p className="text-xs text-emerald-300">💡 {(q as any).explanation}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            {selected !== q.correct && (
              <a href={youtubeDeepLink(videoId, q.timestamp)} target="_blank" rel="noreferrer"
                className="rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300 hover:bg-indigo-500/20">
                Bu konuya git →
              </a>
            )}
            <button
              onClick={() => {
                if (current + 1 >= activeQuestions.length) setPhase("finished");
                else { setCurrent((c) => c + 1); setSelected(null); }
              }}
              className="ml-auto rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
              {current + 1 >= activeQuestions.length ? "Sonucu Gör" : "Sonraki Soru →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────
function ChatSection({ transcriptText }: { transcriptText: string; videoId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Merhaba! Ben Lecturai koçunum 🎓 Bu video hakkında aklına takılan her şeyi sorabilirsin. Kritik konular, anlamadığın noktalar, sınav tahmini — her şey!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          transcript: transcriptText,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply || "Bir hata oluştu." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Bağlantı hatası, tekrar dene." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div className="mr-2 mt-1 shrink-0 size-6 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs">🎓</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 ${m.role === "user" ? "bg-indigo-500 text-white" : "bg-white/10 text-zinc-200"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 shrink-0 size-6 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs">🎓</div>
            <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-zinc-400">
              <span className="animate-pulse">Düşünüyor…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input type="text" placeholder="Koçuna bir şey sor…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 rounded-xl border border-white/15 bg-zinc-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-indigo-400/70" />
        <button onClick={handleSend} disabled={!input.trim() || loading}
          className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-400">
          Gönder
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"notlar" | "kritik" | "sinav" | "sohbet">("notlar");
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

useEffect(() => {
    const profile = getProfile();
    if (!profile) {
      router.push("/onboarding");
    } else {
      setUserName(profile.name);
      updateStreak();
    }
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as "notlar" | "kritik" | "sinav" | "sohbet" | null;
    if (tab) setActiveTab(tab);
  }, [router]);

  const isValidYoutubeUrl = useMemo(() => isYoutubeUrl(videoUrl), [videoUrl]);

  async function handleAnalyze() {
    if (!isValidYoutubeUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveTab("notlar");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl.trim(), quizCount: 20 }),
      });
      const data = (await res.json()) as { error?: string } | AnalysisResponse;
      if (!res.ok) {
        setError("error" in data && data.error ? data.error : "Bir sorun oluştu, tekrar deneyin.");
        return;
      }
      setResult(data as AnalysisResponse);
    } catch {
      setError("Ağ hatası — bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "notlar", label: "📖 Ders Notları" },
    { id: "kritik", label: "🔥 Kritik Dakikalar" },
    { id: "sinav", label: "🎯 Sınav" },
    { id: "sohbet", label: "💬 AI Koç" },
  ] as const;

  return (
    <>
      {loading && <LoadingOverlay />}
      <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.14),transparent_35%)]" />
        <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-20 sm:px-10">
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">

            <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-zinc-300">AI Study Companion</span>
            {/* Dashboard linki */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition"
              >
                {userName && <span className="text-indigo-400">👋 {userName}</span>}
                <span>📊 Dashboard</span>
              </button>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">Lecturai</h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-zinc-300 sm:text-lg">
              YouTube ders videolarındaki kritik dakikaları saniyeler içinde bul, o ana atla ve sınava odaklan.
            </p>

            {!result && <CoachCard />}

            <div className="mt-8 flex w-full flex-col gap-3">
              <label htmlFor="youtube-link" className="text-sm text-zinc-400">YouTube linki</label>
              <input id="youtube-link" type="url" inputMode="url" autoComplete="off"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                className="h-14 w-full rounded-2xl border border-white/15 bg-zinc-900/80 px-5 text-base text-white placeholder:text-zinc-500 outline-none ring-indigo-400/60 transition focus:border-indigo-400/70 focus:ring-2" />
              <button type="button" disabled={!isValidYoutubeUrl || loading} onClick={handleAnalyze}
                className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:w-fit sm:min-w-40">
                {loading
                  ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />Analiz ediliyor…</>
                  : "Analiz Et"}
              </button>
              {!isValidYoutubeUrl && videoUrl.trim().length > 0 && (
                <p className="text-sm text-rose-300">Lütfen geçerli bir YouTube linki gir.</p>
              )}
              {error && <p className="text-sm text-rose-300">{error}</p>}
            </div>

            {result && (
              <div className="mt-10 border-t border-white/10 pt-10">
                {/* Coach success */}
                <div className="mb-6 flex gap-3 items-start rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <span className="text-xl">🎓</span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 mb-1">Koçun</p>
                    <p className="text-sm text-zinc-300">
                      Harika! Video analiz edildi. Önce kritik dakikaları gör, sonra sınavı çöz. Başarılar!
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200">
                      Zorluk: {difficultyLabel(result.analysis.difficulty)}
                    </span>
                    {result.meta.transcriptTruncatedForModel && (
                      <span className="text-xs text-amber-200/90">Uzun video: transkript kısaltıldı.</span>
                    )}
                  </div>
                  <button onClick={() => printPDF(result.analysis, result.videoId)}
                    className="flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 transition">
                    📄 PDF İndir
                  </button>
                </div>

                <div className="mb-6 flex gap-2 flex-wrap">
                  {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? "bg-indigo-500 text-white" : "border border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "notlar" && (
                  <StudyNotesSection notes={result.analysis.studyNotes} summary={result.analysis.summary} videoId={result.videoId} />
                )}
                {activeTab === "kritik" && (
                  <ul className="space-y-3">
                    {result.analysis.criticalMoments.map((m) => (
                      <li key={`${m.startSeconds}-${m.title}`} className="rounded-2xl border border-rose-400/25 bg-rose-500/5 p-4">
                        <a href={`https://www.youtube.com/watch?v=${result.videoId}&t=${m.startSeconds}s`} target="_blank" rel="noreferrer"
                          className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                          {m.title}{" "}
                          <span className="font-normal text-zinc-400">
                            ({Math.floor(m.startSeconds / 60)}:{(Math.floor(m.startSeconds) % 60).toString().padStart(2, "0")})
                          </span>
                        </a>
                        <p className="mt-1 text-sm text-zinc-400">{m.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {activeTab === "sinav" && (
                  result.analysis.questions?.length > 0
                    ? <QuizSection questions={result.analysis.questions} videoId={result.videoId} transcriptText={result.fullTranscript || ""} />
                    : <p className="text-sm text-zinc-400">Soru üretilemedi, videoyu tekrar analiz et.</p>
                )}
                {activeTab === "sohbet" && (
                  <ChatSection transcriptText={result.fullTranscript || ""} videoId={result.videoId} />
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
