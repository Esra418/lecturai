// ── Tipler ───────────────────────────────────────────────────────────────────

export type UserProfile = {
  name: string;
  department: string;
  examDate: string; // ISO string
};

export type VideoRecord = {
  videoId: string;
  title: string;
  analyzedAt: string; // ISO string
  score?: number;       // son quiz skoru
  totalQuestions?: number;
};

export type QuizRecord = {
  videoId: string;
  score: number;
  total: number;
  date: string; // ISO string
  wrongTopics: string[];
};

export type LecturaiStorage = {
  profile: UserProfile | null;
  videos: VideoRecord[];
  quizzes: QuizRecord[];
  lastActive: string; // ISO string — streak için
  streak: number;
};

const STORAGE_KEY = "lecturai_data";

const DEFAULT: LecturaiStorage = {
  profile: null,
  videos: [],
  quizzes: [],
  lastActive: "",
  streak: 0,
};

// ── Okuma / Yazma ─────────────────────────────────────────────────────────────

export function getStorage(): LecturaiStorage {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function setStorage(data: LecturaiStorage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage dolu olabilir
  }
}

// ── Profil ────────────────────────────────────────────────────────────────────

export function saveProfile(profile: UserProfile): void {
  const data = getStorage();
  setStorage({ ...data, profile });
}

export function getProfile(): UserProfile | null {
  return getStorage().profile;
}

// ── Video Kaydı ───────────────────────────────────────────────────────────────

export function saveVideoRecord(record: VideoRecord): void {
  const data = getStorage();
  const exists = data.videos.findIndex((v) => v.videoId === record.videoId);
  if (exists >= 0) {
    data.videos[exists] = record;
  } else {
    data.videos = [record, ...data.videos].slice(0, 50); // max 50 video
  }
  setStorage(data);
}

export function getVideos(): VideoRecord[] {
  return getStorage().videos;
}

// ── Quiz Kaydı ────────────────────────────────────────────────────────────────

export function saveQuizRecord(record: QuizRecord): void {
  const data = getStorage();
  data.quizzes = [record, ...data.quizzes].slice(0, 100); // max 100 quiz
  setStorage(data);
}

export function getQuizzes(): QuizRecord[] {
  return getStorage().quizzes;
}

// ── Streak ────────────────────────────────────────────────────────────────────

export function updateStreak(): number {
  const data = getStorage();
  const today = new Date().toDateString();
  const lastActive = data.lastActive ? new Date(data.lastActive).toDateString() : "";
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let streak = data.streak;

  if (lastActive === today) {
    // Bugün zaten aktif, streak değişmez
  } else if (lastActive === yesterday) {
    // Dün aktifti, streak artır
    streak += 1;
  } else if (lastActive === "") {
    // İlk kez
    streak = 1;
  } else {
    // Ara verildi, sıfırla
    streak = 1;
  }

  setStorage({ ...data, lastActive: new Date().toISOString(), streak });
  return streak;
}

export function getStreak(): number {
  return getStorage().streak;
}

// ── İstatistikler ─────────────────────────────────────────────────────────────

export type Stats = {
  totalVideos: number;
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  successRate: number;
  weakTopics: string[];
  streak: number;
};

export function getStats(): Stats {
  const data = getStorage();
  const totalVideos = data.videos.length;
  const totalQuizzes = data.quizzes.length;
  const totalCorrect = data.quizzes.reduce((sum, q) => sum + q.score, 0);
  const totalQuestions = data.quizzes.reduce((sum, q) => sum + q.total, 0);
  const successRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // En çok yanlış yapılan konular
  const topicCounts: Record<string, number> = {};
  data.quizzes.forEach((q) => {
    q.wrongTopics.forEach((t) => {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });
  });
  const weakTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);

  return {
    totalVideos,
    totalQuizzes,
    totalCorrect,
    totalQuestions,
    successRate,
    weakTopics,
    streak: data.streak,
  };
}
