"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, getStats, getVideos, getQuizzes, type Stats, type VideoRecord, type QuizRecord } from "@/lib/storage";

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-indigo-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (!profile) {
      router.push("/onboarding");
      return;
    }
    setName(profile.name);
    setExamDate(profile.examDate);
    setStats(getStats());
    setVideos(getVideos());
    setQuizzes(getQuizzes());
    setMounted(true);
  }, [router]);

  const daysToExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)
    : null;

  if (!mounted || !stats) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_45%)]" />

      <div className="relative mx-auto max-w-5xl px-6 py-10 sm:px-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push("/")} className="text-xs text-zinc-500 hover:text-zinc-300 mb-3 flex items-center gap-1">
              ← Ana Sayfa
            </button>
            <h1 className="text-3xl font-bold text-white">Merhaba, {name} 👋</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {daysToExam !== null && daysToExam > 0
                ? `Sınavına ${daysToExam} gün kaldı — ${daysToExam <= 7 ? "🔥 Son düzlük!" : "💪 Devam et!"}`
                : daysToExam === 0
                ? "🎯 Sınav günü! Başarılar!"
                : "📅 Çalışmaya devam et!"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-400">{stats.streak}</div>
            <div className="text-xs text-zinc-400">günlük seri 🔥</div>
          </div>
        </div>

        {/* Streak Banner */}
        {stats.streak > 0 && (
          <div className="mb-6 rounded-2xl border border-orange-400/20 bg-orange-500/5 p-4 flex items-center gap-4">
            <span className="text-3xl">{"🔥".repeat(Math.min(stats.streak, 5))}</span>
            <div>
              <p className="text-sm font-semibold text-orange-300">{stats.streak} günlük çalışma serisi!</p>
              <p className="text-xs text-zinc-400">
                {stats.streak >= 7 ? "Muhteşem! Bir hafta boyunca her gün çalıştın." :
                 stats.streak >= 3 ? "Harika gidiyorsun, durma!" :
                 "İyi başlangıç! Yarın da devam et."}
              </p>
            </div>
          </div>
        )}

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <StatCard icon="🎬" label="Analiz edilen video" value={stats.totalVideos} />
          <StatCard icon="📝" label="Çözülen sınav" value={stats.totalQuizzes} />
          <StatCard
            icon="🎯"
            label="Başarı oranı"
            value={`%${stats.successRate}`}
            sub={`${stats.totalCorrect}/${stats.totalQuestions} doğru`}
          />
          <StatCard
            icon="🔥"
            label="Günlük seri"
            value={stats.streak}
            sub={stats.streak > 0 ? "Devam et!" : "Bugün başla!"}
          />
        </div>

        {/* Zayıf Konular */}
        {stats.weakTopics.length > 0 && (
          <div className="mb-8 rounded-2xl border border-rose-400/20 bg-rose-500/5 p-5">
            <h2 className="text-base font-semibold text-rose-300 mb-3">⚠️ Tekrar Edilmesi Gereken Konular</h2>
            <div className="flex flex-wrap gap-2">
              {stats.weakTopics.map((topic, i) => (
                <span key={i} className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-300">
                  {topic.slice(0, 50)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">Bu konuları içeren videoları tekrar analiz etmeni öneririm.</p>
          </div>
        )}

        {/* AI Koç Önerisi */}
        <div className="mb-8 rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-5">
          <div className="flex gap-3 items-start">
            <span className="text-2xl">🎓</span>
            <div>
              <p className="text-sm font-semibold text-indigo-300 mb-1">Koçundan bugünkü öneri</p>
              <p className="text-sm text-zinc-300">
                {stats.totalVideos === 0
                  ? `${name}, henüz hiç video analiz etmemişsin. Hemen bir YouTube ders videosu yapıştır ve başla!`
                  : stats.successRate < 50
                  ? `${name}, başarı oranın %${stats.successRate}. Zayıf konularına odaklan ve tekrar quiz çöz.`
                  : stats.successRate < 75
                  ? `${name}, iyi gidiyorsun! %${stats.successRate} başarı oranını %80'e çıkarmak için zor sorulara odaklan.`
                  : daysToExam && daysToExam <= 3
                  ? `${name}, sınavına ${daysToExam} gün kaldı! Kritik dakikaları tekrar gözden geçir ve son bir quiz çöz.`
                  : `${name}, harika bir performans! %${stats.successRate} başarı oranın çok iyi. Yeni videolarla konuları genişlet.`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Son Videolar */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3">🎬 Son Analiz Edilen Videolar</h2>
            {videos.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-zinc-500 text-sm">Henüz video analiz etmedin.</p>
                <button onClick={() => router.push("/")} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
                  İlk videoyu analiz et →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.slice(0, 5).map((v, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-zinc-200 font-medium line-clamp-1">{v.title || `Video ${v.videoId}`}</p>
                      {v.score !== undefined && (
                        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          v.score / (v.totalQuestions || 1) >= 0.7
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}>
                          %{Math.round((v.score / (v.totalQuestions || 1)) * 100)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(v.analyzedAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Son Sınavlar */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3">📝 Son Sınavlar</h2>
            {quizzes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-zinc-500 text-sm">Henüz sınav çözmedin.</p>
                <button onClick={() => router.push("/")} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
                  Sınav çöz →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.slice(0, 5).map((q, i) => {
                  const pct = Math.round((q.score / q.total) * 100);
                  return (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-200">{q.score}/{q.total} doğru</span>
                        <span className={`text-sm font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                          %{pct}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1.5">
                        {new Date(q.date).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ana sayfaya git */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-indigo-500 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-400 transition"
          >
            Yeni Video Analiz Et 🚀
          </button>
        </div>

      </div>
    </main>
  );
}
