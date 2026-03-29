"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/storage";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    if (!name.trim() || !department.trim() || !examDate) return;
    setLoading(true);
    saveProfile({ name: name.trim(), department: department.trim(), examDate });
    setTimeout(() => router.push("/"), 500);
  }

  const daysToExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.1),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300 mb-4">
            AI Study Companion
          </span>
          <h1 className="text-4xl font-bold text-white">Lecturai</h1>
          <p className="mt-2 text-zinc-400 text-sm">Sana özel koçun hazırlanıyor 🎓</p>
        </div>

        {/* Kart */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/50">

          {/* Adım göstergesi */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-indigo-500" : "bg-white/10"}`} />
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Merhaba! Ben Lecturai 👋</h2>
              <p className="text-zinc-400 text-sm mb-6">Sana özel çalışma koçun olmak için seni tanımam lazım. Adın ne?</p>
              <input
                type="text"
                placeholder="Adın ve soyadın..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(2)}
                autoFocus
                className="w-full rounded-2xl border border-white/15 bg-zinc-900/80 px-5 py-4 text-base text-white placeholder:text-zinc-500 outline-none focus:border-indigo-400/70 focus:ring-2 ring-indigo-400/30"
              />
              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="mt-4 w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-400 transition"
              >
                Devam Et →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Merhaba, {name}! 🎯</h2>
              <p className="text-zinc-400 text-sm mb-6">Hangi bölümde okuyorsun? Sana uygun sorular üreteyim.</p>
              <input
                type="text"
                placeholder="Bölümün (örn: Tıp, Hukuk, Mühendislik...)"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && department.trim() && setStep(3)}
                autoFocus
                className="w-full rounded-2xl border border-white/15 bg-zinc-900/80 px-5 py-4 text-base text-white placeholder:text-zinc-500 outline-none focus:border-indigo-400/70 focus:ring-2 ring-indigo-400/30"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-zinc-400 hover:bg-white/10 transition"
                >
                  ← Geri
                </button>
                <button
                  onClick={() => department.trim() && setStep(3)}
                  disabled={!department.trim()}
                  className="flex-1 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-400 transition"
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Son bir şey! 📅</h2>
              <p className="text-zinc-400 text-sm mb-6">En yakın sınavın ne zaman? Çalışma planını buna göre yapayım.</p>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-2xl border border-white/15 bg-zinc-900/80 px-5 py-4 text-base text-white outline-none focus:border-indigo-400/70 focus:ring-2 ring-indigo-400/30 [color-scheme:dark]"
              />
              {daysToExam !== null && daysToExam > 0 && (
                <div className="mt-3 rounded-xl border border-indigo-400/20 bg-indigo-500/5 px-4 py-3">
                  <p className="text-sm text-indigo-300">
                    🎓 Sınavına <span className="font-bold">{daysToExam} gün</span> kaldı. Hemen başlayalım!
                  </p>
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-zinc-400 hover:bg-white/10 transition"
                >
                  ← Geri
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!examDate || loading}
                  className="flex-1 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-400 transition"
                >
                  {loading ? "Hazırlanıyor..." : "Koçumu Başlat 🚀"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Bilgilerin sadece bu cihazda saklanır. Hesap gerekmez.
        </p>
      </div>
    </main>
  );
}
